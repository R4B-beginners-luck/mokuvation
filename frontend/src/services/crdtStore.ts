/**
 * crdtStore.ts
 *
 * 役割：Automerge を使って tasks・goals の変更を CRDT で管理する。
 *
 * 【設計方針】
 * サーバー（Laravel/PHP）には Automerge の実装が無い（公式PHPバインディング無し）ため、
 * サーバー側では変更バイナリの中身を一切解釈させず、ただの「配送係」として扱う。
 * マージ処理は必ずこのファイル（クライアント側のAutomerge JS実装）が担当する。
 *
 *   1. ローカルで変更が起きるたびに Automerge.change() でdocを更新
 *   2. その変更1件分のバイナリ（getLastLocalChange）を sync_queue に積む
 *      （entity: 'crdt_change'。既存の再送・失敗ハンドリングをそのまま流用）
 *   3. オンライン復帰時、syncService.flushQueue() が /api/crdt/push へ送信
 *   4. syncService が定期的に /api/crdt/pull で他端末発の変更を取得し、
 *      applyRemoteChanges() で自分のdocにマージする
 *   5. 画面表示は getTasksFromDoc() / getGoalsFromDoc() から読む
 *
 * doc本体は Dexie の crdt_meta テーブルに永続化し、リロードをまたいでも
 * サーバーに問い合わせ直さずに前回までのマージ結果を復元できるようにする。
 */

import * as Automerge from '@automerge/automerge';
import type { LocalTask, LocalGoal } from './db';
import { db } from './db';

// ─── ドキュメントの型 ────────────────────────────────────────────

type TaskEntry = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  is_completed: boolean;
  completed_at: string;
  created_at: string;
  updated_at: string;
};

type GoalEntry = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  parent_goal_id: string;
  period_type: string;
  due_at: string;
  is_completed: boolean;
  color_code: number;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
};

const normalizeTaskEntry = (task: Partial<LocalTask> | TaskEntry): TaskEntry => ({
  id: String(task.id ?? ''),
  user_id: String(task.user_id ?? ''),
  goal_id: String(task.goal_id ?? ''),
  title: task.title ?? '',
  description: task.description ?? '',
  scheduled_at: task.scheduled_at ?? '',
  is_completed: Boolean(task.is_completed),
  completed_at: task.completed_at ?? '',
  created_at: task.created_at ?? new Date().toISOString(),
  updated_at: task.updated_at ?? task.created_at ?? new Date().toISOString(),
});

const normalizeGoalEntry = (goal: Partial<LocalGoal> | GoalEntry): GoalEntry => ({
  id: String(goal.id ?? ''),
  user_id: String(goal.user_id ?? ''),
  title: goal.title ?? '',
  description: goal.description ?? '',
  parent_goal_id: String(goal.parent_goal_id ?? ''),
  period_type: String(goal.period_type ?? 'short'),
  due_at: goal.due_at ?? '',
  is_completed: Boolean(goal.is_completed),
  color_code: Number(goal.color_code ?? 0),
  position_x: Number(goal.position_x ?? 0),
  position_y: Number(goal.position_y ?? 0),
  created_at: goal.created_at ?? new Date().toISOString(),
  updated_at: goal.updated_at ?? goal.created_at ?? new Date().toISOString(),
});

export type MokuDoc = {
  tasks: Record<string, TaskEntry>;
  goals: Record<string, GoalEntry>;
};

// ─── デバイスID ──────────────────────────────────────────────────
// 「どの端末から出た変更か」をサーバー側でログ・デバッグできるように付与する。
// マージの可否には使わない（Automerge自体のActorIdがマージの主体）。

const DEVICE_ID_KEY = 'mokuvation_device_id';

export const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

// ─── base64 変換ヘルパー ─────────────────────────────────────────
// spread演算子(...binary)はデータ量が多いとスタックオーバーフローするため
// チャンク分割で安全にBase64変換する

// CHUNKは必ず3の倍数にすること。base64は3バイト単位で4文字に変換されるため、
// 3の倍数でないと最終チャンク以外にも"="パディングが混入し、
// 結合後の文字列が壊れたbase64（atobで復元不可）になる。
const CHUNK = 8190; // 8192を3の倍数に切り下げた値（8190 = 2730 * 3）

const binaryToBase64 = (binary: Uint8Array): string => {
  let b64 = '';
  for (let i = 0; i < binary.length; i += CHUNK) {
    b64 += btoa(String.fromCharCode(...binary.subarray(i, i + CHUNK)));
  }
  return b64;
};

const base64ToBinary = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

// ─── シングルトン ────────────────────────────────────────────────

const META_DOC_KEY    = 'crdt_doc_binary';
const META_CURSOR_KEY = 'crdt_pull_cursor';

let doc: Automerge.Doc<MokuDoc> = Automerge.init<MokuDoc>();

// 起動後、Dexieからdocを一度でも復元・初期化できたかどうか
let _ready = false;

/**
 * 別アカウントへの切り替えを検知した際に呼ぶ。
 *
 * doc は Dexie(crdt_meta)だけでなく、このファイル内のモジュール変数
 * （メモリ上のシングルトン）としても保持されているため、
 * db.clearAllLocalData() で crdt_meta テーブルを消しても、これを
 * 呼ばない限り前ユーザーの doc がメモリ上に残り続けてしまう。
 * （残ったままだと、次の initDoc() は「既に _ready」と誤認して
 * 再初期化されず、前ユーザーのタスク・目標が見え続ける）
 *
 * db.clearAllLocalData() とセットで、ユーザー切り替え時に必ず呼ぶこと。
 */
export const resetCrdtState = (): void => {
  doc = Automerge.init<MokuDoc>();
  _ready = false;
};

// ─── docの永続化（Dexie） ────────────────────────────────────────
// 以前は差分だけをlocalStorageに退避していたが、それだと「他端末発の変更」を
// 含めた完全な状態をまたぐことができないため、doc全体をDexieに保存する方式にした。

const _persistDoc = async (): Promise<void> => {
  try {
    const binary = Automerge.save(doc);
    await db.crdt_meta.put({
      key: META_DOC_KEY,
      value: binaryToBase64(binary),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[crdtStore] docの永続化に失敗:', e);
  }
};

/**
 * Dexieに保存済みのdocがあれば復元する。
 * アプリ起動時（initDocより前）に一度呼ぶ想定。
 * 戻り値: 復元できたら true、保存が無ければ false
 */
export const restorePersistedDoc = async (): Promise<boolean> => {
  try {
    const row = await db.crdt_meta.get(META_DOC_KEY);
    if (!row) return false;
    doc = Automerge.load<MokuDoc>(base64ToBinary(row.value));
    _ready = true;
    return true;
  } catch (e) {
    console.warn('[crdtStore] 永続化済みdocの復元に失敗（無視して続行）:', e);
    return false;
  }
};

// ─── push用キュー（sync_queueへの積み込み） ────────────────────

/**
 * 直前の Automerge.change() で生じた差分1件を sync_queue へ積む。
 * flushQueue() 側がこの entity: 'crdt_change' を見て /api/crdt/push に送信する。
 */
const _enqueueLastChange = async (): Promise<void> => {
  const change = Automerge.getLastLocalChange(doc);
  if (!change) return;
  try {
    await db.sync_queue.add({
      entity: 'crdt_change',
      operation: 'create',
      payload: { blob: binaryToBase64(change) },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[crdtStore] 変更のキュー登録に失敗:', e);
  }
};

// ─── pullカーソルの読み書き ──────────────────────────────────────
// サーバー側 crdt_changes テーブルの「どこまで取り込み済みか」を覚えておく。

export const getPullCursor = async (): Promise<number> => {
  const row = await db.crdt_meta.get(META_CURSOR_KEY);
  return row ? Number(row.value) || 0 : 0;
};

export const setPullCursor = async (id: number): Promise<void> => {
  await db.crdt_meta.put({
    key: META_CURSOR_KEY,
    value: String(id),
    updated_at: new Date().toISOString(),
  });
};

// ─── リモート変更の取り込み ──────────────────────────────────────

/**
 * /api/crdt/pull で取得した他端末発の変更（base64の配列）を自分のdocへマージする。
 * Automerge.applyChanges は取り込み済みの change を渡しても冪等なので、
 * 重複適用について呼び出し側で気にする必要はない。
 */
/**
 * /api/crdt/pull で取得した他端末発の変更（base64の配列）を自分のdocへマージする。
 * Automerge.applyChanges は取り込み済みの change を渡しても冪等なので、
 * 重複適用について呼び出し側で気にする必要はない。
 *
 * ⚠️ 以前は changesB64 を丸ごと一度に Automerge.applyChanges() へ渡していたため、
 * その中の1件でもデコードに失敗する（例: 過去のCHUNKバグで壊れたbase64が
 * サーバーに保存されてしまっていた等）と、catchで握りつぶされてバッチ全体が
 * 適用されず、結果的に正常な他の変更まで巻き込まれて消えていた。
 * さらに呼び出し元(pullCrdtChanges)はこの失敗に気づかずpullカーソルを
 * 進めてしまうため、それらの変更は二度と取り込まれなくなっていた
 * （「他端末発の変更が反映されなくなった」症状の直接原因）。
 * 1件ずつ適用することで、壊れた1件だけをスキップし、他の正常な変更は
 * 確実に取り込めるようにする。
 */
export const applyRemoteChanges = async (changesB64: string[]): Promise<void> => {
  if (changesB64.length === 0) return;

  let appliedAny = false;
  for (const b64 of changesB64) {
    try {
      const change = base64ToBinary(b64);
      const [newDoc] = Automerge.applyChanges(doc, [change]);
      doc = newDoc;
      appliedAny = true;
    } catch (e) {
      // このchange1件は復元不能。スキップして他のchangeの適用は継続する。
      console.warn('[crdtStore] 1件の変更の適用に失敗（スキップして継続）:', e);
    }
  }

  if (appliedAny) {
    await _persistDoc();
  }
};

// ─── 初期化：サーバーデータ（初回ブートストラップ）をDocに読み込む ─

/**
 * 新規ログイン端末など、まだ crdt_meta にdocが1件も無い場合にだけ、
 * サーバーから取得済みのtasks/goalsスナップショットからdocを作る。
 *
 * 既にDexieへ永続化されたdoc（＝過去にこの端末で使っていた、または
 * pullで他端末の変更を取り込み済みのdoc）がある場合はそれを尊重し、
 * ここで丸ごと作り直すことはしない
 * （作り直すと、他端末発の変更履歴が消えてしまうため）。
 */
export const initDoc = async (tasks: LocalTask[], goals: LocalGoal[]): Promise<void> => {
  if (!_ready) {
    const restored = await restorePersistedDoc();
    if (!restored) {
      doc = Automerge.change(Automerge.init<MokuDoc>(), (d) => {
        d.tasks = {} as Record<string, TaskEntry>;
        d.goals = {} as Record<string, GoalEntry>;

        for (const t of tasks) {
          d.tasks[t.id] = normalizeTaskEntry(t);
        }
        for (const g of goals) {
          d.goals[g.id] = normalizeGoalEntry(g);
        }
      });
      await _persistDoc();
    } else if (!doc.tasks || !doc.goals) {
      // ✅ 復元できたdocが、過去の不具合や中断された処理によって
      // tasks/goals が無い壊れた形のまま Dexie に永続化されてしまって
      // いた場合の自己修復。ここで直しておかないと、_ready = true の
      // せいで二度と再初期化されず、以後 d.tasks[id] へのアクセスで
      // 例外→ syncDocToDexie() が「全タスク無し」と誤認して全件削除、
      // という「オフライン切り替わり時に全部消えた」不具合を繰り返す。
      doc = Automerge.change(doc, (d) => {
        ensureDocShape(d);
      });
      await _persistDoc();
    }
    _ready = true;
  }
};

// ─── 変更操作 ────────────────────────────────────────────────────
// いずれも「docを更新 → 永続化 → push用キューに積む」の3点セット。
// 呼び出し側（App.tsx / GoalsPage.tsx）は await せず fire-and-forget で
// 呼んでいるが、返り値を Promise<void> にしても既存の呼び出し方は壊れない。

// ─── docの形の自己修復 ────────────────────────────────────────────
// d.tasks / d.goals が存在しない状態で d.tasks[id] のようなアクセスをすると
// 「Cannot read properties of undefined (reading '<uuid>')」で例外になる。
//
// 本来 initDoc() で必ず d.tasks = {} / d.goals = {} を設定してから使う
// 設計だったが、以下のケースでは d.tasks/d.goals が undefined のまま
// 残ってしまう可能性があった:
//   - restorePersistedDoc() が「壊れた・古い形のdoc」を復元し、
//     かつ _ready = true をセットしてしまうため、initDoc() の
//     再初期化ブロックが二度と実行されない
//   - 回線が不安定な状況で複数の非同期処理（health check / online
//     イベント / CRDTポーリング）がほぼ同時に走り、initDoc() の完了を
//     待たずに crdtToggleTask() 等が先に doc を触ってしまう
//
// この状態で Automerge.change の中身が例外を投げると doc の更新自体が
// 失敗するだけでなく、その後 getTasksFromDoc() が `doc.tasks ?? {}` で
// 「タスク0件」を返し、syncDocToDexie() が「docに無いものは全部stale」
// として Dexie 上の全タスク/全目標を削除してしまう
// （＝回線不良時に「全部消えた」の直接の原因）。
//
// そのため、docを触る操作の直前に必ずこの関数を通し、
// tasks/goals が存在しない場合はその場で空オブジェクトとして
// 補完してから処理を続ける（＝自己修復し、二度と落ちないようにする）。
const ensureDocShape = (d: MokuDoc): void => {
  if (!d.tasks) d.tasks = {} as Record<string, TaskEntry>;
  if (!d.goals) d.goals = {} as Record<string, GoalEntry>;
};

// ─── 変更操作 ────────────────────────────────────────────────────
// いずれも「docを更新 → 永続化 → push用キューに積む」の3点セット。
// 呼び出し側（App.tsx / GoalsPage.tsx）は await せず fire-and-forget で
// 呼んでいるが、返り値を Promise<void> にしても既存の呼び出し方は壊れない。

/** タスクの完了状態を CRDT で更新 */
export const crdtToggleTask = async (taskId: string, isCompleted: boolean): Promise<void> => {
  const now = new Date().toISOString();
  doc = Automerge.change(doc, (d) => {
    ensureDocShape(d);
    if (d.tasks[taskId]) {
      d.tasks[taskId].is_completed = isCompleted;
      d.tasks[taskId].completed_at = isCompleted ? now : '';
      d.tasks[taskId].updated_at   = now;
    }
  });
  await _persistDoc();
  await _enqueueLastChange();
};

/** タスクを CRDT ドキュメントに追加・更新 */
export const crdtUpsertTask = async (task: LocalTask): Promise<void> => {
  doc = Automerge.change(doc, (d) => {
    ensureDocShape(d);
    d.tasks[task.id] = normalizeTaskEntry(task);
  });
  await _persistDoc();
  await _enqueueLastChange();
};

/** タスクを CRDT ドキュメントに追加 */
export const crdtAddTask = (task: LocalTask): Promise<void> => crdtUpsertTask(task);

/** タスクを CRDT ドキュメントから削除 */
export const crdtDeleteTask = async (taskId: string): Promise<void> => {
  doc = Automerge.change(doc, (d) => {
    ensureDocShape(d);
    delete d.tasks[taskId];
  });
  await _persistDoc();
  await _enqueueLastChange();
};

/** 目標を CRDT ドキュメントに追加・更新 */
export const crdtUpsertGoal = async (goal: LocalGoal): Promise<void> => {
  doc = Automerge.change(doc, (d) => {
    ensureDocShape(d);
    d.goals[goal.id] = normalizeGoalEntry(goal);
  });
  await _persistDoc();
  await _enqueueLastChange();
};

/** 目標を CRDT ドキュメントから削除 */
export const crdtDeleteGoal = async (goalId: string): Promise<void> => {
  doc = Automerge.change(doc, (d) => {
    ensureDocShape(d);
    delete d.goals[goalId];
  });
  await _persistDoc();
  await _enqueueLastChange();
};

// ─── 現在の Doc からデータを取り出す ────────────────────────────

export const getTasksFromDoc = (): LocalTask[] =>
  Object.values(doc.tasks ?? {}).map((t) => ({
    id:           t.id,
    user_id:      t.user_id,
    goal_id:      t.goal_id || null,
    title:        t.title,
    description:  t.description || null,
    scheduled_at: t.scheduled_at || null,
    is_completed: t.is_completed,
    completed_at: t.completed_at || null,
    created_at:   t.created_at,
    updated_at:   t.updated_at,
  }));

export const getGoalsFromDoc = (): LocalGoal[] =>
  Object.values(doc.goals ?? {}).map((g) => ({
    id:             g.id,
    user_id:        g.user_id,
    title:          g.title,
    description:    g.description || null,
    parent_goal_id: g.parent_goal_id || null,
    period_type:    g.period_type as 'short' | 'middle' | 'long',
    due_at:         g.due_at || null,
    is_completed:   g.is_completed,
    color_code:     g.color_code ?? null,
    position_x:     g.position_x ?? null,
    position_y:     g.position_y ?? null,
    created_at:     g.created_at,
    updated_at:     g.updated_at,
  }));

// ─── サーバースナップショットの取り込み（doc に無いものだけ救済） ─
// 通常のCRUDは全てcrdtUpsertTask等を通るためdocに反映されるが、
// シーダーで直接投入されたデータ等、docを経由せずサーバーにだけ
// 存在するレコードがあった場合に備え、docに無いIDだけ補完する。
// 既にdocにあるIDは（他端末発の編集を上書きしないよう）触らない。
export const reconcileServerSnapshot = async (
  tasks: LocalTask[],
  goals: LocalGoal[],
): Promise<void> => {
  let changed = false;
  doc = Automerge.change(doc, (d) => {
    ensureDocShape(d);
    for (const t of tasks) {
      if (!d.tasks[t.id]) {
        d.tasks[t.id] = normalizeTaskEntry(t);
        changed = true;
      }
    }
    for (const g of goals) {
      if (!d.goals[g.id]) {
        d.goals[g.id] = normalizeGoalEntry(g);
        changed = true;
      }
    }
  });
  if (changed) {
    await _persistDoc();
    await _enqueueLastChange();
  }
};

// ─── docの内容をDexie(tasks/goals)へ書き戻す ────────────────────
// 画面(useLocalData)はDexieのtasks/goalsテーブルしか読まないため、
// pullCrdtChanges() でdocに他端末発の変更をマージしただけでは
// 画面に反映されない。このdocを「正」として書き戻すことで、
// CRDTのマージ結果が実際のUI表示・以後の同期に反映されるようにする。
export const syncDocToDexie = async (): Promise<void> => {
  const tasks = getTasksFromDoc();
  const goals = getGoalsFromDoc();

  await db.tasks.bulkPut(tasks);
  await db.goals.bulkPut(goals);

  // doc上で削除済み（=もう存在しない）レコードはDexieからも消す
  const taskIds = new Set(tasks.map((t) => t.id));
  const goalIds = new Set(goals.map((g) => g.id));

  const localTaskIds = await db.tasks.toCollection().primaryKeys();
  const staleTaskIds = localTaskIds.filter((id) => !taskIds.has(String(id)));
  if (staleTaskIds.length > 0) await db.tasks.bulkDelete(staleTaskIds);

  const localGoalIds = await db.goals.toCollection().primaryKeys();
  const staleGoalIds = localGoalIds.filter((id) => !goalIds.has(String(id)));
  if (staleGoalIds.length > 0) await db.goals.bulkDelete(staleGoalIds);
};
