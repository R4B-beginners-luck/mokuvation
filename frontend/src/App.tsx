import { useState } from 'react';
import type { Page, ShortTermGoal } from './types';
import { shortTermGoalsInitial, shortTermGoalsNoToday } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { LoginPage }   from './pages/LoginPage';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';

export default function App() {
  const [page, setPage]           = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Demo toggle: "no goals today" vs "has goals today" ──────────────────────
  const [demoNoToday, setDemoNoToday] = useState(false);

  // ── Short-term goals: lifted state (can be toggled / added) ─────────────────
  const [shortTermGoals, setShortTermGoals] = useState<ShortTermGoal[]>(shortTermGoalsInitial);

  // Sync when demo mode changes
  const handleDemoToggle = () => {
    const next = !demoNoToday;
    setDemoNoToday(next);
    setShortTermGoals(next ? shortTermGoalsNoToday : shortTermGoalsInitial);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setPage('top');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPage('login');
  };

  const handleToggleGoal = (id: string) => {
    setShortTermGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleAddGoal = (goal: ShortTermGoal) => {
    setShortTermGoals((prev) => [goal, ...prev]);
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
            shortTermGoals={shortTermGoals}
            onToggle={handleToggleGoal}
            onAddGoal={handleAddGoal}
          />
        )}
        {page === 'calendar' && (
          <CalendarPage shortTermGoals={shortTermGoals} />
        )}
        {page === 'goals' && (
          <GoalsPage shortTermGoals={shortTermGoals} />
        )}
      </Layout>

      {/* Demo state toggle button */}
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
