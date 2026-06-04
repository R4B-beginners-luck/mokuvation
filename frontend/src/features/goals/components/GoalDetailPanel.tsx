import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../../../types';
import { DEFAULT_GOAL_COLOR } from '../../../const/colors';

interface GoalDetailPanelProps {
  selected: Goal | null;
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
  onSelectNode: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: (goal: Goal, presetGoalType?: 'mid' | 'short') => void;
  onToggleCompleted: (goal: Goal) => void;
  isSaving?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  long:  '長期目標',
  mid:   '中期目標',
  short: '短期目標',
};

type DueDateTone = 'neutral' | 'week' | 'soon' | 'today' | 'overdue';

function getDueDateMeta(dueDate: string): { label: string; tone: DueDateTone } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) {
    return { label: `${Math.abs(diff)}日超過`, tone: 'overdue' };
  }

  if (diff === 0) {
    return { label: '今日まで', tone: 'today' };
  }

  if (diff <= 3) {
    return { label: `あと${diff}日`, tone: 'soon' };
  }

  if (diff <= 7) {
    return { label: `あと${diff}日`, tone: 'week' };
  }

  return { label: `あと${diff}日`, tone: 'neutral' };
}

function uniqueGoals(goals: Array<Goal | null>): Goal[] {
  const seen = new Set<string>();
  return goals.filter(isGoal).filter((goal) => {
    if (seen.has(goal.id)) {
      return false;
    }
    seen.add(goal.id);
    return true;
  });
}

function isGoal(goal: Goal | null): goal is Goal {
  return goal !== null;
}

function getDueDateText(goal: MidTermGoal | ShortTermGoal): { text: string; tone: DueDateTone } {
  const { label, tone } = getDueDateMeta(goal.dueDate!);
  return { text: `📅 ${goal.dueDate} · ${label}`, tone };
}

export function GoalDetailPanel({
  selected,
  longTermGoals,
  midTermGoals,
  shortTermGoals,
  tasks,
  onSelectNode,
  onEditGoal,
  onAddGoal,
  onToggleCompleted,
  isSaving,
}: GoalDetailPanelProps) {
  if (!selected) {
    return (
      <aside className="detail-panel">
        <div className="detail-panel__empty">
          <div className="detail-panel__empty-icon">🗺️</div>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            ノードをクリックすると<br />詳細が表示されます
          </p>
        </div>
      </aside>
    );
  }

  const parentGoal = (() => {
    if (selected.type === 'mid') {
      return longTermGoals.find((goal) => goal.id === selected.longTermGoalId) ?? null;
    }

    if (selected.type === 'short') {
      const short = selected as ShortTermGoal;
      return short.midTermGoalId
        ? midTermGoals.find((goal) => goal.id === short.midTermGoalId) ?? null
        : longTermGoals.find((goal) => goal.id === short.longTermGoalId) ?? null;
    }

    return null;
  })();

  const childMidGoals = selected.type === 'long'
    ? midTermGoals.filter((goal) => goal.longTermGoalId === selected.id)
    : [];

  const childShortGoals = selected.type === 'long'
    ? shortTermGoals.filter((goal) => goal.longTermGoalId === selected.id)
    : selected.type === 'mid'
      ? shortTermGoals.filter((goal) => goal.midTermGoalId === selected.id)
      : [];

  const relatedGoals = uniqueGoals(
    [
      ...(selected.type === 'long'
        ? longTermGoals
            .find((goal) => goal.id === selected.id)
            ?.relatedLongTermGoalIds?.map((relatedId) => longTermGoals.find((goal) => goal.id === relatedId) ?? null) ?? []
        : []),
    ]
  );

  // タスクの集計
  let relatedTasks: Task[] = [];
  if (selected.type === 'short') {
    // 短期目標：直接紐づくタスク
    relatedTasks = tasks.filter(t => t.goalId === selected.id);
  } else if (selected.type === 'mid') {
    // 中期目標：自身に紐づくタスク＋配下の短期目標に紐づくタスク
    const childShortIds = shortTermGoals.filter(s => s.midTermGoalId === selected.id).map(s => s.id);
    relatedTasks = tasks.filter(t => t.goalId === selected.id || (t.goalId && childShortIds.includes(t.goalId)));
  } else if (selected.type === 'long') {
    // 長期目標：自身＋配下の中期・短期目標に紐づくタスク
    const childMidIds = midTermGoals.filter(m => m.longTermGoalId === selected.id).map(m => m.id);
    const childShortIds = shortTermGoals.filter(s => s.longTermGoalId === selected.id).map(s => s.id);
    relatedTasks = tasks.filter(t => t.goalId === selected.id || (t.goalId && childMidIds.includes(t.goalId)) || (t.goalId && childShortIds.includes(t.goalId)));
  }

  const completedTasks = relatedTasks.filter(t => t.completed).length;
  const accentColor = selected.color_code || DEFAULT_GOAL_COLOR;
  const selectedGoal = selected as MidTermGoal | ShortTermGoal;
  const dueDateInfo = 'dueDate' in selectedGoal && selectedGoal.dueDate ? getDueDateText(selectedGoal) : null;
  const getGoalColor = (goal: Goal): string => goal.color_code || DEFAULT_GOAL_COLOR;
  const neutralTagStyle = {
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-secondary)',
  } as const;
  return (
    <aside className="detail-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <span
          className="tag"
          style={{
            ...neutralTagStyle,
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 11px',
            borderRadius: 'var(--r-full)',
          }}
        >
          {TYPE_LABEL[selected.type]}
        </span>
        {selected.completed !== undefined && (
          <span
            className="detail-panel__status"
            style={{ color: selected.completed ? 'var(--color-success)' : 'var(--text-muted)' }}
          >
            <span
              className="status-dot"
              style={{ background: selected.completed ? 'var(--color-success)' : 'var(--accent-gold)' }}
            />
            {selected.completed ? '達成済み' : '未達成'}
          </span>
        )}
      </div>

      <div>
        <div
          className="detail-panel__title"
          style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 'var(--sp-3)', color: accentColor }}
        >
          {selected.title}
        </div>
        {dueDateInfo && (
          <div
            className={`detail-panel__due-date detail-panel__due-date--${dueDateInfo.tone}`}
          >
            {dueDateInfo.text}
          </div>
        )}
      </div>

      <div
        className="detail-panel__actions"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}
      >
        <button
          className="btn-secondary"
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: 13,
            gridColumn: '1 / -1',
          }}
          onClick={() => onToggleCompleted(selected)}
          disabled={isSaving}
        >
          {selected.completed ? '✅ 未達成に戻す' : '✔️ 達成済みにする'}
        </button>
        <button
          className="btn-secondary"
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: 13,
            gridColumn: '1 / -1',
          }}
          onClick={() => onEditGoal(selected)}
        >
          ✏️ 編集する
        </button>
        {selected.type === 'long' && (
          <>
            <button
              className="btn-ghost"
              style={{ width: '100%', textAlign: 'center', fontSize: 13 }}
              onClick={() => onAddGoal(selected, 'mid')}
            >
              ＋ 中期目標
            </button>
            <button
              className="btn-ghost"
              style={{ width: '100%', textAlign: 'center', fontSize: 13 }}
              onClick={() => onAddGoal(selected, 'short')}
            >
              ＋ 短期目標
            </button>
          </>
        )}
        {selected.type === 'mid' && (
          <button
            className="btn-ghost"
            style={{ width: '100%', textAlign: 'center', fontSize: 13 }}
            onClick={() => onAddGoal(selected, 'short')}
          >
            ＋ 短期目標
          </button>
        )}
      </div>

      {selected.description && (
        <div>
          <div className="detail-panel__section-title">説明</div>
          <p className="detail-panel__desc">{selected.description}</p>
        </div>
      )}

      <div>
        <div className="detail-panel__section-title">関係性</div>
        <div style={{ display: 'grid', gap: 'var(--sp-2)' }}>
          <details open>
            <summary className="detail-panel__summary">
              親目標（{parentGoal ? '1件' : '0件'}）
            </summary>
            <div className="detail-panel__goal-list" style={{ marginTop: 'var(--sp-2)' }}>
              {parentGoal ? (
                <div className="related-node" onClick={() => onSelectNode(parentGoal)} title={parentGoal.title}>
                  <span className="related-node__dot" style={{ background: parentGoal.color_code || DEFAULT_GOAL_COLOR }} />
                  <span className="related-node__title">
                    {parentGoal.title}
                  </span>
                  <span className="related-node__type">
                    {TYPE_LABEL[parentGoal.type]}
                  </span>
                </div>
              ) : (
                <div className="detail-panel__empty-copy">親目標はありません</div>
              )}
            </div>
          </details>

          <details open>
            <summary className="detail-panel__summary" style={{ marginTop: 'var(--sp-2)' }}>
              子目標（中期 {childMidGoals.length}件 / 短期 {childShortGoals.length}件）
            </summary>
            <div className="detail-panel__goal-list" style={{ marginTop: 'var(--sp-2)' }}>
              {childMidGoals.length > 0 || childShortGoals.length > 0 ? (
                <div className="detail-panel__goal-list">
                  {[...childMidGoals, ...childShortGoals].map((goal) => (
                    <div
                      key={goal.id}
                      className="related-node"
                      onClick={() => onSelectNode(goal)}
                      title={goal.title}
                    >
                      <span className="related-node__dot" style={{ background: getGoalColor(goal) }} />
                      <span className="related-node__title">
                        {goal.title}
                      </span>
                      <span className="related-node__type">
                        {TYPE_LABEL[goal.type]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="detail-panel__empty-copy">子目標はありません</div>
              )}
            </div>
          </details>
        </div>
      </div>

      {relatedGoals.length > 0 && (
        <div>
          <div className="detail-panel__section-title">
            関連目標（{relatedGoals.length}件）
          </div>
          <details open>
            <summary className="detail-panel__summary">
              関連目標一覧を表示
            </summary>
            <div className="detail-panel__goal-list" style={{ marginTop: 'var(--sp-2)' }}>
              {relatedGoals.map((g) => (
                <div
                  key={g.id}
                  className="related-node"
                  onClick={() => onSelectNode(g)}
                  title={g.title}
                >
                  <span className="related-node__dot" style={{ background: getGoalColor(g) }} />
                  <span className="related-node__title">
                    {g.title}
                  </span>
                  <span className="related-node__type">
                    {TYPE_LABEL[g.type]}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {relatedTasks.length > 0 && (
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <div className="detail-panel__section-title">
            関連タスク（{completedTasks} / {relatedTasks.length}件完了）
          </div>
          <details>
            <summary className="detail-panel__summary">
              タスク一覧
            </summary>
            <ul style={{ listStyle: 'none', margin: '8px 0 0 0', padding: 0 }}>
              {relatedTasks.map(t => (
                <li key={t.id} className="detail-panel__task-item">
                  <span style={{ color: t.completed ? 'var(--color-success)' : 'var(--text-muted)' }}>{t.completed ? '✓' : '○'}</span>
                  <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'inherit' }}>{t.title}</span>
                  <span className="detail-panel__task-date">{t.date}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </aside>
  );
}
