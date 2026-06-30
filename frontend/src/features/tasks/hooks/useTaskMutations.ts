import { useState } from 'react';
import { taskApi } from '../api/taskApi';
import type { CreateTaskPayload, Task } from '../types';
import { db } from '../../../services/db';
import type { LocalTask } from '../../../services/db';
import { isOnline, cacheUserId, getCachedUserId } from '../../../services/syncService';

// ─── 仮 ID 生成（オフライン作成時）─────────────────────────────
const generateTempId = (): string =>
  'temp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

// ─── hook 本体 ───────────────────────────────────────────────────

export const useTaskMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const addTask = async (payload: Omit<CreateTaskPayload, 'user_id'>): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline()) {
        // ── オンライン：従来通り API 経由で作成 ──────────────────
        const currentUser = await taskApi.getCurrentUser();

        // user_id をキャッシュ（次回オフライン時に使う）
        cacheUserId(currentUser.user_id);

        const fullPayload: CreateTaskPayload = {
          ...payload,
          user_id: currentUser.user_id,
        };

        const newTask = await taskApi.create(fullPayload);

        // Dexie にもキャッシュ
        await db.tasks.put({
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
        });

        return newTask;

      } else {
        // ── オフライン：Dexie + sync_queue に積む ────────────────
        const userId = getCachedUserId();
        if (!userId) {
          setError('オフライン中はユーザー情報が取得できません。一度オンラインでログインしてください。');
          return null;
        }

        const tempId = generateTempId();
        const now    = new Date().toISOString();

        const localTask: LocalTask = {
          id:           tempId,
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

        // Dexie に保存
        await db.tasks.put(localTask);

        // sync_queue に create 操作を積む
        await db.sync_queue.add({
          entity:    'task',
          operation: 'create',
          payload:   localTask,
          created_at: now,
        });

        return localTask as unknown as Task;
      }

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
        await taskApi.delete(taskId);
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
