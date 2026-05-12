import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../../../types';

interface GoalDetailPanelProps {
  selected: Goal | null;
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
  onSelectNode: (goal: Goal) => void;
}

const TYPE_LABEL: Record<string, string> = {
  long:  '長期目標',
  mid:   '中期目標',
  short: '短期目標',
};

const TYPE_COLOR: Record<string, string> = {
  long:  'var(--accent-gold)',
  mid:   'var(--accent-teal)',
  short: 'var(--accent-violet)',
};

function getDaysRemaining(dueDate: string): { days: number; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) {
    return { days: Math.abs(diff), label: `${Math.abs(diff)}日超過` };
  } else if (diff === 0) {
    return { days: 0, label: '今日まで' };
  } else {
    return { days: diff, label: `あと${diff}日` };
  }
}

export function GoalDetailPanel({
  selected,
  longTermGoals,
  midTermGoals,
  shortTermGoals,
  tasks,
  onSelectNode,
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

  const relatedGoals: Goal[] = [];

  if (selected.type === 'long') {
    midTermGoals
      .filter((m) => m.longTermGoalId === selected.id)
      .forEach((m) => relatedGoals.push(m));
    shortTermGoals
      .filter((s) => s.longTermGoalId === selected.id && !s.midTermGoalId)
      .forEach((s) => relatedGoals.push(s));
  }

  if (selected.type === 'mid') {
    const m = selected as MidTermGoal;
    const lt = longTermGoals.find((l) => l.id === m.longTermGoalId);
    if (lt) relatedGoals.push(lt);
    m.relatedMidTermGoalIds.forEach((rid) => {
      const rel = midTermGoals.find((x) => x.id === rid);
      if (rel) relatedGoals.push(rel);
    });
    shortTermGoals
      .filter((s) => s.midTermGoalId === m.id)
      .forEach((s) => relatedGoals.push(s));
  }

  if (selected.type === 'short') {
    const s = selected as ShortTermGoal;
    const lt = longTermGoals.find((l) => l.id === s.longTermGoalId);
    if (lt) relatedGoals.push(lt);
    if (s.midTermGoalId) {
      const mt = midTermGoals.find((m) => m.id === s.midTermGoalId);
      if (mt) relatedGoals.push(mt);
    }
  }

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
  const accentColor = TYPE_COLOR[selected.type] || 'var(--text-muted)';

  return (
    <aside className="detail-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <span
          className="tag"
          style={{
            background: `${accentColor}1a`,
            color: accentColor,
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 'var(--r-full)',
          }}
        >
          {TYPE_LABEL[selected.type]}
        </span>
        {selected.type === 'short' && (
          <span
            className="detail-panel__status"
            style={{ color: (selected as ShortTermGoal).completed ? 'var(--color-success)' : 'var(--text-muted)' }}
          >
            <span
              className="status-dot"
              style={{ background: (selected as ShortTermGoal).completed ? 'var(--color-success)' : 'var(--accent-gold)' }}
            />
            {(selected as ShortTermGoal).completed ? '達成済み' : '未達成'}
          </span>
        )}
      </div>

      <div>
        <div
          className="detail-panel__title"
          style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 'var(--sp-3)' }}
        >
          {selected.title}
        </div>
        {(selected.type === 'mid' || selected.type === 'short') && (selected as MidTermGoal | ShortTermGoal).dueDate && (
          (() => {
            const dueDate = (selected as MidTermGoal | ShortTermGoal).dueDate!;
            const { label } = getDaysRemaining(dueDate);
            return (
              <div style={{ 
                marginTop: '12px', 
                paddingLeft: 'var(--sp-3)',
                fontSize: 13, 
                fontWeight: 600,
                color: accentColor,
                backgroundColor: `${accentColor}15`,
                padding: '8px var(--sp-3)',
                borderRadius: '6px'
              }}>
                📅 {dueDate} · <span style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
              </div>
            );
          })()
        )}
      </div>

      {selected.description && (
        <div>
          <div className="detail-panel__section-title">説明</div>
          <p className="detail-panel__desc">{selected.description}</p>
        </div>
      )}

      {relatedGoals.length > 0 && (
        <div>
          <div className="detail-panel__section-title">
            関連ノード（{relatedGoals.length}件）
          </div>
          {relatedGoals.map((g) => (
            <div
              key={g.id}
              className="related-node"
              onClick={() => onSelectNode(g)}
              title={g.title}
            >
              <span
                className="related-node__dot"
                style={{ background: TYPE_COLOR[g.type] }}
              />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                {g.title}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {TYPE_LABEL[g.type]}
              </span>
            </div>
          ))}
        </div>
      )}

      {relatedTasks.length > 0 && (
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <div className="detail-panel__section-title">
            関連タスク（{completedTasks} / {relatedTasks.length}件完了）
          </div>
          {selected.type !== 'short' ? (
            <details>
              <summary style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>
                配下のタスク一覧を表示
              </summary>
              <ul style={{ listStyle: 'none', margin: '8px 0 0 0', padding: 0 }}>
                {relatedTasks.map(t => (
                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: 13 }}>
                    <span style={{ color: t.completed ? 'var(--color-success)' : 'var(--text-muted)' }}>{t.completed ? '✓' : '○'}</span>
                    <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'inherit' }}>{t.title}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{t.date}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {relatedTasks.map(t => (
                <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: 13 }}>
                  <span style={{ color: t.completed ? 'var(--color-success)' : 'var(--text-muted)' }}>{t.completed ? '✓' : '○'}</span>
                  <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'inherit' }}>{t.title}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{t.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="detail-panel__actions">
        <button className="btn-secondary" style={{ width: '100%', textAlign: 'center', fontSize: 13 }}>
          ✏️ 編集する
        </button>
        <button className="btn-ghost" style={{ width: '100%', textAlign: 'center', fontSize: 13 }}>
          ＋ 子目標を追加
        </button>
      </div>
    </aside>
  );
}
