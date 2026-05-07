import type { ShortTermGoal, MidTermGoal, LongTermGoal } from '../../../types';

interface DayGoalListProps {
  date: string | null;
  shortTermGoals: ShortTermGoal[];
  midTermGoals: MidTermGoal[];
  longTermGoals: LongTermGoal[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function DayGoalList({ date, shortTermGoals, midTermGoals, longTermGoals }: DayGoalListProps) {
  if (!date) {
    return (
      <div className="day-detail">
        <div className="day-detail__empty">
          📅<br />日付を選択してください
        </div>
      </div>
    );
  }

  const dayGoals   = shortTermGoals.filter((g) => g.date === date);
  const completed  = dayGoals.filter((g) => g.completed).length;

  const getMidTitle  = (id?: string) => id ? midTermGoals.find((m) => m.id === id)?.title  : undefined;
  const getLongTitle = (id: string)  => longTermGoals.find((l) => l.id === id)?.title ?? '';

  return (
    <div className="day-detail">
      <div className="day-detail__date">{formatDate(date)}</div>
      <div className="day-detail__count">
        {dayGoals.length > 0
          ? `${completed} / ${dayGoals.length} 件完了`
          : 'この日のタスクなし'}
      </div>

      {dayGoals.length === 0 ? (
        <div className="day-detail__empty">この日は目標が設定されていません</div>
      ) : (
        <ul className="day-detail__list">
          {dayGoals.map((goal) => (
            <li key={goal.id}>
              <div className={`goal-item${goal.completed ? ' completed' : ''}`} style={{ cursor: 'default' }}>
                <div className={`goal-item__check${goal.completed ? ' checked' : ''}`}>
                  {goal.completed && '✓'}
                </div>
                <div className="goal-item__body">
                  <div className="goal-item__title">{goal.title}</div>
                  <div className="goal-item__meta">
                    <span className="tag tag--long">{getLongTitle(goal.longTermGoalId)}</span>
                    {goal.midTermGoalId && (
                      <span className="tag tag--mid">{getMidTitle(goal.midTermGoalId)}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
