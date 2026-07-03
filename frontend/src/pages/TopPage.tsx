import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { taskApi } from '../features/tasks/api/taskApi';
import { longTermGoals, midTermGoals, TODAY } from '../data/dummy';
import { EmptyTodayCard, TodaySection, WeeklyProgressChart, StreakDisplay, LongTermSummary, AddGoalModal } from '../features/dashboard';
import { TopPageSkeleton } from '../components/ui/TopPageSkeleton';
import type { Task, User, ShortTermGoal, LongTermGoal, MidTermGoal } from '../types';
import { goalApi, type BackendGoal } from '../features/goals/api/goalApi';
import { db } from '../services/db';
import { isOnline } from '../services/syncService';
import { localTaskToTask } from '../hooks/useLocalData';

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

function getDateLabel(): string {
  const d = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function TopPage({ tasks, onToggle, onAddTask, onDeleteTask, user }: TopPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [longTermGoalsList, setLongTermGoalsList] = useState<LongTermGoal[]>(longTermGoals);
  const [midTermGoalsList, setMidTermGoalsList] = useState<MidTermGoal[]>(midTermGoals);
  const [shortTermGoalsList, setShortTermGoalsList] = useState<ShortTermGoal[]>([]);
  
  // 🌟 目標マップ画面と同じローディング状態管理のState群
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        setIsLoadingTasks(true);
        setTaskLoadError(null);

        let fetchedTasks: any[] | null = null;
        let summaryResponse: Response | null = null;

        const localDbTasks = (await db.tasks.toArray()).map(localTaskToTask);

        if (isOnline()) {
          try {
            [fetchedTasks, summaryResponse] = await Promise.all([
              taskApi.getTasks(),
              fetch(`${API_BASE_URL}/api/dashboard/summary`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
              }),
            ]);
          } catch (err) {
            console.warn('サーバー取得に失敗したため、Dexie のローカルデータを使用します。', err);
          }
        }

        if (!mounted) return;

        const serverTasks = (fetchedTasks ?? []).map((t: any) => ({
          id: String(t.id),
          title: t.title,
          goalId: (t.goal_id && String(t.goal_id) !== '0') ? String(t.goal_id) : undefined,
          completed: Boolean(t.is_completed ?? t.completed),
          date: t.scheduled_at ? String(t.scheduled_at).substring(0, 10) : TODAY,
        }));

        const taskById = new Map<string, Task>();
        for (const task of serverTasks) {
          taskById.set(task.id, task);
        }
        for (const task of localDbTasks) {
          taskById.set(task.id, task);
        }

        const formattedTasks = Array.from(taskById.values());

        setLocalTasks(formattedTasks);

        if (summaryResponse?.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }

        // 目標データを取得してフロント用型に変換する
        try {
          const backendGoals: BackendGoal[] = await goalApi.getAll();
          const byId = new Map(backendGoals.map((g) => [String(g.id), g]));

          const findAncestor = (startId: string | null | undefined, targetType: string): BackendGoal | null => {
            if (!startId) return null;
            let cur = byId.get(String(startId)) || null;
            while (cur) {
              if (cur.period_type === targetType) return cur;
              if (!cur.parent_goal_id) return null;
              cur = byId.get(String(cur.parent_goal_id)) || null;
            }
            return null;
          };

          const longTerms: LongTermGoal[] = backendGoals
            .filter((g) => g.period_type === 'long')
            .map((g) => ({
              id: String(g.id),
              type: 'long',
              title: g.title,
              description: g.description ?? '',
              createdAt: g.created_at,
              completed: Boolean(g.is_completed),
              color_code: g.color_code != null ? String(g.color_code) : undefined,
              relatedLongTermGoalIds: [],
            }));

          const midTerms: MidTermGoal[] = backendGoals
            .filter((g) => g.period_type === 'middle')
            .map((g) => ({
              id: String(g.id),
              type: 'mid',
              title: g.title,
              description: g.description ?? '',
              longTermGoalId: findAncestor(g.parent_goal_id, 'long') ? String(findAncestor(g.parent_goal_id, 'long')!.id) : '',
              dueDate: g.due_at ? String(g.due_at).substring(0, 10) : undefined,
              completed: Boolean(g.is_completed),
              color_code: g.color_code != null ? String(g.color_code) : undefined,
              relatedMidTermGoalIds: [],
            }));

          const shortTerms: ShortTermGoal[] = backendGoals
            .filter((g) => g.period_type === 'short')
            .map((g) => ({
              id: String(g.id),
              type: 'short',
              title: g.title,
              description: g.description ?? '',
              completed: Boolean(g.is_completed),
              longTermGoalId: findAncestor(g.parent_goal_id, 'long') ? String(findAncestor(g.parent_goal_id, 'long')!.id) : '',
              midTermGoalId: findAncestor(g.parent_goal_id, 'middle') ? String(findAncestor(g.parent_goal_id, 'middle')!.id) : undefined,
              dueDate: g.due_at ? String(g.due_at).substring(0, 10) : undefined,
              color_code: g.color_code != null ? String(g.color_code) : undefined,
            }));

          setLongTermGoalsList(longTerms);
          setMidTermGoalsList(midTerms);
          setShortTermGoalsList(shortTerms);
        } catch (e) {
          // 目標API失敗時はダミーデータのままにする
          console.warn('目標データの取得に失敗しました。ダミーデータを使用します。', e);
        }

      } catch (err) {
        console.error('ダッシュボードデータの取得に失敗しました', err);
        if (mounted) setTaskLoadError('マイページの読み込みに失敗しました。');
      } finally {
        if (mounted) {
          setIsLoadingTasks(false);
        }
      }
    };

    loadDashboardData();
    return () => { mounted = false; };
    // ⚠️ 依存配列に `tasks` を入れていたため、タスクの完了トグル・追加・削除の
    // たびに（optimisticUpdateTask等が新しい配列参照を作るせいで）この
    // useEffectが再発火し、isLoadingTasks(true) でスケルトンに戻った上、
    // タスク/ダッシュボードサマリー/目標のAPIを毎回叩き直していた。
    // → 操作するたびに画面がチラつく原因だったため、初回マウント時のみ実行する。
    // ローカル操作後の表示更新は下の useEffect（setLocalTasks(tasks)）で
    // 軽量に反映されるので、ここで tasks を監視する必要はない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

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
      {isLoadingTasks ? (
        <div className="goals-page__loading" role="status" aria-live="polite" style={{ height: '70vh' }}>
          <TopPageSkeleton />
        </div>
      ) : taskLoadError ? (
        <div className="goals-page__error" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <AlertTriangle size={18} strokeWidth={1.75} aria-hidden />
          {taskLoadError} ページを再読み込みしてください。
        </div>
      ) : (
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
            <div className="top-page__streak-wrapper">
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
                midTermGoals={midTermGoalsList}
                longTermGoals={longTermGoalsList}
                shortTermGoals={shortTermGoalsList}
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
            <LongTermSummary
              longTermGoals={longTermGoalsList}
              midTermGoals={midTermGoalsList}
              shortTermGoals={shortTermGoalsList}
              tasks={localTasks}
            />
          </div>
        </div>
      )}

      {modalOpen && (
        <AddGoalModal
          longTermGoals={longTermGoalsList}
          midTermGoals={midTermGoalsList}
          onAdd={handleAddWrapper}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
