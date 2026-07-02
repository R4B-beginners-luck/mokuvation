/**
 * syncService.ts
 * API ↔ Dexie の同期を管理する。
 * オフライン時は sync_queue に積み、オンライン復帰時に一括送信する。
 */

import { db } from './db';
import type { LocalTask, LocalGoal, SyncQueueItem } from './db';
import { taskApi } from '../features/tasks/api/taskApi';
import { goalApi } from '../features/goals/api/goalApi';
import { initDoc, clearPersistedChanges, crdtUpsertGoal, crdtDeleteGoal, crdtUpsertTask, crdtDeleteTask } from './crdtStore';

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

    // ✅ Automerge Doc を「サーバー + 未送信キュー反映済み」の状態で初期化する
    initDoc(tasksToUpsert, goalsToUpsert);
    clearPersistedChanges();
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
  crdtUpsertTask(normalizedTask);
  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'update', payload: normalizedTask });
  }
};

export const deleteTaskLocally = async (taskId: string): Promise<void> => {
  await db.tasks.delete(taskId);
  crdtDeleteTask(taskId);
  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'delete', payload: { id: taskId } });
  }
};

// ─── sync_queue ───────────────────────────────────────────────────

const enqueue = async (item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<void> => {
  await db.sync_queue.add({ ...item, created_at: new Date().toISOString() });
};

export const flushQueue = async (): Promise<void> => {
  if (!isOnline()) return;

  const items = await db.sync_queue.orderBy('created_at').toArray();
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
