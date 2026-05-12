import type { Task } from '../../../types';
import { TODAY } from '../../../data/dummy';

interface StreakDisplayProps {
  tasks: Task[];
  streakCount?: number; // ← 追加: APIからの確定した継続日数を受け取れるようにする
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function calcStreak(goals: Task[]): number {
  const completedDates = new Set(
    goals.filter((g) => g.completed).map((g) => g.date)
  );
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (completedDates.has(daysAgo(i))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function StreakDisplay({ tasks, streakCount }: StreakDisplayProps) {
  // 修正ポイント：APIからの値を優先し、なければフロントで計算する
  const displayStreak = streakCount !== undefined ? streakCount : calcStreak(tasks);

  const todayGoals   = tasks.filter((g) => g.date === TODAY);
  const totalDone    = tasks.filter((g) => g.completed).length;

  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-violet)' }} />
        継続状況
      </div>
      <div className="streak-display">
        <div className="streak-stat">
          {/* 修正ポイント：計算結果ではなく displayStreak を表示 */}
          <div className="streak-stat__number" style={{ color: 'var(--accent-gold)' }}>
            🔥 {displayStreak}
          </div>
          <div className="streak-stat__label">連続達成日数</div>
        </div>
        
        <div className="streak-divider" />
        
        <div className="streak-stat">
          <div className="streak-stat__number" style={{ color: 'var(--accent-teal)', fontSize: 26 }}>
            {todayGoals.filter((g) => g.completed).length}/{todayGoals.length}
          </div>
          <div className="streak-stat__label">今日の達成</div>
        </div>

        <div className="streak-divider" />

        <div className="streak-stat">
          <div className="streak-stat__number" style={{ color: 'var(--accent-violet)', fontSize: 26 }}>
            {totalDone}
          </div>
          <div className="streak-stat__label">累計完了</div>
        </div>
      </div>
    </section>
  );
}
