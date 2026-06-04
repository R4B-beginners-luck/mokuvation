import { useState } from 'react';
import { taskApi } from '../api/taskApi';
import type { CreateTaskPayload, Task } from '../types';

export const useTaskMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // user_id はフック内で自動取得するため、引数から除外した型を定義
  const addTask = async (payload: Omit<CreateTaskPayload, 'user_id'>): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. ログイン中のユーザー情報を取得
      const currentUser = await taskApi.getCurrentUser();
      
      // 2. 取得した user_id をペイロードに結合
      const fullPayload: CreateTaskPayload = {
        ...payload,
        user_id: currentUser.user_id, // バックエンドのキー名に合わせる
      };

      // 3. タスク作成APIを実行
      const newTask = await taskApi.create(fullPayload);
      return newTask;
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
      await taskApi.delete(taskId);
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