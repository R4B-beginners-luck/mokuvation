import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal } from '../../types';

interface GoalDetailPanelProps {
  selected: Goal | null;
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
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

export function GoalDetailPanel({
  selected,
  longTermGoals,
  midTermGoals,
  shortTermGoals,
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

  // ── Build related nodes list ──────────────────────────────────────────────

  const relatedGoals: Goal[] = [];

  if (selected.type === 'long') {
    // children: all mid and short that belong to this long goal
    midTermGoals
      .filter((m) => m.longTermGoalId === selected.id)
      .forEach((m) => relatedGoals.push(m));
    shortTermGoals
      .filter((s) => s.longTermGoalId === selected.id && !s.midTermGoalId)
      .forEach((s) => relatedGoals.push(s));
  }

  if (selected.type === 'mid') {
    const m = selected as MidTermGoal;
    // Parent long
    const lt = longTermGoals.find((l) => l.id === m.longTermGoalId);
    if (lt) relatedGoals.push(lt);
    // Related mids
    m.relatedMidTermGoalIds.forEach((rid) => {
      const rel = midTermGoals.find((x) => x.id === rid);
      if (rel) relatedGoals.push(rel);
    });
    // Children short
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

  const accentColor = TYPE_COLOR[selected.type];

  return (
    <aside className="detail-panel">
      {/* Type badge */}
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

      {/* Title */}
      <div>
        <div
          className="detail-panel__title"
          style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 'var(--sp-3)' }}
        >
          {selected.title}
        </div>
      </div>

      {/* Short-term date */}
      {selected.type === 'short' && (
        <div className="detail-panel__date">
          <span>📅</span>
          <span>{(selected as ShortTermGoal).date}</span>
        </div>
      )}

      {/* Description */}
      {selected.description && (
        <div>
          <div className="detail-panel__section-title">説明</div>
          <p className="detail-panel__desc">{selected.description}</p>
        </div>
      )}

      {/* Related nodes */}
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

      {/* Actions */}
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
