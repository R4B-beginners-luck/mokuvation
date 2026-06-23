import { useState, useEffect } from 'react';
import type { Task, User } from '../types';
import { taskApi } from '../features/tasks/api/taskApi';
import { longTermGoals, midTermGoals, TODAY } from '../data/dummy';
import { EmptyTodayCard, TodaySection, WeeklyProgressChart, StreakDisplay, LongTermSummary, AddGoalModal } from '../features/dashboard';

const MOTIVATIONAL_MESSAGES = [
  '小さな一歩が、大きな目標への道になる。',
  '昨日より少しだけ前進することが、成長の証。',
  '行動することが、モチベーションを生む。',
  '完璧でなくていい。ただ続けることが力になる。',
  '今日の積み重ねが、未来の自分をつくる。',
];

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface TopPageProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onAddTask: (goal: Task) => void;
  onDeleteTask: (taskId: string) => void;
  user: User | null;
}

// 🌟 目標マップ画面と同じ「進捗テキスト切替」関数を定義
function getLoadingProgressLabel(progress: number): string {
  if (progress < 30) return 'ダッシュボードのサマリーを取得しています';
  if (progress < 60) return '本日のタスク一覧を整理しています';
  if (progress < 90) return '今週の進捗グラフを組み立てています';
  return 'マイページの最終調整をしています';
}

function getDateLabel(): string {
  const d = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function TopPage({ tasks, onToggle, onAddTask, onDeleteTask, user }: TopPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  
  // 🌟 目標マップ画面と同じローディング状態管理のState群
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(16);
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);

  // バーを16%〜94%までじわじわ伸ばすタイマー制御
  useEffect(() => {
    if (!isLoadingTasks) return undefined;

    const timer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 94) return prev;
        const step = prev < 45 ? 10 : prev < 75 ? 6 : 3;
        return Math.min(prev + step, 94);
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [isLoadingTasks]);

  // 他画面から戻ったときにAPIから並列で最新データをフェッチする主処理
  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        setLoadingProgress(16);
        setIsLoadingTasks(true);
        setTaskLoadError(null);

        // タスク一覧のフェッチと、サマリーデータのフェッチを並列で実行
        const [fetchedTasks, summaryResponse] = await Promise.all([
          taskApi.getTasks(),
          fetch(`${API_BASE_URL}/api/dashboard/summary`, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
          })
        ]);

        if (!mounted) return;

        // 🌟 型安全対策：APIのタスクをフロント共通のTask[]型に安全にマッピング
        const formattedTasks: Task[] = fetchedTasks.map((t: any) => ({
          id: String(t.id),
          title: t.title,
          goalId: (t.goal_id && String(t.goal_id) !== '0') ? String(t.goal_id) : undefined,
          completed: Boolean(t.is_completed ?? t.completed),
          date: t.scheduled_at ? String(t.scheduled_at).substring(0, 10) : TODAY,
        }));
        setLocalTasks(formattedTasks);

        // サマリーのセット
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }

      } catch (err) {
        console.error('ダッシュボードデータの取得に失敗しました', err);
        if (mounted) setTaskLoadError('マイページの読み込みに失敗しました。');
      } finally {
        if (mounted) {
          // 🌟 目標マップと全く同じ：完了したら100%にして、一瞬待ってからロード画面を消す
          setLoadingProgress(100);
          await new Promise((resolve) => window.setTimeout(resolve, 90));
          setIsLoadingTasks(false);
        }
      }
    };

    loadDashboardData();
    return () => { mounted = false; };
  }, []);

  // 🌟 UIの即時反映を実現するラッパー関数群
  const handleToggleWrapper = (id: string) => {
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    onToggle(id);
  };

  const handleAddWrapper = (task: Task) => {
    setLocalTasks(prev => [task, ...prev]);
    onAddTask(task);
  };

  const handleDeleteWrapper = (taskId: string) => {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    onDeleteTask(taskId);
  };

  const todayGoals = localTasks.filter((g) => g.date === TODAY);
  const hasGoalsToday = todayGoals.length > 0;

  const msgIdx = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
  const message = MOTIVATIONAL_MESSAGES[msgIdx];

  // 先週日曜始まりで当週の日付配列を作成（yyyy-mm-dd）
  const formatISO = (d: Date) => d.toISOString().slice(0, 10);
  const getWeekDays = () => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const labels = ['日', '月', '火', '水', '木', '金', '土'];
    return Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(sunday);
      dt.setDate(sunday.getDate() + i);
      const iso = formatISO(dt);
      return { date: iso, label: labels[i], isToday: iso === formatISO(new Date()) };
    });
  };

  const completedDates = new Set(localTasks.filter(t => t.completed).map(t => t.date));
  const weekDays = getWeekDays();

  return (
    <>
      {/* 🌟 目標マップ画面（GoalsPage）と完全に同一のCSS設計をしたロードカード構造 */}
      {isLoadingTasks ? (
        <div className="goals-page__loading" role="status" aria-live="polite" style={{ height: '70vh' }}>
          <div className="goals-page__loading-card">
            <div className="goals-page__loading-header">
              <div className="goals-page__loading-title">マイページを読み込み中です...</div>
              <div className="goals-page__loading-percent">{loadingProgress}%</div>
            </div>
            <div className="goals-page__loading-bar">
              <div
                className="goals-page__loading-bar-fill"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="goals-page__loading-subtext">
              {getLoadingProgressLabel(loadingProgress)}
            </div>
          </div>
        </div>
      ) : taskLoadError ? (
        <div className="goals-page__error" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⚠️ {taskLoadError} ページを再読み込みしてください。
        </div>
      ) : (
        /* 通常の画面描画エリア */
        <div className="top-page animate-fade-in">
          
          {/* 🌟 変更点：ヘッダー部分をFlexboxにして、右側にStreakDisplayを引っ越し */}
          <div className="top-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
            <div>
              <div className="top-page__date">{getDateLabel()}</div>
              <div className="top-page__greeting">
                {user ? `こんにちは、${user.user_name}さん` : "読み込み中..."}
              </div>
              <div className="top-page__message">「{message}」</div>
            </div>

            {/* 中央：今週の達成マップ */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div className="week-check-map card">
                <div className="week-check-map__left">
                  <div className="week-check-map__title">達成マップ</div>
                  <div className="week-check-map__desc">今週の達成状況</div>
                </div>

                <div className="week-check-map__checks">
                  {weekDays.map((d) => {
                    const completed = completedDates.has(d.date);
                    return (
                      <div
                        key={d.date}
                        className={`week-check-map__day ${completed ? 'is-completed' : ''} ${d.isToday ? 'is-today' : ''}`}
                      >
                        <div className="week-check-map__weekday">{d.label}</div>
                        <div className="week-check-map__dot">{completed ? '✓' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* サイドバーから移動してきた継続状況の表示コンテナ */}
            <div style={{ flexShrink: 0, width: '340px' }}>
              <StreakDisplay 
                tasks={localTasks} 
                streakCount={summary?.currentStreak}
              />
            </div>
          </div>

          <div className="top-page__main">
            {hasGoalsToday ? (
              <TodaySection
                goals={todayGoals}
                midTermGoals={midTermGoals}
                longTermGoals={longTermGoals}
                onToggle={handleToggleWrapper}
                onOpenModal={() => setModalOpen(true)}
                onAddTask={handleAddWrapper}
                onDeleteTask={handleDeleteWrapper}
              />
            ) : (
              <EmptyTodayCard onOpenModal={() => setModalOpen(true)} />
            )}

            <WeeklyProgressChart 
              tasks={localTasks}
              data={summary?.weeklyProgress}
            />
          </div>

          <div className="top-page__sidebar">
            {/* 🌟 変更点：StreakDisplay をここから削除し、長期目標のみを表示 */}
            <LongTermSummary
              longTermGoals={longTermGoals}
              tasks={localTasks}
            />
          </div>
        </div>
      )}

      {modalOpen && (
        <AddGoalModal
          longTermGoals={longTermGoals}
          midTermGoals={midTermGoals}
          onAdd={handleAddWrapper}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}