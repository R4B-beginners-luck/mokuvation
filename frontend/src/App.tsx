import { useState, useEffect, useCallback } from 'react';
import type { Page, ShortTermGoal, Task, User } from './types';
import { shortTermGoalsInitial } from './data/dummy';
import { Layout }      from './layouts/Layout';
import { GoalsLeaveGuardProvider, useGoalsLeaveRequest } from './layouts/GoalsLeaveGuardContext';
import { LoginPage }   from './pages/LoginPage';
import Splash from './components/Splash/Splash';
import { TopPage }     from './pages/TopPage';
import { CalendarPage } from './pages/CalendarPage';
import { GoalsPage }   from './pages/GoalsPage';
import { authApi } from './features/auth/api/authApi';
import { taskApi } from './features/tasks/api/taskApi';
import { SettingsPage } from './pages/SettingsPage';

// ── 【追加インポート】モーダルとコンテンツの読み込み ────────────────
import { Modal } from './components/common/Modal'; 
import { HelpContent, TermsContent, PrivacyContent } from './components/common/ModalContents';

// ── DBレスポンス（snake_case）→ フロント共通型（camelCase）変換 ────────────────
// この関数を通せばどこから来たデータでも必ず同じ型になる
const toTask = (t: any): Task => {
  const todayStr = getJstTodayStr();
  return {
    id: String(t.id),
    title: t.title,
    description: t.description ?? undefined,
    goalId: t.goal_id ? String(t.goal_id) : undefined,
    completed: Boolean(t.is_completed ?? t.completed),
    date: t.scheduled_at ? String(t.scheduled_at).substring(0, 10) : todayStr,
  };
};

// 📅 日本時間の「今日」を YYYY-MM-DD で取得
function getJstTodayStr(): string {
  const jstDate = new Date(Date.now() + ((new Date().getTimezoneOffset() + 540) * 60 * 1000));
  return jstDate.getFullYear() + '-' +
         String(jstDate.getMonth() + 1).padStart(2, '0') + '-' +
         String(jstDate.getDate()).padStart(2, '0');
}

export default function App() {
  return (
    <GoalsLeaveGuardProvider>
      <AppContent />
    </GoalsLeaveGuardProvider>
  );
}

function AppContent() {
  const [page, setPage]             = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [shortTermGoals] = useState<ShortTermGoal[]>(shortTermGoalsInitial);
  const [tasks, setTasks] = useState<Task[]>([]);
  const requestGoalsLeave = useGoalsLeaveRequest();

  // ── 【追加ステート】開いているモーダルの種類を管理 ────────────────
  const [activeModal, setActiveModal] = useState<'none' | 'help' | 'terms' | 'privacy'>('none');
  const closeModal = () => setActiveModal('none');

  const handleNavigate = useCallback((nextPage: Page) => {
    if (nextPage === page) return;
    if (page === 'goals' && nextPage !== 'goals') {
      requestGoalsLeave(() => setPage(nextPage));
      return;
    }
    setPage(nextPage);
  }, [page, requestGoalsLeave]);

  // 日本時間の「今日」を YYYY-MM-DD で取得する共通関数
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
      setTasks((dbTasks as any[]).map(toTask));
    } catch (err) {
      console.error('タスクデータのロードに失敗しました:', err);
    }
  };

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

  // 🚀 タスク完了トグル
  const handleToggleTask = async (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const nextCompleted = !targetTask.completed;

    // 楽観的更新
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      const raw = await taskApi.update(id, { is_completed: nextCompleted });
      // APIレスポンスを変換してから書き戻す
      const updated = toTask(raw);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: updated.completed } : t))
      );
    } catch (error) {
      console.error('タスク更新に失敗しました', error);
      // ロールバック
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t))
      );
    }
  };

  // 🚀 タスク追加：必ず toTask() を通してから追加する
  const handleAddTask = (rawTask: any) => {
    const task = toTask(rawTask);
    setTasks((prev) => [task, ...prev]);
  };

  // 🚀 タスク削除
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
    <>
      <Layout currentPage={page} onNavigate={handleNavigate} onLogout={handleLogout} user={user}>
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
        
        {/* 💡 コピペ解決部分：SettingsPageに必要な関数やステートをバインドしました */}
        {page === 'settings' && (
          <SettingsPage 
            onOpenHelp={() => setActiveModal('help')}
            onOpenTerms={() => setActiveModal('terms')}
            onOpenPrivacy={() => setActiveModal('privacy')}
            onLogout={handleLogout}
          />
        )}
      </Layout>

      {/* ── 【追加】条件が一致した時だけモーダルを表示する処理 ──────────────── */}
      {activeModal === 'help' && (
        <Modal title="目標マップ ヘルプ" onClose={closeModal}>
          <HelpContent />
        </Modal>
      )}

      {activeModal === 'terms' && (
        <Modal title="利用規約" onClose={closeModal}>
          <TermsContent />
        </Modal>
      )}

      {activeModal === 'privacy' && (
        <Modal title="プライバシーポリシー" onClose={closeModal}>
          <PrivacyContent />
        </Modal>
      )}
    </>
  );
}