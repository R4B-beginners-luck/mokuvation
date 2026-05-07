import type{ ShortTermGoal } from '../../types';
import { TODAY } from '../../data/dummy';

interface StreakDisplayProps {
  shortTermGoals: ShortTermGoal[];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Count consecutive days ending on "today" that have at least one completed goal */
function calcStreak(goals: ShortTermGoal[]): number {
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

export function StreakDisplay({ shortTermGoals }: StreakDisplayProps) {
  const streak = calcStreak(shortTermGoals);

  const todayGoals   = shortTermGoals.filter((g) => g.date === TODAY);
  const totalDone    = shortTermGoals.filter((g) => g.completed).length;

  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-violet)' }} />
        継続状況
      </div>
      <div className="streak-display">
        <div className="streak-stat">
          <div className="streak-stat__number" style={{ color: 'var(--accent-gold)' }}>
            🔥 {streak}
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
