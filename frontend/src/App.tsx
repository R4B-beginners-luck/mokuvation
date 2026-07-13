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

import { useLocalData, localTaskToTask } from './hooks/useLocalData';
import { db, type LocalTask } from './services/db';
import { updateTaskLocally, ensureUserScope, isOnline, isNetworkFailure } from './services/syncService';
import { crdtToggleTask, crdtAddTask, crdtDeleteTask } from './services/crdtStore';

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
  const requestGoalsLeave = useGoalsLeaveRequest();

  // ── 【追加ステート】開いているモーダルの種類を管理 ────────────────
  const [activeModal, setActiveModal] = useState<'none' | 'help' | 'terms' | 'privacy'>('none');
  const closeModal = () => setActiveModal('none');

  // ✅ taskApi 直叩きの代わりに useLocalData を使う（isLoggedIn のときだけ同期）
  const {
    tasks,
    isSyncing,
    sync,
    optimisticUpdateTask,
    optimisticAddTask,
    optimisticDeleteTask,
  } = useLocalData(isLoggedIn);

  // ── 直近ページの保存/復元 ────────────────────────────────────
  // ⚠️ Service Workerの更新検知（main.tsx の updateSW(true)）や、
  // オフライン→オンライン復帰時のブラウザリロード等で画面全体が
  // 再読み込みされると、page は単なる React state なので毎回 'login'
  // から初期化され、認証さえ通ればいつも 'top' に固定で戻ってしまう。
  // カレンダー/目標マップを見ていたところに更新が入ると強制的にトップへ
  // 飛ばされて煩わしい、という問題があったため、最後にいたページを
  // localStorage に覚えておき、再読み込み後の自動ログイン時に復元する。
  const LAST_PAGE_KEY = 'mokuvation_last_page';
  const NAVIGABLE_PAGES: Page[] = ['top', 'calendar', 'goals'];

  const getPersistedPage = (): Page => {
    const saved = localStorage.getItem(LAST_PAGE_KEY);
    return (NAVIGABLE_PAGES as string[]).includes(saved ?? '') ? (saved as Page) : 'top';
  };

  const handleNavigate = useCallback((nextPage: Page) => {
    if (nextPage === page) return;

    const doNavigate = () => {
      setPage(nextPage);
      if ((NAVIGABLE_PAGES as string[]).includes(nextPage)) {
        localStorage.setItem(LAST_PAGE_KEY, nextPage);
      }
    };

    if (page === 'goals' && nextPage !== 'goals') {
      requestGoalsLeave(doNavigate);
      return;
    }

    doNavigate();
  }, [page, requestGoalsLeave]);

  // ── トークン検証による自動ログイン ──────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          // オフライン作成用にキャッシュ／別アカウント切替を検知したらローカルデータを消去
          await ensureUserScope(userData.user_id);
          setUser(userData);
          setIsLoggedIn(true);
          // 更新等での自動再ログイン時は、最後にいたページへ戻す
          setPage(getPersistedPage());
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
      // オフライン作成用にキャッシュ／別アカウント切替を検知したらローカルデータを消去
      await ensureUserScope(userData.user_id);
      setUser(userData);
      setIsLoggedIn(true);
      // 明示的なログイン操作は、あえて毎回トップページから始める
      setPage('top');
      localStorage.setItem(LAST_PAGE_KEY, 'top');
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
    localStorage.removeItem(LAST_PAGE_KEY);
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
      if (isOnline()) {
        try {
          // 3a. オンライン：API で更新 → Dexie にも反映
          const raw = await taskApi.update(id, { is_completed: nextCompleted });
          const dbTask = await db.tasks.get(id);
          if (dbTask) {
            await db.tasks.put({ ...dbTask, is_completed: nextCompleted, updated_at: raw.updated_at ?? dbTask.updated_at });
          }
        } catch (error: any) {
          if (error?.status === 404) {
            // サーバー未登録（オフライン作成分がまだ未送信）→ ロールバックせずローカル更新+キューへ
            const dbTask = await db.tasks.get(id);
            if (dbTask) {
              await updateTaskLocally({ ...dbTask, is_completed: nextCompleted });
            }
          } else if (!isNetworkFailure(error)) {
            throw error;
          } else {
            // 実際はオフライン → Dexie + キューに積む
            const dbTask = await db.tasks.get(id);
            if (dbTask) {
              await updateTaskLocally({ ...dbTask, is_completed: nextCompleted });
            }
          }
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
    //   - TaskAddModal（useTaskMutations経由）→ 実際には TodaySection/DayGoalList の
    //     onSuccess ラッパーで camelCase(id/title/goalId/completed/date) に整形された
    //     簡易オブジェクトが渡ってくる（goal_id/user_id は含まれない）
    //   - TopPage の「今日の目標を追加」モーダル → ShortTermGoal 由来（camelCase, created_at等なし）
    //
    // ⚠️ 以前はここで rawTask.goal_id / rawTask.user_id を直接読んでいたが、
    // TaskAddModal 経由の場合はどちらも存在しないため goal_id が null、
    // user_id が空文字に化けて Dexie 上の正しいレコードを上書きしてしまっていた
    // （オフラインで親目標付きタスクを作成→親目標が消える、の直接原因）。
    // useTaskMutations.addTask()/createTaskOffline() は既に正しいデータを
    // Dexie に書き込み済みなので、既存レコードがあればそれを正として使い、
    // rawTask からの再構築で上書きしないようにする。
    const id = String(rawTask.id);
    const existing = await db.tasks.get(id);

    let localTask: LocalTask;

    if (existing) {
      localTask = existing;
    } else {
      // ここに来るのは useTaskMutations を経由しない呼び出し元
      // （例: 「今日の目標を追加」モーダル）のみ。
      // created_at/updated_at に undefined を渡すと、Automerge が
      // 「undefined は無効な値」として例外を投げてアプリが落ちるため、
      // 必ずフォールバック（現在時刻 or null）を入れて正規化する。
      const now = new Date().toISOString();
      localTask = {
        id,
        user_id:      String(rawTask.user_id ?? user?.user_id ?? ''),
        goal_id:      rawTask.goal_id ?? rawTask.goalId ?? rawTask.midTermGoalId ?? rawTask.longTermGoalId ?? null,
        title:        rawTask.title,
        description:  rawTask.description ?? null,
        scheduled_at: rawTask.scheduled_at ?? rawTask.dueDate ?? null,
        is_completed: Boolean(rawTask.is_completed ?? rawTask.completed ?? false),
        completed_at: rawTask.completed_at ?? null,
        created_at:   rawTask.created_at ?? now,
        updated_at:   rawTask.updated_at ?? now,
      };
    }

    try {
      // Dexie に保存（既存レコードの場合は実質no-opだが、CRDT登録前に
      // 最新状態を確定させる意味で明示的にputしておく）
      await db.tasks.put(localTask);

      // CRDT Doc に追加
      crdtAddTask(localTask);
    } catch (err) {
      console.error('[App] タスク追加時のローカル保存に失敗しました', err);
      throw err;
    }

    optimisticAddTask(localTaskToTask(localTask));
  };

  // ── タスク削除 ───────────────────────────────────────────────
  const handleDeleteTask = async (taskId: string) => {
    // ⚠️ ここに来る時点で、呼び出し元(TaskDeleteConfirm)の
    // useTaskMutations.removeTask() が既に
    //   ・オンライン: taskApi.delete() でサーバーへ削除リクエスト送信
    //   ・オフライン: sync_queue に delete 操作を登録
    // ・db.tasks からの削除
    // を完了させている。
    // 以前はここでも taskApi.delete() や sync_queue への登録を
    // もう一度行っていたため、同じタスクに対して削除が二重に走り、
    //   ・オンライン時: 2回目の DELETE が 404 で失敗
    //   ・オフライン時: sync_queue に delete が2件積まれ、
    //     オンライン復帰後のflushQueueで1件が「タスクが見つかりません」で失敗
    // という無駄なエラーを起こしていた。
    // ここでの責務は「楽観的UI更新」と「CRDTドキュメントへの反映」だけにする。
    optimisticDeleteTask(taskId);
    crdtDeleteTask(taskId);

    try {
      // removeTask() 側で既に削除済みのはずだが、
      // 存在しないキーへの delete は安全な no-op なのでそのまま呼んでOK
      await db.tasks.delete(taskId);
    } catch (error: any) {
      console.error('タスク削除時のローカル反映に失敗しました', error);
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
    <>
      <Layout currentPage={page} onNavigate={handleNavigate} onLogout={handleLogout} user={user}>
      {/* オフライン表示バナー */}
        {!isOnline() && (
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