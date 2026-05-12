import type { Task, MidTermGoal, LongTermGoal } from '../../../types';

interface DayGoalListProps {
  date: string | null;
  tasks: Task[];
  midTermGoals: MidTermGoal[];
  longTermGoals: LongTermGoal[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export function DayGoalList({ date, tasks, midTermGoals, longTermGoals }: DayGoalListProps) {
  if (!date) {
    return (
      <div className="day-detail">
        <div className="day-detail__empty">
          📅<br />日付を選択してください
        </div>
      </div>
    );
  }

  const dayGoals   = tasks.filter((g) => g.date === date);
  const completed  = dayGoals.filter((g) => g.completed).length;

  const getParentTags = (goalId?: string) => {
    if (!goalId) return { mid: undefined, long: undefined };
    
    const mid = midTermGoals.find(m => m.id === goalId);
    if (mid) {
      const long = longTermGoals.find(l => l.id === mid.longTermGoalId);
      return { mid: mid.title, long: long?.title };
    }

    const long = longTermGoals.find(l => l.id === goalId);
    return { mid: undefined, long: long?.title };
  };

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
                    {(() => {
                      const tags = getParentTags(goal.goalId);
                      return (
                        <>
                          {(tags.long || goal.goalId) && <span className="tag tag--long">{tags.long ?? '長期目標(未設定)'}</span>}
                          {tags.mid && <span className="tag tag--mid">{tags.mid}</span>}
                        </>
                      );
                    })()}
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
