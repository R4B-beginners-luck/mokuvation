import type { Task, MidTermGoal, LongTermGoal } from '../../../types';

interface TodaySectionProps {
  goals: Task[];
  midTermGoals: MidTermGoal[];
  longTermGoals: LongTermGoal[];
  onToggle: (id: string) => void;
  onOpenModal: () => void;
}

export function TodaySection({
  goals,
  midTermGoals,
  longTermGoals,
  onToggle,
  onOpenModal,
}: TodaySectionProps) {
  const completed = goals.filter((g) => g.completed).length;

  const getMidTitle = (id?: string) =>
    id ? midTermGoals.find((m) => m.id === id)?.title : undefined;

  const getLongTitle = (id: string) =>
    longTermGoals.find((l) => l.id === id)?.title ?? '';

  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-gold)' }} />
        今日のタスク
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--accent-gold)' }}>
          {completed} / {goals.length}
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: 'var(--sp-4)' }}>
        <div
          className="progress-bar__fill"
          style={{ width: `${goals.length ? (completed / goals.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="today-goals__list">
        {goals.map((goal) => (
          <li key={goal.id}>
            <div
              className={`goal-item${goal.completed ? ' completed' : ''}`}
              onClick={() => onToggle(goal.id)}
            >
              <div className={`goal-item__check${goal.completed ? ' checked' : ''}`}>
                {goal.completed && '✓'}
              </div>
              <div className="goal-item__body">
                <div className="goal-item__title">{goal.title}</div>
                <div className="goal-item__meta">
                  {/* 長期目標の表示 */}
                  {goal.goalId && (
                    <span className="tag tag--long">{getLongTitle(goal.goalId)}</span>
                  )}

                  {/* 修正ポイント：getMidTitle を使用して中期目標を表示 */}
                  {/* Task型に midTermGoalId がある場合、または goalId を中期目標IDとして扱う場合 */}
                  {goal.goalId && getMidTitle(goal.goalId) && (
                    <span className="tag tag--mid" style={{ marginLeft: 4 }}>
                      {getMidTitle(goal.goalId)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button className="today-goals__add-btn" onClick={onOpenModal}>
        <span>＋</span> 短期目標を追加
      </button>
    </section>
  );
}
