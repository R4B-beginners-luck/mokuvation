import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Undo2,
  X,
} from 'lucide-react';
import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../../../types';
import { DEFAULT_GOAL_COLOR } from '../../../const/colors';
import { GoalTypeBadge } from '../../../components/goals/GoalTypeIcon';
import { createGoalNodeAdapter } from '../utils/goalNodeAdapter';
import type { GoalDetailSheetLevel } from './GoalDetailSheet';

interface GoalDetailPanelProps {
  selected: Goal | null;
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
  progressUnit?: 'task' | 'child';
  onSelectNode: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: (goal: Goal, presetGoalType?: 'mid' | 'short') => void;
  onToggleCompleted: (goal: Goal) => void;
  onClose?: () => void;
  isSaving?: boolean;
  isClosing?: boolean;
  embedded?: boolean;
  sheetLevel?: GoalDetailSheetLevel;
}

type DueDateTone = 'neutral' | 'week' | 'soon' | 'today' | 'overdue';

function RelGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`detail-panel__rel-group${open ? ' detail-panel__rel-group--open' : ''}`}>
      <button
        type="button"
        className="detail-panel__summary"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={16} strokeWidth={2} className="detail-panel__summary-chevron" aria-hidden />
        ) : (
          <ChevronRight size={16} strokeWidth={2} className="detail-panel__summary-chevron" aria-hidden />
        )}
        <span className="detail-panel__summary-label">{title}</span>
      </button>
      {open && <div className="detail-panel__rel-body">{children}</div>}
    </div>
  );
}

function DetailPanelRoot({
  embedded,
  isClosing = false,
  children,
}: {
  embedded?: boolean;
  isClosing?: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className="detail-panel detail-panel--embedded">{children}</div>;
  }

  return (
    <aside
      className={[
        'detail-panel',
        'goals-page__desktop-detail',
        isClosing ? 'goals-page__desktop-detail--closing' : '',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </aside>
  );
}

type ChildSortMode = 'default' | 'color' | 'kana';

type ChildRow = { goal: Goal; depth: number };

function getGoalColor(goal: Goal): string {
  return goal.color_code || DEFAULT_GOAL_COLOR;
}

function sortGoalsList(goals: Goal[], mode: ChildSortMode): Goal[] {
  if (mode === 'default') return goals;
  const copy = [...goals];
  if (mode === 'color') {
    copy.sort((a, b) => {
      const byColor = getGoalColor(a).localeCompare(getGoalColor(b));
      if (byColor !== 0) return byColor;
      return a.title.localeCompare(b.title, 'ja');
    });
    return copy;
  }
  copy.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  return copy;
}

/** 中期の下に短期をインデントしてぶら下げる（GoalPicker と同じ階層表現） */
function buildChildRows(
  selected: Goal,
  childMidGoals: MidTermGoal[],
  childShortGoals: ShortTermGoal[],
  sortMode: ChildSortMode,
): ChildRow[] {
  if (selected.type === 'mid') {
    return sortGoalsList(childShortGoals, sortMode).map((goal) => ({ goal, depth: 0 }));
  }
  if (selected.type !== 'long') return [];

  const shortsByMid = new Map<string, ShortTermGoal[]>();
  const directShorts: ShortTermGoal[] = [];
  for (const short of childShortGoals) {
    if (short.midTermGoalId) {
      const list = shortsByMid.get(short.midTermGoalId) ?? [];
      list.push(short);
      shortsByMid.set(short.midTermGoalId, list);
    } else {
      directShorts.push(short);
    }
  }

  const rows: ChildRow[] = [];
  for (const mid of sortGoalsList(childMidGoals, sortMode) as MidTermGoal[]) {
    rows.push({ goal: mid, depth: 0 });
    const children = sortGoalsList(shortsByMid.get(mid.id) ?? [], sortMode);
    for (const short of children) {
      rows.push({ goal: short, depth: 1 });
    }
  }
  for (const short of sortGoalsList(directShorts, sortMode)) {
    rows.push({ goal: short, depth: 0 });
  }
  return rows;
}

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

function getDueDateText(goal: { dueDate?: string }): { text: string; tone: DueDateTone; date: string } {
  const { label, tone } = getDueDateMeta(goal.dueDate!);
  return { text: `${goal.dueDate} · ${label}`, tone, date: goal.dueDate! };
}

const iconBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
} as const;

function resolveRootLongTerm(
  selected: Goal,
  longTermGoals: LongTermGoal[]
): LongTermGoal | null {
  if (selected.type === 'long') {
    return selected;
  }
  const longId = selected.longTermGoalId;
  return longTermGoals.find((goal) => goal.id === longId) ?? null;
}

export function GoalDetailPanel({
  selected,
  longTermGoals,
  midTermGoals,
  shortTermGoals,
  tasks,
  progressUnit = 'child',
  onSelectNode,
  onEditGoal,
  onAddGoal,
  onToggleCompleted,
  onClose,
  isSaving,
  isClosing = false,
  embedded = false,
  sheetLevel,
}: GoalDetailPanelProps) {
  const [childSort, setChildSort] = useState<ChildSortMode>('default');
  const [colorFilterOpen, setColorFilterOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [parentOpen, setParentOpen] = useState(true);
  const [childrenOpen, setChildrenOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(false);

  useEffect(() => {
    setChildSort('default');
    setColorFilterOpen(false);
    setSelectedColors([]);
  }, [selected?.id]);

  if (!selected) {
    return (
      <DetailPanelRoot embedded={embedded} isClosing={isClosing}>
        <div className="detail-panel__empty">
          <div className="detail-panel__empty-icon">
            <MapPin size={32} strokeWidth={1.75} aria-hidden />
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            ノードをクリックすると<br />詳細が表示されます
          </p>
        </div>
      </DetailPanelRoot>
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

  const childGoals = [...childMidGoals, ...childShortGoals];

  const availableColors = (() => {
    const colors = new Set<string>();
    childGoals.forEach((goal) => colors.add(getGoalColor(goal)));
    return Array.from(colors).sort((a, b) => a.localeCompare(b));
  })();

  const childRows = (() => {
    if (selectedColors.length === 0) {
      return buildChildRows(selected, childMidGoals, childShortGoals, childSort);
    }

    const keptMidIds = new Set(
      childMidGoals
        .filter((goal) => selectedColors.includes(getGoalColor(goal)))
        .map((m) => m.id),
    );
    const shortsForTree = childShortGoals.filter((s) => selectedColors.includes(getGoalColor(s)));
    const midsToShow = childMidGoals.filter((mid) => {
      if (keptMidIds.has(mid.id)) return true;
      return shortsForTree.some((s) => s.midTermGoalId === mid.id);
    });

    return buildChildRows(selected, midsToShow, shortsForTree, childSort);
  })();

  let relatedTasks: Task[] = [];
  if (selected.type === 'short') {
    relatedTasks = tasks.filter(t => t.goalId === selected.id);
  } else if (selected.type === 'mid') {
    const childShortIds = shortTermGoals.filter(s => s.midTermGoalId === selected.id).map(s => s.id);
    relatedTasks = tasks.filter(t => t.goalId === selected.id || (t.goalId && childShortIds.includes(t.goalId)));
  } else if (selected.type === 'long') {
    const childMidIds = midTermGoals.filter(m => m.longTermGoalId === selected.id).map(m => m.id);
    const childShortIds = shortTermGoals.filter(s => s.longTermGoalId === selected.id).map(s => s.id);
    relatedTasks = tasks.filter(t => t.goalId === selected.id || (t.goalId && childMidIds.includes(t.goalId)) || (t.goalId && childShortIds.includes(t.goalId)));
  }

  const completedTasks = relatedTasks.filter(t => t.completed).length;
  const accentColor = selected.color_code || DEFAULT_GOAL_COLOR;
  const dueDateInfo = selected.dueDate ? getDueDateText(selected) : null;

  const showPeek = sheetLevel === 'peek';
  const showActions = sheetLevel === undefined || sheetLevel === 'half' || sheetLevel === 'full';
  const showFullExtras = sheetLevel === undefined || sheetLevel === 'full';

  const rootLong = resolveRootLongTerm(selected, longTermGoals);
  const peekProgress = rootLong
    ? createGoalNodeAdapter({
        longTermGoal: rootLong,
        midTermGoals,
        shortTermGoals,
        tasks,
        progressUnit,
      }).toProgress(selected.id)
    : { done: 0, total: 0, unit: '子目標' };
  const peekPct = peekProgress.total > 0
    ? Math.round((peekProgress.done / peekProgress.total) * 100)
    : 0;

  if (showPeek) {
    return (
      <DetailPanelRoot embedded={embedded} isClosing={isClosing}>
        <div className="detail-panel__peek">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <GoalTypeBadge type={selected.type} fullLabel />
            {selected.completed !== undefined && (
              <span className="detail-panel__status" style={{ fontSize: 12 }}>
                {selected.completed ? '達成済み' : '未達成'}
              </span>
            )}
          </div>
          <div
            className="detail-panel__title detail-panel__title--peek"
            style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 'var(--sp-3)', color: accentColor }}
          >
            {selected.title}
          </div>
          {peekProgress.total > 0 && (
            <div className="detail-panel__peek-progress">
              <div className="detail-panel__peek-progress-label">
                {peekProgress.done} / {peekProgress.total} {peekProgress.unit}
              </div>
              <div className="detail-panel__peek-track">
                <div
                  className="detail-panel__peek-fill"
                  style={{ width: `${peekPct}%`, background: accentColor }}
                />
              </div>
            </div>
          )}
        </div>
      </DetailPanelRoot>
    );
  }

  return (
    <DetailPanelRoot embedded={embedded} isClosing={isClosing}>
      {!embedded && onClose && (
        <div className="detail-panel__header-bar">
          <span className="detail-panel__header-label">目標の詳細</span>
          <button
            type="button"
            className="detail-panel__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <GoalTypeBadge type={selected.type} fullLabel />
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
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Calendar size={13} strokeWidth={1.75} aria-hidden />
            {dueDateInfo.text}
          </div>
        )}
      </div>

      {showActions && (
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
              ...iconBtnStyle,
            }}
            onClick={() => onToggleCompleted(selected)}
            disabled={isSaving}
          >
            {selected.completed ? (
              <>
                <Undo2 size={15} strokeWidth={1.75} aria-hidden />
                未達成に戻す
              </>
            ) : (
              <>
                <Check size={15} strokeWidth={1.75} aria-hidden />
                達成済みにする
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: 13,
              gridColumn: '1 / -1',
              ...iconBtnStyle,
            }}
            onClick={() => onEditGoal(selected)}
          >
            <Pencil size={15} strokeWidth={1.75} aria-hidden />
            編集する
          </button>
          {selected.type === 'long' && (
            <>
              <button
                className="btn-secondary"
                style={{ width: '100%', textAlign: 'center', fontSize: 13, ...iconBtnStyle }}
                onClick={() => onAddGoal(selected, 'mid')}
              >
                <Plus size={15} strokeWidth={1.75} aria-hidden />
                中期目標
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', textAlign: 'center', fontSize: 13, ...iconBtnStyle }}
                onClick={() => onAddGoal(selected, 'short')}
              >
                <Plus size={15} strokeWidth={1.75} aria-hidden />
                短期目標
              </button>
            </>
          )}
          {selected.type === 'mid' && (
            <button
              className="btn-secondary"
              style={{ width: '100%', textAlign: 'center', fontSize: 13, ...iconBtnStyle }}
              onClick={() => onAddGoal(selected, 'short')}
            >
              <Plus size={15} strokeWidth={1.75} aria-hidden />
              短期目標
            </button>
          )}
        </div>
      )}

      {showFullExtras && selected.description && (
        <div>
          <div className="detail-panel__section-title">説明</div>
          <p className="detail-panel__desc">{selected.description}</p>
        </div>
      )}

      {showFullExtras && (
        <div className="detail-panel__relations">
          <RelGroup
            title={`親目標（${parentGoal ? '1件' : '0件'}）`}
            open={parentOpen}
            onToggle={() => setParentOpen((v) => !v)}
          >
            {parentGoal ? (
              <div className="detail-panel__goal-list">
                <button
                  type="button"
                  className="detail-panel__goal-row"
                  onClick={() => onSelectNode(parentGoal)}
                  title={parentGoal.title}
                >
                  <span
                    className="detail-panel__goal-dot"
                    style={{ background: getGoalColor(parentGoal) }}
                    aria-hidden
                  />
                  <GoalTypeBadge type={parentGoal.type} />
                  <span className="detail-panel__goal-title">{parentGoal.title}</span>
                </button>
              </div>
            ) : (
              <div className="detail-panel__empty-copy">親目標はありません</div>
            )}
          </RelGroup>

          <RelGroup
            title={`子目標（中期 ${childMidGoals.length}件 / 短期 ${childShortGoals.length}件）`}
            open={childrenOpen}
            onToggle={() => setChildrenOpen((v) => !v)}
          >
            {childGoals.length > 0 && (
              <div
                className="detail-panel__child-controls"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="detail-panel__sort detail-panel__sort--inline">
                  <span className="detail-panel__sort-label">並び</span>
                  <select
                    className="detail-panel__sort-select"
                    value={childSort}
                    onChange={(e) => setChildSort(e.target.value as ChildSortMode)}
                  >
                    <option value="default">デフォルト</option>
                    <option value="color">色別</option>
                    <option value="kana">あいうえお順</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={`detail-panel__filter-btn${colorFilterOpen || selectedColors.length > 0 ? ' detail-panel__filter-btn--active' : ''}`}
                  onClick={() => setColorFilterOpen((v) => !v)}
                  aria-expanded={colorFilterOpen}
                  aria-label="色で絞り込み"
                >
                  <Filter size={14} strokeWidth={2} aria-hidden />
                  絞り込み
                  {selectedColors.length > 0 ? ` (${selectedColors.length})` : ''}
                </button>
              </div>
            )}

            {colorFilterOpen && childGoals.length > 0 && (
              <div className="detail-panel__color-filter" onClick={(e) => e.stopPropagation()}>
                <div className="detail-panel__color-filter-label">使われている色</div>
                <div className="detail-panel__color-swatches">
                  {availableColors.map((color) => {
                    const active = selectedColors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`detail-panel__color-swatch${active ? ' detail-panel__color-swatch--active' : ''}`}
                        style={{ background: color }}
                        aria-pressed={active}
                        aria-label={`色 ${color} で絞り込み`}
                        onClick={() => {
                          setSelectedColors((prev) =>
                            prev.includes(color)
                              ? prev.filter((c) => c !== color)
                              : [...prev, color],
                          );
                        }}
                      />
                    );
                  })}
                </div>
                {selectedColors.length > 0 && (
                  <button
                    type="button"
                    className="detail-panel__color-filter-clear"
                    onClick={() => setSelectedColors([])}
                  >
                    絞り込みを解除
                  </button>
                )}
              </div>
            )}

            <div className="detail-panel__goal-list">
              {childGoals.length === 0 ? (
                <div className="detail-panel__empty-copy">子目標はありません</div>
              ) : childRows.length === 0 ? (
                <div className="detail-panel__empty-copy">該当する子目標がありません</div>
              ) : (
                childRows.map(({ goal, depth }) => (
                  <button
                    key={goal.id}
                    type="button"
                    className="detail-panel__goal-row"
                    style={{ paddingLeft: 8 + depth * 20 }}
                    onClick={() => onSelectNode(goal)}
                    title={goal.title}
                  >
                    <span
                      className="detail-panel__goal-dot"
                      style={{ background: getGoalColor(goal) }}
                      aria-hidden
                    />
                    <GoalTypeBadge type={goal.type} />
                    <span className="detail-panel__goal-title">{goal.title}</span>
                  </button>
                ))
              )}
            </div>
          </RelGroup>

          {relatedTasks.length > 0 && (
            <RelGroup
              title={`関連タスク（${completedTasks} / ${relatedTasks.length}件完了）`}
              open={tasksOpen}
              onToggle={() => setTasksOpen((v) => !v)}
            >
              <ul className="detail-panel__task-list">
                {relatedTasks.map((t) => (
                  <li key={t.id} className="detail-panel__task-item">
                    <span style={{ color: t.completed ? 'var(--color-success)' : 'var(--text-muted)', display: 'inline-flex' }}>
                      {t.completed ? (
                        <Check size={13} strokeWidth={1.75} aria-hidden />
                      ) : (
                        <Circle size={13} strokeWidth={1.75} aria-hidden />
                      )}
                    </span>
                    <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'inherit' }}>
                      {t.title}
                    </span>
                    <span className="detail-panel__task-date">{t.date}</span>
                  </li>
                ))}
              </ul>
            </RelGroup>
          )}
        </div>
      )}
    </DetailPanelRoot>
  );
}
