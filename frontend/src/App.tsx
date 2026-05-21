import { useState } from 'react';
import type { Page, ShortTermGoal, Task } from './types';
import { shortTermGoalsInitial, tasksInitial } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { LoginPage }   from './pages/LoginPage';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';

export default function App() {
  const [page, setPage]           = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Short-term goals: lifted state (can be toggled / added) ─────────────────
  const [shortTermGoals] = useState<ShortTermGoal[]>(shortTermGoalsInitial);
  const [tasks, setTasks] = useState<Task[]>(tasksInitial);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setPage('top');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPage('login');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  // ── Login screen (no sidebar) ────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Authenticated layout ─────────────────────────────────────────────────────
  return (
    <>
      <Layout currentPage={page} onNavigate={setPage} onLogout={handleLogout}>
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
    </>
  );
}
