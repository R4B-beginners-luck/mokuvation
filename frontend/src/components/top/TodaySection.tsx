import type { Task, MidTermGoal, LongTermGoal } from '../../types';

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
    id ? (midTermGoals.find((m) => m.id === id)?.title ?? '') : '';

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

      {/* Mini progress bar */}
      <div className="progress-bar" style={{ marginBottom: 'var(--sp-4)' }}>
        <div
          className="progress-bar__fill"
          style={{ width: `${goals.length ? (completed / goals.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="today-goals__list">
        {goals.map((goal) => {
          const longTitle = goal.goalId ? getLongTitle(goal.goalId) : '';
          const midTitle = goal.goalId ? getMidTitle(goal.goalId) : '';
          
          // 表示したい項目を組み立て
          const tooltipText = [
            `【タスク名】 ${goal.title}`,
            `【日付】 ${goal.date ?? '未設定'}`,
            longTitle ? `【長期目標】 ${longTitle}` : '',
            midTitle ? `【中期目標】 ${midTitle}` : '',
            goal.description ? `【説明】 ${goal.description}` : ''
          ]
            .filter(Boolean)
            .join('\n');
            
          return (
            <li key={goal.id}>
              <div
                className={`goal-item${goal.completed ? ' completed' : ''}`}
                onClick={() => onToggle(goal.id)}
                data-tooltip={tooltipText} // CSSで読み取るための属性
              >
                <div className={`goal-item__check${goal.completed ? ' checked' : ''}`}>
                  {goal.completed && '✓'}
                </div>
                <div className="goal-item__body">
                  <div className="goal-item__title">{goal.title}</div>
                  <div className="goal-item__meta">
                    {longTitle && <span className="tag tag--long">{longTitle}</span>}
                    {midTitle && <span className="tag tag--mid">{midTitle}</span>}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <button className="today-goals__add-btn" onClick={onOpenModal}>
        <span>＋</span> 短期目標を追加
      </button>
    </section>
  );
}