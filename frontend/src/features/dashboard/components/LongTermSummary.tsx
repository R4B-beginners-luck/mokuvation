import type { LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../../../types';

interface LongTermSummaryProps {
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
}

export function LongTermSummary({ longTermGoals, midTermGoals, shortTermGoals, tasks }: LongTermSummaryProps) {
  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-gold)' }} />
        長期目標の進行状況
      </div>

      {longTermGoals.map((lt) => {
        // 1. 直接この long term goal に紐づくタスク
        const directTasks = tasks.filter((t) => t.goalId === lt.id);

        // 2. mid term goal 経由で紐づくタスク
        const relatedMidTermGoals = midTermGoals.filter((m) => m.longTermGoalId === lt.id);
        const midTermTaskIds = new Set(
          relatedMidTermGoals
            .map((m) => m.id)
            .flatMap((midId) => tasks.filter((t) => t.goalId === midId).map((t) => t.id))
        );
        const indirectMidTasks = Array.from(midTermTaskIds)
          .map((taskId) => tasks.find((t) => t.id === taskId))
          .filter((t): t is Task => Boolean(t));

        // 3. short term goal 経由で紐づくタスク
        const relatedShortTerms = shortTermGoals.filter((s) => s.longTermGoalId === lt.id || (s.midTermGoalId && relatedMidTermGoals.some(m=>m.id===s.midTermGoalId)));
        const shortTermTaskIds = new Set(
          relatedShortTerms
            .map((s) => s.id)
            .flatMap((sid) => tasks.filter((t) => t.goalId === sid).map((t) => t.id))
        );
        const indirectShortTasks = Array.from(shortTermTaskIds)
          .map((taskId) => tasks.find((t) => t.id === taskId))
          .filter((t): t is Task => Boolean(t));

        // 4. すべてをマージ（重複排除）
        const combinedMap = new Map<string, Task>();
        directTasks.forEach(t => combinedMap.set(t.id, t));
        indirectMidTasks.forEach(t => combinedMap.set(t.id, t));
        indirectShortTasks.forEach(t => combinedMap.set(t.id, t));
        const allRelated = Array.from(combinedMap.values());
        const completed = allRelated.filter((t) => t.completed).length;
        const pct = allRelated.length > 0 ? Math.round((completed / allRelated.length) * 100) : 0;

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
              {completed} / {allRelated.length} タスク完了
            </div>
          </div>
        );
      })}
    </section>
  );
}

