import { useState } from 'react';
import { taskApi } from '../api/taskApi';
import type { CreateTaskPayload, Task } from '../types';
import { db } from '../../../services/db';
import type { LocalTask } from '../../../services/db';
import { isOnline, cacheUserId, getCachedUserId, isNetworkFailure } from '../../../services/syncService';
import { crdtUpsertTask, crdtDeleteTask } from '../../../services/crdtStore';

// ─── ID 生成（オンライン・オフライン共通） ─────────────────────
// crypto.randomUUID() で本物の UUID を生成し、作成時点でクライアントと
// サーバーで同じ ID を共有する。これにより、
//   - オフライン作成 → 後でサーバーに送信、というケースで
//     ローカルレコードとサーバーレコードの ID が食い違って
//     「同期後に同じタスクが重複して表示される」事が無くなる
//   - 同一オフラインセッション中に「作成 → 更新」のように
//     同じタスクへ連続して操作した場合でも、IDがずれず
//     更新がサーバー側で迷子にならない
const generateTaskId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    // randomUUID が使えない環境向けのフォールバック
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

// ─── hook 本体 ───────────────────────────────────────────────────

export const useTaskMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  /** オフライン作成（Dexie + sync_queue）。フォールバック先としても使う */
  const createTaskOffline = async (
    payload: Omit<CreateTaskPayload, 'user_id'>
  ): Promise<Task | null> => {
    const userId = getCachedUserId();
    if (!userId) {
      setError('オフライン中はユーザー情報が取得できません。一度オンラインでログインしてください。');
      return null;
    }

    const taskId = generateTaskId();
    const now    = new Date().toISOString();

    const localTask: LocalTask = {
      id:           taskId,
      user_id:      userId,
      goal_id:      payload.goal_id ?? null,
      title:        payload.title,
      description:  payload.description ?? null,
      scheduled_at: payload.scheduled_at ?? null,
      is_completed: false,
      completed_at: null,
      created_at:   now,
      updated_at:   now,
    };

    try {
      await db.tasks.put(localTask);
      // ✅ CRDT doc にも反映しておかないと、次の /api/crdt/pull ポーリング時に
      // syncDocToDexie() が「doc に無いIDはstaleとして削除」してしまい、
      // 作成した直後のタスクが数秒後に画面から消える原因になる。
      await crdtUpsertTask(localTask);
      await db.sync_queue.add({
        entity:    'task',
        operation: 'create',
        payload:   localTask,
        created_at: now,
      });
    } catch (err) {
      console.error('[useTaskMutations] ローカルDB保存に失敗しました', err);
      throw err;
    }

    return localTask as unknown as Task;
  };

  const addTask = async (payload: Omit<CreateTaskPayload, 'user_id'>): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline()) {
        try {
          // ── オンライン：従来通り API 経由で作成 ──────────────────
          const currentUser = await taskApi.getCurrentUser();

          // user_id をキャッシュ（次回オフライン時に使う）
          cacheUserId(currentUser.user_id);

          const fullPayload: CreateTaskPayload = {
            ...payload,
            id: generateTaskId(),
            user_id: currentUser.user_id,
          };

          const newTask = await taskApi.create(fullPayload);

          const localNewTask: LocalTask = {
            id:           String(newTask.id),
            user_id:      String(newTask.user_id),
            goal_id:      newTask.goal_id ?? null,
            title:        newTask.title,
            description:  newTask.description ?? null,
            scheduled_at: newTask.scheduled_at ?? null,
            is_completed: Boolean(newTask.is_completed),
            completed_at: newTask.completed_at ?? null,
            created_at:   newTask.created_at,
            updated_at:   newTask.updated_at,
          };

          // Dexie にもキャッシュ
          await db.tasks.put(localNewTask);
          // ✅ オンライン作成時も CRDT doc に追加しておく。これをしないと
          // doc はこのタスクの存在を知らないままになり、次の
          // /api/crdt/pull ポーリング（7秒毎）で syncDocToDexie() が
          // 「doc に無いID」として作成直後のタスクを Dexie から削除して
          // しまい、画面上でタスクが突然消えたように見える。
          // また doc に無ければ crdt_changes にも push されないため、
          // 他端末からもこの新規タスクを CRDT 経由で検知できなかった。
          await crdtUpsertTask(localNewTask);

          return newTask;
        } catch (err: any) {
          if (!isNetworkFailure(err)) {
            // サーバーには届いたが拒否された（バリデーションエラー等）→ そのまま投げる
            throw err;
          }
          // 本当はオフラインだった → オフラインパスにフォールバック
          console.warn('[useTaskMutations] navigator.onLine=true だが実際は通信不可。オフライン扱いにフォールバックします。', err);
        }
      }

      // ── オフライン（または上記でネットワーク失敗と判定された場合） ──
      return await createTaskOffline(payload);

    } catch (err: any) {
      setError(err.data?.message || err.message || 'タスクの作成に失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTask = async (taskId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (isOnline()) {
        try {
          await taskApi.delete(taskId);
        } catch (err: any) {
          if (!isNetworkFailure(err)) throw err;
          // navigator.onLine=true だが実際は通信不可 → オフライン扱いにフォールバック
          console.warn('[useTaskMutations] navigator.onLine=true だが実際は通信不可。オフライン扱いにフォールバックします。', err);
          await db.sync_queue.add({
            entity:    'task',
            operation: 'delete',
            payload:   { id: taskId },
            created_at: new Date().toISOString(),
          });
        }
      } else {
        // オフライン：sync_queue に delete を積む
        await db.sync_queue.add({
          entity:    'task',
          operation: 'delete',
          payload:   { id: taskId },
          created_at: new Date().toISOString(),
        });
      }
      await db.tasks.delete(taskId);
      // ✅ CRDT doc からも削除しておく。これをしないと doc には削除済みの
      // タスクがまだ残ったままになり、次の /api/crdt/pull ポーリングで
      // syncDocToDexie() が doc の内容（＝まだ存在する状態）を Dexie に
      // 書き戻してしまい、削除したはずのタスクが数秒後に復活してしまう。
      await crdtDeleteTask(taskId);
      return true;
    } catch (err: any) {
      setError(err.data?.message || 'タスクの削除に失敗しました');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { addTask, removeTask, isLoading, error };
};
