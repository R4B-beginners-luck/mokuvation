import { useState, useEffect } from 'react';
import type { Page, ShortTermGoal, Task, User } from './types';
import { shortTermGoalsInitial } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { LoginPage }   from './pages/LoginPage';
import { LoadingPage } from './pages/LoadingPage';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';
import { authApi }     from './features/auth/api/authApi';
import { taskApi }     from './features/tasks/api/taskApi';
import { useLocalData, localTaskToTask } from './hooks/useLocalData';
import { db }          from './services/db';
import { updateTask, deleteTask } from './services/syncService';

export default function App() {
  const [page, setPage]             = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser]             = useState<User | null>(null);

  const [shortTermGoals] = useState<ShortTermGoal[]>(shortTermGoalsInitial);

  // ✅ taskApi 直叩きの代わりに useLocalData を使う（isLoggedIn のときだけ同期）
  const {
    tasks,
    isSyncing,
    sync,
    optimisticUpdateTask,
    optimisticAddTask,
    optimisticDeleteTask,
  } = useLocalData(isLoggedIn);

  // ── トークン検証による自動ログイン ──────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          setIsLoggedIn(true);
          setPage('top');
        } catch {
          localStorage.removeItem('auth_token');
          setIsLoggedIn(false);
          setUser(null);
        }
      }
      setIsCheckingAuth(false);
    };
    verifyToken();
  }, []);

  const handleLogin = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      setIsLoggedIn(true);
      setPage('top');
    } catch (error) {
      console.error('ログイン後のユーザー情報取得に失敗しました', error);
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setUser(null);
      setPage('login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    setUser(null);
    setPage('login');
  };

  // ── タスク完了トグル ─────────────────────────────────────────
  const handleToggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;

    // 1. UI を即時更新（楽観的更新）
    optimisticUpdateTask(id, { completed: nextCompleted });

    try {
      if (navigator.onLine) {
        // 2a. オンライン：API で更新 → Dexie にも反映
        const raw = await taskApi.update(id, { is_completed: nextCompleted });
        const dbTask = await db.tasks.get(id);
        if (dbTask) {
          await db.tasks.put({ ...dbTask, is_completed: nextCompleted, updated_at: raw.updated_at ?? dbTask.updated_at });
        }
      } else {
        // 2b. オフライン：Dexie + sync_queue に積む
        const dbTask = await db.tasks.get(id);
        if (dbTask) {
          await updateTask({ ...dbTask, is_completed: nextCompleted });
        }
      }
    } catch (error) {
      console.error('タスク更新に失敗しました', error);
      // ロールバック
      optimisticUpdateTask(id, { completed: !nextCompleted });
    }
  };

  // ── タスク追加 ───────────────────────────────────────────────
  // API 呼び出し自体は useTaskMutations（既存）が担当
  // ここでは返ってきた raw データを Dexie に保存して state に反映するだけ
  const handleAddTask = async (rawTask: any) => {
    const task: Task = localTaskToTask({
      id:           String(rawTask.id),
      user_id:      String(rawTask.user_id ?? ''),
      goal_id:      rawTask.goal_id ?? null,
      title:        rawTask.title,
      description:  rawTask.description ?? null,
      scheduled_at: rawTask.scheduled_at ?? null,
      is_completed: Boolean(rawTask.is_completed),
      completed_at: rawTask.completed_at ?? null,
      created_at:   rawTask.created_at,
      updated_at:   rawTask.updated_at,
    });

    // Dexie にも保存
    await db.tasks.put({
      id:           task.id,
      user_id:      rawTask.user_id ?? '',
      goal_id:      rawTask.goal_id ?? null,
      title:        task.title,
      description:  task.description ?? null,
      scheduled_at: rawTask.scheduled_at ?? null,
      is_completed: task.completed,
      completed_at: rawTask.completed_at ?? null,
      created_at:   rawTask.created_at,
      updated_at:   rawTask.updated_at,
    });

    optimisticAddTask(task);
  };

  // ── タスク削除 ───────────────────────────────────────────────
  const handleDeleteTask = async (taskId: string) => {
    optimisticDeleteTask(taskId);

    try {
      if (navigator.onLine) {
        await taskApi.delete(taskId);
        await db.tasks.delete(taskId);
      } else {
        await deleteTask(taskId); // Dexie 削除 + queue 積み
      }
    } catch (error) {
      console.error('タスク削除に失敗しました', error);
      // ロールバック（sync() で再取得）
      await sync();
    }
  };

  if (isCheckingAuth) return <LoadingPage />;
  if (!isLoggedIn)    return <LoginPage onLogin={handleLogin} />;

  return (
    <Layout currentPage={page} onNavigate={setPage} onLogout={handleLogout} user={user}>
      {/* オフライン表示バナー */}
      {!navigator.onLine && (
        <div style={{
          background: '#b45309',
          color: '#fff',
          textAlign: 'center',
          padding: '6px',
          fontSize: '13px',
        }}>
          オフライン中 — 変更はオンライン復帰時に同期されます
        </div>
      )}

      {page === 'top' && (
        <TopPage
          tasks={tasks}
          onToggle={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          user={user}
        />
      )}
      {page === 'calendar' && <CalendarPage />}
      {page === 'goals' && (
        <GoalsPage shortTermGoals={shortTermGoals} tasks={tasks} />
      )}
    </Layout>
  );
}
