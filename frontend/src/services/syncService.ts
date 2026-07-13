/**
 * syncService.ts
 * API ↔ Dexie の同期を管理する。
 * オフライン時は sync_queue に積み、オンライン復帰時に一括送信する。
 */

import { db } from './db';
import type { LocalTask, LocalGoal, SyncQueueItem } from './db';
import { taskApi } from '../features/tasks/api/taskApi';
import { goalApi } from '../features/goals/api/goalApi';
import {
  initDoc,
  crdtUpsertTask,
  crdtDeleteTask,
  getDeviceId,
  getPullCursor,
  setPullCursor,
  applyRemoteChanges,
  reconcileServerSnapshot,
  syncDocToDexie,
} from './crdtStore';
import { crdtSyncApi } from './crdtSyncApi';

// ─── オンライン状態管理 ──────────────────────────────────────────
// navigator.onLine は「ネットワークインターフェースが有効か」を返すだけで、
// 実際にサーバーへ到達できるかどうかは関係ない。
// WiFiとキャリア両方OFFにしてもしばらくtrueのままになることもある。
// そのため、/api/health への実際のfetchで疎通を確認する方式に切り替える。

const HEALTH_URL = `${import.meta.env.VITE_API_URL}/api/health`;
const HEALTH_TIMEOUT_MS = 3000;

// 最後に確認したオンライン状態をメモリに保持（初期値はnavigator.onLineで仮置き）
let _isOnline: boolean = navigator.onLine;

/**
 * サーバーへの実際の疎通確認。
 * タイムアウト(3秒)またはfetch失敗でオフライン判定。
 */
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const res = await fetch(HEALTH_URL, {
      method: 'HEAD',
      cache:  'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    _isOnline = res.ok;
  } catch {
    _isOnline = false;
  }
  return _isOnline;
};

/**
 * 最後の疎通確認結果を返す（同期）。
 * 最新の状態が必要な場合は checkConnectivity() を先に呼ぶこと。
 */
export const isOnline = (): boolean => _isOnline;

// ブラウザの online/offline イベントでも即座に状態を更新
window.addEventListener('online',  () => { void checkConnectivity(); });
window.addEventListener('offline', () => { _isOnline = false; });

// 30秒ごとに定期チェック（タブがフォアグラウンドにある時のみ）
let _healthTimer: ReturnType<typeof setInterval> | null = null;
const startHealthCheck = () => {
  if (_healthTimer) return;
  _healthTimer = setInterval(() => {
    if (!document.hidden) void checkConnectivity();
  }, 30_000);
};
const stopHealthCheck = () => {
  if (_healthTimer) { clearInterval(_healthTimer); _healthTimer = null; }
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopHealthCheck();
  } else {
    void checkConnectivity();
    startHealthCheck();
  }
});

// 起動時に即チェック開始
void checkConnectivity();
startHealthCheck();

/**
 * fetch がネットワーク層で失敗したかどうかを判定する。
 * サーバーに届いてHTTPエラーになった場合（4xx/5xx）は status がセットされるので false。
 * ネットワーク疎通自体が失敗した場合（TypeError等）は status が undefined になるので true。
 */
export const isNetworkFailure = (err: any): boolean => err?.status === undefined;

// ─── ユーザーID キャッシュ ────────────────────────────────────────
// ログイン時に保存しておき、オフライン時に使う
const USER_ID_KEY = 'mokuvation_user_id';

export const cacheUserId = (userId: string): void => {
  localStorage.setItem(USER_ID_KEY, userId);
};

export const getCachedUserId = (): string | null => {
  return localStorage.getItem(USER_ID_KEY);
};

const normalizeTaskForStorage = (task: Partial<LocalTask> & { id: string }): LocalTask => ({
  id: String(task.id ?? ''),
  user_id: String(task.user_id ?? ''),
  goal_id: task.goal_id ?? null,
  title: task.title ?? '',
  description: task.description ?? null,
  scheduled_at: task.scheduled_at ?? null,
  is_completed: Boolean(task.is_completed),
  completed_at: task.completed_at ?? null,
  created_at: task.created_at ?? new Date().toISOString(),
  updated_at: task.updated_at ?? task.created_at ?? new Date().toISOString(),
});

const normalizeGoalForStorage = (goal: Partial<LocalGoal> & { id: string }): LocalGoal => ({
  id: String(goal.id ?? ''),
  user_id: String(goal.user_id ?? ''),
  title: goal.title ?? '',
  description: goal.description ?? null,
  parent_goal_id: goal.parent_goal_id ?? null,
  period_type: goal.period_type === 'middle' || goal.period_type === 'long' ? goal.period_type : 'short',
  due_at: goal.due_at ?? null,
  is_completed: Boolean(goal.is_completed),
  color_code: goal.color_code ?? null,
  position_x: goal.position_x ?? null,
  position_y: goal.position_y ?? null,
  created_at: goal.created_at ?? new Date().toISOString(),
  updated_at: goal.updated_at ?? goal.created_at ?? new Date().toISOString(),
});

const getQueueItemId = (payload: SyncQueueItem['payload']): string | null => {
  if (payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string') {
    return payload.id;
  }
  return null;
};

// ─── 全件同期（ログイン後・オンライン復帰時） ─────────────────────

export const syncFromServer = async (): Promise<void> => {
  // ✅ CRDTドキュメントの復元/最低限の初期化は、オンライン・オフラインに
  //    関わらず必ず行う。
  //    以前は isOnline() チェックの後（＝オンライン時にしか実行されない
  //    処理の中）でしか initDoc() を呼んでいなかったため、オフライン状態で
  //    アプリを起動・リロードすると doc.tasks / doc.goals が未定義のまま
  //    残ってしまい、crdtAddTask() や crdtToggleTask() が
  //    「Cannot set/read properties of undefined」で例外を投げて、
  //    オフライン中はタスクの完了切替が視覚上効かなくなっていた。
  //    initDoc() 自体は「既に初期化済みなら何もしない」ガードを持つので、
  //    ここで毎回呼んでも無駄なコストにはならない。
  await initDoc(await db.tasks.toArray(), await db.goals.toArray());

  if (!isOnline()) return;

  try {
    const [rawTasks, rawGoals] = await Promise.all([
      taskApi.getTasks(),
      goalApi.getAll(),
    ]);

    const localTasks: LocalTask[] = (rawTasks as any[]).map((t) => ({
      id:           String(t.id),
      user_id:      String(t.user_id),
      goal_id:      t.goal_id ? String(t.goal_id) : null,
      title:        t.title,
      description:  t.description ?? null,
      scheduled_at: t.scheduled_at ?? null,
      is_completed: Boolean(t.is_completed),
      completed_at: t.completed_at ?? null,
      created_at:   t.created_at,
      updated_at:   t.updated_at,
    }));

    const localGoals: LocalGoal[] = (rawGoals as any[]).map((g) => ({
      id:             String(g.id),
      user_id:        String(g.user_id ?? ''),
      title:          g.title,
      description:    g.description ?? null,
      parent_goal_id: g.parent_goal_id ?? null,
      period_type:    g.period_type,
      due_at:         g.due_at ?? null,
      is_completed:   Boolean(g.is_completed),
      color_code:     g.color_code ?? null,
      position_x:     g.position_x ?? null,
      position_y:     g.position_y ?? null,
      created_at:     g.created_at,
      updated_at:     g.updated_at,
    }));

    // ── Dexie へ反映（オフライン操作を消さないマージ方式） ──
    // bulkPut でサーバーデータをそのまま上書きすると、
    // sync_queue にまだ残っているオフライン操作（create/update/delete）が
    // Dexie から消えてしまい、ページ遷移後に画面から消える。
    // - create pending → サーバー未登録のタスクを上書き削除してしまう
    // - update pending → サーバー側の古い値で上書きされ変更が消える
    // - delete pending → サーバーから再取得されて復活してしまう
    // そのため操作種別ごとに適切な保護を行う。

    const pendingQueue = await db.sync_queue.toArray();

    const taskMap = new Map<string, LocalTask>();
    for (const task of localTasks) {
      taskMap.set(task.id, normalizeTaskForStorage(task));
    }

    const goalMap = new Map<string, LocalGoal>();
    for (const goal of localGoals) {
      goalMap.set(goal.id, normalizeGoalForStorage(goal));
    }

    for (const item of pendingQueue) {
      if (item.entity === 'task') {
        const taskId = getQueueItemId(item.payload);
        if (!taskId) continue;

        if (item.operation === 'delete') {
          taskMap.delete(taskId);
          continue;
        }

        const payload = normalizeTaskForStorage((item.payload as Partial<LocalTask> & { id: string }) ?? { id: taskId });
        if (item.operation === 'create' || item.operation === 'update') {
          taskMap.set(taskId, payload);
        }
      }

      if (item.entity === 'goal') {
        const goalId = getQueueItemId(item.payload);
        if (!goalId) continue;

        if (item.operation === 'delete') {
          goalMap.delete(goalId);
          continue;
        }

        const payload = normalizeGoalForStorage((item.payload as Partial<LocalGoal> & { id: string }) ?? { id: goalId });
        if (item.operation === 'create' || item.operation === 'update') {
          goalMap.set(goalId, payload);
        }
      }
    }

    const tasksToUpsert = Array.from(taskMap.values());
    const goalsToUpsert = Array.from(goalMap.values());

    await db.tasks.bulkPut(tasksToUpsert);
    await db.goals.bulkPut(goalsToUpsert);

    // サーバー側で論理削除されたレコードが Dexie に残ると、
    // TopPage 等のローカルマージで再表示される。
    // 今回の upsert 対象に含まれない ID は削除済み（または非存在）として除去する。
    // pending create は tasksToUpsert に含まれるため保護される。
    const keepTaskIds = new Set(tasksToUpsert.map((t) => t.id));
    const keepGoalIds = new Set(goalsToUpsert.map((g) => g.id));
    const [existingTasks, existingGoals] = await Promise.all([
      db.tasks.toArray(),
      db.goals.toArray(),
    ]);
    const staleTaskIds = existingTasks.filter((t) => !keepTaskIds.has(t.id)).map((t) => t.id);
    const staleGoalIds = existingGoals.filter((g) => !keepGoalIds.has(g.id)).map((g) => g.id);
    if (staleTaskIds.length > 0) await db.tasks.bulkDelete(staleTaskIds);
    if (staleGoalIds.length > 0) await db.goals.bulkDelete(staleGoalIds);

    // ✅ Automerge Doc の初期化。
    // 既にDexie(crdt_meta)へ永続化済みのdocがあればそれをそのまま使い、
    // 無い場合（新規ログイン端末など）だけ「サーバー + 未送信キュー反映済み」の
    // 状態で新規作成する。
    await initDoc(tasksToUpsert, goalsToUpsert);

    // ✅ docを経由せずサーバーにだけ存在するレコード（シーダー投入分等）を
    //    doc側に補完しておく。既にdocにあるIDには触れない。
    await reconcileServerSnapshot(tasksToUpsert, goalsToUpsert);

    // ✅ 他端末発の変更をサーバー経由で取り込み、docへマージする。
    //    さらに pullCrdtChanges() 内で syncDocToDexie() を呼び、
    //    マージ後のdocの内容を Dexie(tasks/goals) へ書き戻す。
    //    ここで書き戻さないと、docの中でマージは正しく行われていても
    //    画面(useLocalData)はDexieしか見ないため、他端末発の変更が
    //    いつまでも画面に反映されない。
    await pullCrdtChanges();
  } catch (err) {
    console.warn('[syncService] syncFromServer 失敗:', err);
  }
};

// ─── Dexie からの読み出し ────────────────────────────────────────

export const getLocalTasks = (): Promise<LocalTask[]> => db.tasks.toArray();
export const getLocalGoals = (): Promise<LocalGoal[]> => db.goals.toArray();

// ─── 個別操作 ────────────────────────────────────────────────────
// オンライン時の作成は useTaskMutations が API 経由で行い、
// レスポンスを直接 db.tasks.put() する。
// saveTaskLocally は不要なため削除済み。

export const updateTaskLocally = async (task: LocalTask): Promise<void> => {
  const normalizedTask = normalizeTaskForStorage(task);
  await db.tasks.put(normalizedTask);
  await crdtUpsertTask(normalizedTask);
  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'update', payload: normalizedTask });
  }
};

export const deleteTaskLocally = async (taskId: string): Promise<void> => {
  await db.tasks.delete(taskId);
  await crdtDeleteTask(taskId);
  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'delete', payload: { id: taskId } });
  }
};

// ─── sync_queue ───────────────────────────────────────────────────

const enqueue = async (item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<void> => {
  await db.sync_queue.add({ ...item, created_at: new Date().toISOString() });
};

// ─── CRDT変更の送受信 ─────────────────────────────────────────────

/**
 * sync_queue に溜まった entity: 'crdt_change'（Automergeの変更バイナリ）を
 * /api/crdt/push へ送る。task/goalの素のCRUD操作（/api/sync）とは別の
 * エンドポイントを使うため、flushQueue() の本処理より先に片付けておく。
 */
const flushCrdtChanges = async (): Promise<void> => {
  const items = await db.sync_queue
    .where('entity')
    .equals('crdt_change')
    .sortBy('created_at');

  if (items.length === 0) return;

  const blobs = items
    .map((item) => (item.payload as { blob?: string })?.blob)
    .filter((b): b is string => typeof b === 'string');

  const ids = items
    .map((item) => item.id)
    .filter((id): id is number => id !== undefined);

  if (blobs.length === 0) {
    // blob が無い壊れたペイロードはキューに残り続けても意味が無いので掃除する
    if (ids.length > 0) await db.sync_queue.bulkDelete(ids);
    return;
  }

  try {
    await crdtSyncApi.push(getDeviceId(), blobs);
    // /api/crdt/push はサーバー側で中身を解釈せず append するだけなので、
    // HTTPが成功した時点で全件成功とみなしてキューから消してよい。
    if (ids.length > 0) await db.sync_queue.bulkDelete(ids);
  } catch (err) {
    // HTTPレベルで失敗（認証切れ・通信不可等）→ 何も消さず次回リトライへ
    console.warn('[syncService] flushCrdtChanges 失敗:', err);
  }
};

// ─── CRDT更新通知（UI再取得のトリガー） ────────────────────────
// pullCrdtChanges() は Dexie(db.tasks/db.goals) までは書き戻すが、
// React側の state は loadFromDB() を呼ばない限り更新されない。
// useLocalData 側からこれを購読してもらい、実際に他端末発の変更を
// 取り込めた時だけ画面の再読み込みをトリガーする。
const CRDT_UPDATED_EVENT = 'mokuvation:crdt-updated';

const notifyCrdtUpdated = (): void => {
  window.dispatchEvent(new CustomEvent(CRDT_UPDATED_EVENT));
};

/**
 * 他端末発のCRDT変更が取り込まれてDexieが更新された時に呼ばれる
 * コールバックを登録する。戻り値の関数を呼ぶと購読解除できる。
 */
export const onCrdtUpdated = (callback: () => void): (() => void) => {
  const handler = () => callback();
  window.addEventListener(CRDT_UPDATED_EVENT, handler);
  return () => window.removeEventListener(CRDT_UPDATED_EVENT, handler);
};

/**
 * サーバー側 crdt_changes の未取得分（他端末発の変更を含む）を取得し、
 * ローカルのAutomergeドキュメントへマージする。
 */
export const pullCrdtChanges = async (): Promise<void> => {
  if (!isOnline()) return;
  try {
    const cursor = await getPullCursor();
    const { changes, latest_id } = await crdtSyncApi.pull(cursor);

    if (changes.length > 0) {
      await applyRemoteChanges(changes.map((c) => c.change_blob));
    }
    if (latest_id > cursor) {
      await setPullCursor(latest_id);
    }

    // ✅ マージ後のdocの状態をDexie(tasks/goals)へ書き戻す。
    //    reconcileServerSnapshot() での補完分もここで一緒に反映される。
    //    changes.length === 0 でも呼んでおくことで、
    //    reconcile由来の差分やdoc上の削除も取りこぼさない。
    await syncDocToDexie();

    // ✅ 実際に他端末発の変更を取り込めた時だけ、画面側へ再取得を促す。
    //    変更が無い(=毎回のポーリングの大半)場合は無駄な再レンダリングを
    //    避けるため、通知しない。
    if (changes.length > 0) {
      notifyCrdtUpdated();
    }
  } catch (err) {
    console.warn('[syncService] pullCrdtChanges 失敗:', err);
  }
};

// ─── 疑似リアルタイム同期（CRDTの短間隔ポーリング） ──────────────
// 「オンライン復帰時にだけpullする」のままだと、両端末がオンラインの
// 状態でも他端末発の変更が画面に反映されるまで長時間放置されうる。
// WebSocketのような真の即時push(数百ms〜1秒)ではないが、
// 数秒おきに /api/crdt/pull を叩くだけで「気付いたら反映されている」
// 体感リアルタイムを、既存構成のまま・低コストで実現できる。
const CRDT_POLL_INTERVAL_MS = 7_000;

const canPollCrdt = (): boolean =>
  isOnline() && !!getCachedUserId() && !!localStorage.getItem('auth_token');

let _crdtPollTimer: ReturnType<typeof setInterval> | null = null;
const startCrdtPolling = () => {
  if (_crdtPollTimer) return;
  _crdtPollTimer = setInterval(() => {
    if (!document.hidden && canPollCrdt()) void pullCrdtChanges();
  }, CRDT_POLL_INTERVAL_MS);
};
const stopCrdtPolling = () => {
  if (_crdtPollTimer) { clearInterval(_crdtPollTimer); _crdtPollTimer = null; }
};

// タブが非表示の間はポーリングを止め、フォアグラウンドに戻ったら
// 次のインターバルを待たず即座に1回pullしてからポーリングを再開する
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopCrdtPolling();
  } else {
    if (canPollCrdt()) void pullCrdtChanges();
    startCrdtPolling();
  }
});
window.addEventListener('online', () => {
  if (canPollCrdt()) void pullCrdtChanges();
  startCrdtPolling();
});
window.addEventListener('offline', stopCrdtPolling);

// 起動時にポーリング開始（ログイン前はcanPollCrdt()がfalseなので実質no-op、
// ログイン後は次のtickから自動的に動き出す）
startCrdtPolling();

export const flushQueue = async (): Promise<void> => {
  if (!isOnline()) return;

  // CRDTの変更バイナリは専用エンドポイントへ先に送っておく
  await flushCrdtChanges();

  // 通常のtask/goal操作（sync_queue内の 'crdt_change' 以外）を /api/sync へ
  const allItems = await db.sync_queue.orderBy('created_at').toArray();
  const items = allItems.filter((item) => item.entity !== 'crdt_change');
  if (items.length === 0) return;

  // /api/sync に一括送信
  const token = localStorage.getItem('auth_token');
  const apiBase = `${import.meta.env.VITE_API_URL}/api`;

  try {
    const res = await fetch(`${apiBase}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        operations: items.map((item) => ({
          entity:    item.entity,
          operation: item.operation,
          payload:   item.payload,
        })),
      }),
    });

    if (!res.ok) {
      // HTTP レベルで失敗（認証切れ等）→ 何も消さずに次回リトライへ
      console.warn('[syncService] flushQueue HTTPエラー:', res.status);
      return;
    }

    // ⚠️ レスポンスは 200 でも、操作ごとに成功/失敗が分かれる
    // （例：オフライン中に削除済みのレコードを更新しようとした 等）。
    // ここを見ずに `db.sync_queue.clear()` していたのが元のバグで、
    // サーバー側で失敗した操作までキューから消えてしまい、
    // 変更が「サイレントに消失」していた。
    const body = await res.json().catch(() => null);
    const results: Array<{ index: number; status: 'ok' | 'error'; message?: string }> =
      body?.results ?? [];

    if (results.length !== items.length) {
      // 想定外のレスポンス形状。安全側に倒して何も削除しない。
      console.warn('[syncService] flushQueue: results の件数が operations と一致しません');
      return;
    }

    const failed = results.filter((r) => r.status === 'error');
    const succeededIds = items
      .filter((_, i) => results[i]?.status === 'ok')
      .map((item) => item.id)
      .filter((id): id is number => id !== undefined);

    if (succeededIds.length > 0) {
      await db.sync_queue.bulkDelete(succeededIds);
    }

    if (failed.length > 0) {
      // 失敗した操作はキューに残し、次回オンライン復帰時に再送する。
      // （対象が既に存在しない等、恒久的に失敗するケースも有り得るが、
      //   黙って消すよりは安全なため、現状はリトライ任せにする）
      console.warn('[syncService] flushQueue: 一部の操作が失敗しました', failed);
    }
  } catch (err) {
    console.warn('[syncService] flushQueue 失敗:', err);
  }
};
