import { useState, useEffect } from 'react';
import type { Task, User } from '../types';
import { longTermGoals, midTermGoals, TODAY } from '../data/dummy';
import { EmptyTodayCard, TodaySection, WeeklyProgressChart, StreakDisplay, LongTermSummary, AddGoalModal } from '../features/dashboard';

// --- 定数定義 (不足していた箇所) ---
const MOTIVATIONAL_MESSAGES = [
  '小さな一歩が、大きな目標への道になる。',
  '昨日より少しだけ前進することが、成長の証。',
  '行動することが、モチベーションを生む。',
  '完璧でなくていい。ただ続けることが力になる。',
  '今日の積み重ねが、未来の自分をつくる。',
];

// APIのベースURL
const API_BASE_URL = 'http://localhost:8000'; 

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
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // トークンをローカルストレージから取得（認証用）
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn("認証トークンが見つかりません。");
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 1. ユーザー情報取得: GET /api/users/me
    fetch(`${API_BASE_URL}/api/users/me`, { headers })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setUser(data))
      .catch(err => console.error("User fetch error:", err));

    // 2. サマリー取得: GET /api/dashboard/summary
    fetch(`${API_BASE_URL}/api/dashboard/summary`, { headers })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setSummary(data))
      .catch(err => console.error("Summary fetch error:", err));
  }, []);

  const todayGoals = tasks.filter((g) => g.date === TODAY);
  const hasGoalsToday = todayGoals.length > 0;

  // 今日の日付に基づいてメッセージを選択
  const msgIdx = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
  const message = MOTIVATIONAL_MESSAGES[msgIdx];

  return (
    <>
      <div className="top-page">
        <div className="top-page__header">
          <div>
            <div className="top-page__date">{getDateLabel()}</div>
            <div className="top-page__greeting">
              {user ? `こんにちは、${user.name}さん 👋` : "読み込み中..."}
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
              onToggle={onToggle}
              onOpenModal={() => setModalOpen(true)}
            />
          ) : (
            <EmptyTodayCard onOpenModal={() => setModalOpen(true)} />
          )}


          <WeeklyProgressChart 
            tasks={tasks}
            data={summary?.weeklyProgress}
          />
        </div>

        <div className="top-page__sidebar">

          <StreakDisplay 
            tasks={tasks} 
            streakCount={summary?.currentStreak}
          />
          <LongTermSummary
            longTermGoals={longTermGoals}
            tasks={tasks}
          />
        </div>
      </div>

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