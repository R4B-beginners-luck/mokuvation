import { useState } from 'react';
import type { Task } from '../types';
import { longTermGoals, midTermGoals, TODAY } from '../data/dummy';
import { EmptyTodayCard, TodaySection, WeeklyProgressChart, StreakDisplay, LongTermSummary, AddGoalModal } from '../features/dashboard';

const MOTIVATIONAL_MESSAGES = [
  '小さな一歩が、大きな目標への道になる。',
  '昨日より少しだけ前進することが、成長の証。',
  '行動することが、モチベーションを生む。',
  '完璧でなくていい。ただ続けることが力になる。',
  '今日の積み重ねが、未来の自分をつくる。',
];

interface TopPageProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onAddTask: (goal: Task) => void;
}

function getDateLabel(): string {
  const d = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function TopPage({ tasks, onToggle, onAddTask }: TopPageProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const todayGoals = tasks.filter((g) => g.date === TODAY);
  const hasGoalsToday = todayGoals.length > 0;

  // Pick a deterministic motivational message based on date
  const msgIdx = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
  const message = MOTIVATIONAL_MESSAGES[msgIdx];

  return (
    <>
      <div className="top-page">
        {/* Header row */}
        <div className="top-page__header">
          <div>
            <div className="top-page__date">{getDateLabel()}</div>
            <div className="top-page__greeting">おはようございます、田中さん 👋</div>
            <div className="top-page__message">「{message}」</div>
          </div>
        </div>

        {/* Main column */}
        <div className="top-page__main">
          {hasGoalsToday ? (
            <TodaySection
              goals={todayGoals}
              midTermGoals={midTermGoals}
              longTermGoals={longTermGoals}
              onToggle={onToggle}
              onOpenModal={() => setModalOpen(true)}
            />
          ) : (
            <EmptyTodayCard onOpenModal={() => setModalOpen(true)} />
          )}

          <WeeklyProgressChart tasks={tasks} />
        </div>

        {/* Right sidebar column */}
        <div className="top-page__sidebar">
          <StreakDisplay tasks={tasks} />
          <LongTermSummary
            longTermGoals={longTermGoals}
            tasks={tasks}
          />
        </div>
      </div>

      {/* Add goal modal — opened only on user action */}
      {modalOpen && (
        <AddGoalModal
          longTermGoals={longTermGoals}
          midTermGoals={midTermGoals}
          onAdd={onAddTask}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
