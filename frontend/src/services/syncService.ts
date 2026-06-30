/**
 * syncService.ts
 * API ↔ Dexie の同期を管理する。
 * オフライン時は sync_queue に積み、オンライン復帰時に一括送信する。
 */

import { db } from './db';
import type { LocalTask, LocalGoal, SyncQueueItem } from './db';
import { taskApi } from '../features/tasks/api/taskApi';
import { goalApi } from '../features/goals/api/goalApi';
import { initDoc, clearPersistedChanges } from './crdtStore';

export const isOnline = (): boolean => navigator.onLine;

// ─── ユーザーID キャッシュ ────────────────────────────────────────
// ログイン時に保存しておき、オフライン時に使う
const USER_ID_KEY = 'mokuvation_user_id';

export const cacheUserId = (userId: string): void => {
  localStorage.setItem(USER_ID_KEY, userId);
};

export const getCachedUserId = (): string | null => {
  return localStorage.getItem(USER_ID_KEY);
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

    await db.tasks.bulkPut(localTasks);
    await db.goals.bulkPut(localGoals);

    // ✅ Automerge Doc を最新データで初期化（オフライン差分もここでマージされる）
    initDoc(localTasks, localGoals);
    clearPersistedChanges();
  } catch (err) {
    console.warn('[syncService] syncFromServer 失敗:', err);
  }
};

// ─── Dexie からの読み出し ────────────────────────────────────────

export const getLocalTasks = (): Promise<LocalTask[]> => db.tasks.toArray();
export const getLocalGoals = (): Promise<LocalGoal[]> => db.goals.toArray();

// ─── 個別操作 ────────────────────────────────────────────────────

export const saveTaskLocally = async (task: LocalTask): Promise<void> => {
  await db.tasks.put(task);
  if (!isOnline()) {
    // ここが抜けていたため、未使用ながらも「オフライン作成は同期されない」
    // 実装になっていた（update/delete だけ enqueue されていた）。
    await enqueue({ entity: 'task', operation: 'create', payload: task });
  }
};

export const updateTaskLocally = async (task: LocalTask): Promise<void> => {
  await db.tasks.put(task);
  if (!isOnline()) {
    await enqueue({ entity: 'task', operation: 'update', payload: task });
  }
};

export const deleteTaskLocally = async (taskId: string): Promise<void> => {
  await db.tasks.delete(taskId);
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
