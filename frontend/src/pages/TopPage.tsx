import { useState, useEffect } from 'react';
import type { Task, User } from '../types';
import { longTermGoals, midTermGoals, TODAY } from '../data/dummy';
import { EmptyTodayCard, TodaySection, WeeklyProgressChart, StreakDisplay, LongTermSummary, AddGoalModal } from '../features/dashboard';
import { authApi } from '../features/auth/api/authApi'; 

const MOTIVATIONAL_MESSAGES = [
  '小さな一歩が、大きな目標への道になる。',
  '昨日より少しだけ前進することが、成長の証。',
  '行動することが、モチベーションを生む。',
  '完璧でなくていい。ただ続けることが力になる。',
  '今日の積み重ねが、未来の自分をつくる。',
];

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
    // 1. ログインユーザー情報取得: GET /api/users/me
    authApi.getMe().then((data: User | unknown) => {
      // 【セキュリティチェック】届いたデータが、新しく定義したUser型（user_nameを持つオブジェクト）か検証
      if (data && typeof data === 'object' && 'user_name' in data) {
        
        // 🌟 エンドポイントを叩いたデータをそのままガチッとセット！
        setUser(data as User); 
        return;
      }
      throw new Error("不適切なユーザーデータ構造です。");
    }).catch(err => {
      console.error("User fetch error via authApi:", err);
      setUser(null);
    });
    // 2. サマリー取得: GET /api/dashboard/summary
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch(`${API_BASE_URL}/api/dashboard/summary`, { 
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setSummary(data))
        .catch(err => console.error("Summary fetch error:", err));
    }
  }, []);

  const todayGoals = tasks.filter((g) => g.date === TODAY);
  const hasGoalsToday = todayGoals.length > 0;

  const msgIdx = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
  const message = MOTIVATIONAL_MESSAGES[msgIdx];

  return (
    <>
      <div className="top-page">
        <div className="top-page__header">
          <div>
            <div className="top-page__date">{getDateLabel()}</div>
            <div className="top-page__greeting">
              {/* 正しくユーザー情報が入れば、ここの「読み込み中...」が「こんにちは、〇〇さん 👋」になります */}
              {user ? `こんにちは、${user.user_name}さん 👋` : "読み込み中..."}
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