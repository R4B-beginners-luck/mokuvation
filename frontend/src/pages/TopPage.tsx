import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Task, User } from '../types';
import { taskApi } from '../features/tasks/api/taskApi';
import { longTermGoals, midTermGoals, TODAY } from '../data/dummy';
import { EmptyTodayCard, TodaySection, WeeklyProgressChart, StreakDisplay, LongTermSummary, AddGoalModal } from '../features/dashboard';
import { TopPageSkeleton } from '../components/ui/TopPageSkeleton';

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

        const [fetchedTasks, summaryResponse] = await Promise.all([
          taskApi.getTasks(),
          fetch(`${API_BASE_URL}/api/dashboard/summary`, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
          })
        ]);

        if (!mounted) return;

        const formattedTasks: Task[] = fetchedTasks.map((t: any) => ({
          id: String(t.id),
          title: t.title,
          goalId: (t.goal_id && String(t.goal_id) !== '0') ? String(t.goal_id) : undefined,
          completed: Boolean(t.is_completed ?? t.completed),
          date: t.scheduled_at ? String(t.scheduled_at).substring(0, 10) : TODAY,
        }));
        setLocalTasks(formattedTasks);

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
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
  }, []);

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
          <div className="top-page__header">
            <div>
              <div className="top-page__date">{getDateLabel()}</div>
              <div className="top-page__greeting">
                {user ? `こんにちは、${user.user_name}さん` : '読み込み中...'}
              </div>
              <div className="top-page__message">「{message}」</div>
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
            <StreakDisplay 
              tasks={localTasks} 
              streakCount={summary?.currentStreak}
            />
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
