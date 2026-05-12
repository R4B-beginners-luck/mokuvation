import { useState } from 'react';
import type { Page, ShortTermGoal, Task, User } from './types';
import { shortTermGoalsInitial, tasksInitial, tasksNoToday } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { LoginPage }   from './pages/LoginPage';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';

export default function App() {
  const [page, setPage]           = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 追加: ログイン中のユーザー情報を管理
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [demoNoToday, setDemoNoToday] = useState(false);

  // ── Short-term goals: lifted state (can be toggled / added) ─────────────────
  const [shortTermGoals] = useState<ShortTermGoal[]>(shortTermGoalsInitial);
  const [tasks, setTasks] = useState<Task[]>(tasksInitial);


  const handleDemoToggle = () => {
    const next = !demoNoToday;
    setDemoNoToday(next);
    setTasks(next ? tasksNoToday : tasksInitial);
  };

  // 修正: LoginPageから渡されるユーザー情報を受け取るように変更
  const handleLogin = (user: User) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setPage('top');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null); // クリア
    localStorage.removeItem('access_token'); // トークン破棄
    setPage('login');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  // ログイン前
  if (!isLoggedIn) {
    // LoginPageにhandleLoginを渡し、認証成功時にuserを受け取るようにする
    return <LoginPage onLogin={handleLogin} />;
  }

  // 認証後
  return (
    <>
      {/* 修正: LayoutにcurrentUserを渡し、Sidebarなどで名前を使えるようにする */}
      <Layout 
        currentPage={page} 
        onNavigate={setPage} 
        onLogout={handleLogout}
        user={currentUser} 
      >
        {page === 'top' && (
          <TopPage
            tasks={tasks}
            onToggle={handleToggleTask}
            onAddTask={handleAddTask}

          />
        )}
        {page === 'calendar' && (
          <CalendarPage tasks={tasks} />
        )}
        {page === 'goals' && (
          <GoalsPage shortTermGoals={shortTermGoals} tasks={tasks} />
        )}
      </Layout>

      <button
        className="demo-toggle"
        onClick={handleDemoToggle}
        title="今日の目標あり/なし を切り替えるデモ用ボタン"
      >
        {demoNoToday ? '📭 今日の目標なし（デモ）' : '📬 今日の目標あり（デモ）'}
      </button>
    </>
  );
}