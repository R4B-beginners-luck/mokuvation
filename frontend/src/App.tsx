import { useState, useEffect } from 'react';
import type { Page, ShortTermGoal, Task, User } from './types';
import { shortTermGoalsInitial, tasksInitial } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { LoginPage }   from './pages/LoginPage';
import { LoadingPage } from './pages/LoadingPage';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';
import { authApi } from './features/auth/api/authApi';
import { taskApi } from './features/tasks/api/taskApi';

export default function App() {
  const [page, setPage]           = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // ── Short-term goals: lifted state ─────────────────────────────────────────
  const [shortTermGoals] = useState<ShortTermGoal[]>(shortTermGoalsInitial);
  
  // 🌟【修正】初期状態のタスクは空配列（[]）にして、DBから読み込ませる
  const [tasks, setTasks] = useState<Task[]>([]);

  // 📅【追加】日本時間の「今日」を YYYY-MM-DD で取得する共通関数
  const getJstTodayStr = (): string => {
    const jstDate = new Date(Date.now() + ((new Date().getTimezoneOffset() + 540) * 60 * 1000));
    return jstDate.getFullYear() + '-' + 
           String(jstDate.getMonth() + 1).padStart(2, '0') + '-' + 
           String(jstDate.getDate()).padStart(2, '0');
  };

  // 🔄【追加】DBからタスクを全件取得して共通ステートにセットする関数
  const fetchAndSetTasks = async () => {
    try {
      const dbTasks = await taskApi.getTasks();
      const todayStr = getJstTodayStr();

      const formattedTasks: Task[] = dbTasks.map((t: any) => {
        // どんな形式（ISO文字列やタイムスタンプ）が来ても、先頭10文字（YYYY-MM-DD）を確実に切り出す
        const taskDate = t.scheduled_at ? String(t.scheduled_at).substring(0, 10) : todayStr;
        
        return {
          id: String(t.id),
          title: t.title,
          goalId: t.goal_id ? String(t.goal_id) : undefined,
          completed: Boolean(t.is_completed ?? t.completed), // どちらのキー名で来ても対応
          date: taskDate
        };
      });

      setTasks(formattedTasks);
    } catch (err) {
      console.error('タスクデータのロードに失敗しました:', err);
    }
  };

  // 🔑【追加】ログイン状態（isLoggedIn）が確定したら、自動でタスクを取りに行く処理
  useEffect(() => {
    if (isLoggedIn) {
      fetchAndSetTasks();
    }
  }, [isLoggedIn]);

  // ── トークン検証による自動ログイン ──────────────────────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData); 
          setIsLoggedIn(true); // ➔ ここが true になると、上の useEffect が自動で発火してタスクを読み込みます
          setPage('top');
        } catch (error) {
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

  // 🚀【修正】タスクのトグル（完了・未完了切り替え）
  const handleToggleTask = async (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const nextCompleted = !targetTask.completed;

    // 1) 画面を先に更新するならこれ
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      const updatedTask = await taskApi.update(id, { is_completed: nextCompleted });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: updatedTask.is_completed } : t))
      );
    } catch (error) {
      console.error('タスク更新に失敗しました', error);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t))
      );
    }
  };

  // 🚀【修正】タスクの追加ハンドラー
  const handleAddTask = (task: Task) => {
    // 新しいタスクを配列の先頭に即座に追加（ノーリロード）
    setTasks((prev) => [task, ...prev]);
  };

  // 🚀【追加】タスクの削除ハンドラー
  const handleDeleteTask = (taskId: string) => {
    // 削除されたタスク以外のものを残してステートを即座に更新（ノーリロード）
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ── Login screen (no sidebar) ────────────────────────────────────────────────
  if (isCheckingAuth) {
    return <LoadingPage />;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Authenticated layout ─────────────────────────────────────────────────────
  return (
    <>
      <Layout currentPage={page} onNavigate={setPage} onLogout={handleLogout} user={user}>
        {page === 'top' && (
          <TopPage
            tasks={tasks}
            onToggle={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask} // 🌟【追加】削除ハンドラーをTopPageへ渡す
            user={user}
          />
        )}
        {page === 'calendar' && (
          <CalendarPage />
        )}
        {page === 'goals' && (
          <GoalsPage shortTermGoals={shortTermGoals} tasks={tasks} />
        )}
      </Layout>
    </>
  );
}