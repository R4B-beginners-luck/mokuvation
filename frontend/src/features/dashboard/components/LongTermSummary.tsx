import type { LongTermGoal, ShortTermGoal } from '../../../types';

interface LongTermSummaryProps {
  longTermGoals: LongTermGoal[];
  shortTermGoals: ShortTermGoal[];
}

export function LongTermSummary({ longTermGoals, shortTermGoals }: LongTermSummaryProps) {
  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-gold)' }} />
        長期目標の進行状況
      </div>

      {longTermGoals.map((lt) => {
        const related   = shortTermGoals.filter((s) => s.longTermGoalId === lt.id);
        const completed = related.filter((s) => s.completed).length;
        const pct       = related.length > 0 ? Math.round((completed / related.length) * 100) : 0;

        return (
          <div key={lt.id} className="lt-summary-item">
            <div className="lt-summary-item__header">
              <span className="lt-summary-item__title" title={lt.title}>{lt.title}</span>
              <span className="lt-summary-item__pct">{pct}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--sp-1)' }}>
              {completed} / {related.length} タスク完了
            </div>
          </div>
        );
      })}
    </section>
  );
}
