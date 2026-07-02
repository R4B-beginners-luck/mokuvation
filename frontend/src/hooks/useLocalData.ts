/**
 * useLocalData.ts
 *
 * 役割：コンポーネントに tasks・goals を Dexie（IndexedDB）経由で渡す hook。
 *
 * - マウント時に syncFromServer() でサーバーと同期
 * - Dexie のデータを React state にセットして返す
 * - オンライン復帰時に再同期 & flushQueue() でキューを送信
 */

import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import type { LocalTask, LocalGoal } from '../services/db';
import { db } from '../services/db';
import { syncFromServer, flushQueue, isOnline, checkConnectivity } from '../services/syncService';

// ─── DB の LocalTask → フロント共通型 Task への変換 ─────────────

function getJstTodayStr(): string {
  const jst = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60 * 1000);
  return (
    jst.getFullYear() +
    '-' +
    String(jst.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(jst.getDate()).padStart(2, '0')
  );
}

export const localTaskToTask = (t: LocalTask): Task => ({
  id:          t.id,
  title:       t.title,
  description: t.description ?? undefined,
  goalId:      t.goal_id ?? undefined,
  completed:   t.is_completed,
  date:        t.scheduled_at ? t.scheduled_at.substring(0, 10) : getJstTodayStr(),
});

// ─── hook 本体 ───────────────────────────────────────────────────

export const useLocalData = (enabled: boolean = false) => {
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [goals, setGoals]         = useState<LocalGoal[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  // isOnline() は同期関数だが、値の変化でReactを再レンダリングさせるためstateに持つ
  const [online, setOnline]       = useState<boolean>(isOnline());

  // checkConnectivity の結果を state に反映するラッパー
  const refreshOnlineState = useCallback(async () => {
    const result = await checkConnectivity();
    setOnline(result);
    return result;
  }, []);

  // ── online/offline イベント & 定期チェック結果をstateに反映 ──
  useEffect(() => {
    const handleOnlineEvent  = () => { void refreshOnlineState(); };
    const handleOfflineEvent = () => { setOnline(false); };

    window.addEventListener('online',  handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    // 30秒ごとのヘルスチェック結果もUIに反映
    // 値が変わった時だけ setOnline を呼んで無駄な再レンダリングを防ぐ
    const timer = setInterval(() => {
      const current = isOnline();
      setOnline((prev) => (prev !== current ? current : prev));
    }, 5_000);

    return () => {
      window.removeEventListener('online',  handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
      clearInterval(timer);
    };
  }, [refreshOnlineState]);

  /** Dexie から読み出して state にセット */
  const loadFromDB = useCallback(async () => {
    const [dbTasks, dbGoals] = await Promise.all([
      db.tasks.toArray(),
      db.goals.toArray(),
    ]);
    setTasks(dbTasks.map(localTaskToTask));
    setGoals(dbGoals);
  }, []);

  /** サーバー同期 → DB 読み込み */
  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncFromServer();
      await loadFromDB();
    } finally {
      setIsSyncing(false);
    }
  }, [loadFromDB]);

  // ── 初回マウント時に同期（ログイン済みのときだけ） ──────────
  useEffect(() => {
    if (!enabled) return;
    sync();
  }, [sync, enabled]);

  // ── オンライン復帰時に再同期 & キューを送信 ──────────────────
  useEffect(() => {
    if (!enabled) return;
    const handleOnline = async () => {
      const nowOnline = await refreshOnlineState();
      if (!nowOnline) return;
      await flushQueue();
      await sync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [sync, enabled, refreshOnlineState]);

  // ── tasks の楽観的更新ヘルパー ───────────────────────────────

  /** ローカル state だけ即時更新（API 呼び出しは呼び元が担当） */
  const optimisticUpdateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const optimisticAddTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const optimisticDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return {
    tasks,
    goals,
    isSyncing,
    loadFromDB,
    sync,
    optimisticUpdateTask,
    optimisticAddTask,
    optimisticDeleteTask,
    isOnline: online,
  };
};
