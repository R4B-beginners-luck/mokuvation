/**
 * syncService.ts
 *
 * 役割：API ↔ Dexie（IndexedDB）の同期を管理する
 *
 * - オンライン時：API からデータを取得して Dexie に書き込む
 * - オフライン時：sync_queue に操作を積んでおく
 * - 復帰時：sync_queue を順番に API へ送信する（Step 4 で実装）
 */

import { db } from './db';
import type { LocalTask, LocalGoal, SyncQueueItem } from './db';
import { taskApi } from '../features/tasks/api/taskApi';
import { goalApi } from '../features/goals/api/goalApi';
import { initDoc, clearPersistedChanges } from './crdtStore';

// ─── オンライン判定 ──────────────────────────────────────────────

export const isOnline = (): boolean => navigator.onLine;

// ─── 初回 / 復帰時の全件同期 ────────────────────────────────────

/**
 * サーバーから tasks・goals を全件取得して Dexie に上書き保存する。
 * ログイン直後 & オンライン復帰時に呼ぶ。
 */
export const syncFromServer = async (): Promise<void> => {
  if (!isOnline()) return;

  try {
    const [rawTasks, rawGoals] = await Promise.all([
      taskApi.getTasks(),
      goalApi.getAll(),
    ]);

    // tasks を LocalTask 型に合わせて保存
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

    // goals を LocalGoal 型に合わせて保存
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
      created_at:     g.created_at,
      updated_at:     g.updated_at,
    }));

    // bulkPut = 既存レコードは上書き、新規は追加（upsert）
    await db.tasks.bulkPut(localTasks);
    await db.goals.bulkPut(localGoals);

    // ✅ Automerge Doc を最新データで初期化（オフライン差分もここでマージされる）
    initDoc(localTasks, localGoals);
    clearPersistedChanges();
  } catch (err) {
    console.warn('[syncService] syncFromServer 失敗（オフライン？）:', err);
  }
};

// ─── 個別操作：Dexie 書き込み + キュー積み ──────────────────────

/** タスクをローカルに作成し、オフラインなら sync_queue に積む */
export const createTask = async (task: LocalTask): Promise<void> => {
  await db.tasks.put(task);

  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'create', payload: task });
  } else {
    // オンラインならそのまま API へ（呼び元の useTaskMutations が担当）
  }
};

/** タスクをローカルで更新し、オフラインなら sync_queue に積む */
export const updateTask = async (task: LocalTask): Promise<void> => {
  await db.tasks.put(task);

  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'update', payload: task });
  }
};

/** タスクをローカルで削除し、オフラインなら sync_queue に積む */
export const deleteTask = async (taskId: string): Promise<void> => {
  await db.tasks.delete(taskId);

  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'delete', payload: { id: taskId } });
  }
};

/** ゴールをローカルで更新し、オフラインなら sync_queue に積む */
export const updateGoal = async (goal: LocalGoal): Promise<void> => {
  await db.goals.put(goal);

  if (!isOnline()) {
    await enqueue({ entity: 'goal', operation: 'update', payload: goal });
  }
};

// ─── sync_queue ヘルパー ─────────────────────────────────────────

const enqueue = async (item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<void> => {
  await db.sync_queue.add({
    ...item,
    created_at: new Date().toISOString(),
  });
};

/** sync_queue に積まれた操作をサーバーへ送信する（Step 4 で拡張） */
export const flushQueue = async (): Promise<void> => {
  if (!isOnline()) return;

  const items = await db.sync_queue.orderBy('created_at').toArray();
  if (items.length === 0) return;

  for (const item of items) {
    try {
      if (item.entity === 'task') {
        if (item.operation === 'create' || item.operation === 'update') {
          const t = item.payload as LocalTask;
          await taskApi.update(t.id, { is_completed: t.is_completed });
        } else if (item.operation === 'delete') {
          await taskApi.delete((item.payload as { id: string }).id);
        }
      }
      // キュー送信成功 → 該当レコードを削除
      await db.sync_queue.delete(item.id!);
    } catch (err) {
      console.warn('[syncService] flushQueue 送信失敗:', item, err);
      // 失敗したものは次回に持ち越す
      break;
    }
  }
};
