import { useState, useEffect } from 'react';
import type { Page, ShortTermGoal, Task, User } from './types';
import { shortTermGoalsInitial } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { LoginPage }   from './pages/LoginPage';
import Splash from './components/Splash/Splash';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';
import { authApi }     from './features/auth/api/authApi';
import { taskApi }     from './features/tasks/api/taskApi';
import { useLocalData, localTaskToTask } from './hooks/useLocalData';
import { db }          from './services/db';
import { updateTaskLocally, deleteTaskLocally, cacheUserId } from './services/syncService';
import { crdtToggleTask, crdtAddTask, crdtDeleteTask } from './services/crdtStore';

export default function App() {
  const [page, setPage]             = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
      cacheUserId(userData.user_id); // オフライン作成用にキャッシュ
      setIsLoggedIn(true);
      setPage('top');
    } catch (error) {
      console.error('ログイン後のユーザー情報取得に失敗しました', error);
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setUser(null);
      setPage('login');
      throw error;
    } finally {
      setIsLoggingIn(false);
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

    // 2. CRDT Doc に変更を記録（オフライン中も差分が localStorage に残る）
    crdtToggleTask(id, nextCompleted);

    try {
      if (navigator.onLine) {
        // 3a. オンライン：API で更新 → Dexie にも反映
        const raw = await taskApi.update(id, { is_completed: nextCompleted });
        const dbTask = await db.tasks.get(id);
        if (dbTask) {
          await db.tasks.put({ ...dbTask, is_completed: nextCompleted, updated_at: raw.updated_at ?? dbTask.updated_at });
        }
      } else {
        // 3b. オフライン：Dexie + sync_queue に積む
        const dbTask = await db.tasks.get(id);
        if (dbTask) {
          await updateTaskLocally({ ...dbTask, is_completed: nextCompleted });
        }
      }
    } catch (error) {
      console.error('タスク更新に失敗しました', error);
      // ロールバック（CRDT も戻す）
      crdtToggleTask(id, !nextCompleted);
      optimisticUpdateTask(id, { completed: !nextCompleted });
    }
  };

  // ── タスク追加 ───────────────────────────────────────────────
  const handleAddTask = async (rawTask: any) => {
    // 呼び出し元によって渡されるオブジェクトの形が違う：
    //   - TaskAddModal（useTaskMutations経由）→ 本物の Task（snake_case, created_at等あり）
    //   - TopPage の「今日の目標を追加」モーダル → ShortTermGoal 由来（camelCase, created_at等なし）
    // ここで created_at/updated_at に undefined を渡すと、Automerge が
    // 「undefined は無効な値」として例外を投げてアプリが落ちるため、
    // 必ずフォールバック（現在時刻 or null）を入れて正規化する。
    const now = new Date().toISOString();

    const localTask = {
      id:           String(rawTask.id),
      user_id:      String(rawTask.user_id ?? ''),
      goal_id:      rawTask.goal_id ?? rawTask.midTermGoalId ?? rawTask.longTermGoalId ?? null,
      title:        rawTask.title,
      description:  rawTask.description ?? null,
      scheduled_at: rawTask.scheduled_at ?? rawTask.dueDate ?? null,
      is_completed: Boolean(rawTask.is_completed ?? rawTask.completed ?? false),
      completed_at: rawTask.completed_at ?? null,
      created_at:   rawTask.created_at ?? now,
      updated_at:   rawTask.updated_at ?? now,
    };

    // Dexie に保存
    await db.tasks.put(localTask);

    // CRDT Doc に追加
    crdtAddTask(localTask);

    optimisticAddTask(localTaskToTask(localTask));
  };

  // ── タスク削除 ───────────────────────────────────────────────
  const handleDeleteTask = async (taskId: string) => {
    optimisticDeleteTask(taskId);

    // CRDT Doc から削除
    crdtDeleteTask(taskId);

    try {
      if (navigator.onLine) {
        await taskApi.delete(taskId);
        await db.tasks.delete(taskId);
      } else {
        await deleteTaskLocally(taskId);
      }
    } catch (error) {
      console.error('タスク削除に失敗しました', error);
      await sync();
    }
  };

  // ── Login screen (no sidebar) ────────────────────────────────────────────────
  if (isCheckingAuth || isLoggingIn) {
    return (
      <Splash
        label={isLoggingIn ? 'ログインしています…' : undefined}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} onLoggingInChange={setIsLoggingIn} />;
  }

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
