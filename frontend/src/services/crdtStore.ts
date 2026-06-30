/**
 * crdtStore.ts
 *
 * 役割：Automerge を使って tasks・goals の変更を CRDT で管理する（パターン A 軽量版）
 *
 * - サーバーから取得したデータを Automerge.Doc に読み込む
 * - 変更は Automerge.change() で記録
 * - 差分（getChanges）をバイナリ化して localStorage に退避
 * - オンライン復帰時に差分を API へ送信
 *
 * ※ Automerge.Doc はモジュールレベルのシングルトンとして保持する
 */

import * as Automerge from '@automerge/automerge';
import type { LocalTask, LocalGoal } from './db';

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

export type MokuDoc = {
  tasks: Record<string, TaskEntry>;
  goals: Record<string, GoalEntry>;
};

// ─── シングルトン ────────────────────────────────────────────────

const STORAGE_KEY = 'mokuvation_crdt_changes';

let doc: Automerge.Doc<MokuDoc> = Automerge.init<MokuDoc>();

// ─── 初期化：サーバーデータを Doc に読み込む ────────────────────

/**
 * syncFromServer() で取得した tasks・goals を Automerge.Doc に一括セット。
 * localStorage に保存済みのオフライン差分があればそれも適用する。
 */
export const initDoc = (tasks: LocalTask[], goals: LocalGoal[]): void => {
  doc = Automerge.change(Automerge.init<MokuDoc>(), (d) => {
    d.tasks = {} as Record<string, TaskEntry>;
    d.goals = {} as Record<string, GoalEntry>;

    for (const t of tasks) {
      d.tasks[t.id] = {
        id:           t.id,
        user_id:      t.user_id,
        goal_id:      t.goal_id ?? '',
        title:        t.title,
        description:  t.description ?? '',
        scheduled_at: t.scheduled_at ?? '',
        is_completed: t.is_completed,
        completed_at: t.completed_at ?? '',
        created_at:   t.created_at,
        updated_at:   t.updated_at,
      };
    }

    for (const g of goals) {
      d.goals[g.id] = {
        id:             g.id,
        user_id:        g.user_id,
        title:          g.title,
        description:    g.description ?? '',
        parent_goal_id: g.parent_goal_id ?? '',
        period_type:    g.period_type,
        due_at:         g.due_at ?? '',
        is_completed:   g.is_completed,
        color_code:     g.color_code ?? 0,
        position_x:     g.position_x ?? 0,
        position_y:     g.position_y ?? 0,
        created_at:     g.created_at,
        updated_at:     g.updated_at,
      };
    }
  });

  // オフライン中に積んだ差分があれば適用する
  _applyStoredChanges();
};

// ─── 変更操作 ────────────────────────────────────────────────────

/** タスクの完了状態を CRDT で更新 */
export const crdtToggleTask = (taskId: string, isCompleted: boolean): void => {
  const now = new Date().toISOString();
  doc = Automerge.change(doc, (d) => {
    if (d.tasks[taskId]) {
      d.tasks[taskId].is_completed = isCompleted;
      d.tasks[taskId].completed_at = isCompleted ? now : '';
      d.tasks[taskId].updated_at   = now;
    }
  });
  _persistChanges();
};

/** タスクを CRDT ドキュメントに追加 */
export const crdtAddTask = (task: LocalTask): void => {
  doc = Automerge.change(doc, (d) => {
    d.tasks[task.id] = {
      id:           task.id,
      user_id:      task.user_id,
      goal_id:      task.goal_id ?? '',
      title:        task.title,
      description:  task.description ?? '',
      scheduled_at: task.scheduled_at ?? '',
      is_completed: task.is_completed,
      completed_at: task.completed_at ?? '',
      created_at:   task.created_at,
      updated_at:   task.updated_at,
    };
  });
  _persistChanges();
};

/** タスクを CRDT ドキュメントから削除 */
export const crdtDeleteTask = (taskId: string): void => {
  doc = Automerge.change(doc, (d) => {
    delete d.tasks[taskId];
  });
  _persistChanges();
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

// ─── オフライン差分の保存 / 復元 ────────────────────────────────

/**
 * 現在の Doc の全変更差分をバイナリ → Base64 で localStorage に保存。
 * オフライン中の変更をページリロードをまたいで保持するため。
 */
const _persistChanges = (): void => {
  try {
    const binary = Automerge.save(doc);
    const b64 = btoa(String.fromCharCode(...binary));
    localStorage.setItem(STORAGE_KEY, b64);
  } catch (e) {
    console.warn('[crdtStore] 差分の保存に失敗:', e);
  }
};

/** localStorage に保存された差分を現在の Doc に適用 */
const _applyStoredChanges = (): void => {
  try {
    const b64 = localStorage.getItem(STORAGE_KEY);
    if (!b64) return;

    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const savedDoc = Automerge.load<MokuDoc>(binary);

    // マージ：サーバーデータ（doc）にローカル変更（savedDoc）を合成
    doc = Automerge.merge(doc, savedDoc);
  } catch (e) {
    console.warn('[crdtStore] 差分の復元に失敗（無視して続行）:', e);
    localStorage.removeItem(STORAGE_KEY);
  }
};

/** オンライン同期完了後に localStorage の差分キャッシュをクリア */
export const clearPersistedChanges = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
