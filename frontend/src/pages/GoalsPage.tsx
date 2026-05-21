import { useEffect, useState } from 'react';
import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../types';
import { GoalGraph, GoalDetailPanel } from '../features/goals';
import { GoalActionModal, type GoalActionMode, type GoalActionPayload } from '../features/goals/components/GoalActionModal';
import { goalApi, type BackendGoal } from '../features/goals/api/goalApi';
import { COLOR_PALETTE } from '../const/colors';

type GoalActionState = {
  mode: GoalActionMode;
  goal: Goal;
  presetGoalType?: 'mid' | 'short';
};

interface GoalsPageProps {
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
}

function applyColorCode<T extends { color_code?: string }>(
  item: T,
  colorCode: string | number | null | undefined
): T {
  // colorCode: number -> palette index, string -> hex color, null -> clear
  if (colorCode === null) {
    const { color_code: _removed, ...rest } = item;
    return rest as T;
  }

  if (typeof colorCode === 'number') {
    const resolved = COLOR_PALETTE[colorCode] ?? null;
    if (resolved === null) {
      const { color_code: _removed, ...rest } = item;
      return rest as T;
    }
    return { ...item, color_code: resolved } as T;
  }

  if (colorCode) {
    return { ...item, color_code: colorCode } as T;
  }

  return item;
}

function applyMidTermGoalId(
  item: ShortTermGoal,
  midTermGoalId: string | null | undefined
): ShortTermGoal {
  if (midTermGoalId === undefined) return item;
  if (midTermGoalId === null) {
    const { midTermGoalId: _removed, ...rest } = item;
    return rest;
  }
  return { ...item, midTermGoalId };
}

function formatDateString(value?: string | null): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}

function buildGoalTree(goals: BackendGoal[]) {
  const goalById = Object.fromEntries(goals.map((goal) => [goal.id, goal])) as Record<string, BackendGoal>;

  const findRootLongId = (goal: BackendGoal): string => {
    let current: BackendGoal = goal;
    while (current.parent_goal_id) {
      const parent = goalById[current.parent_goal_id];
      if (!parent) break;
      current = parent;
    }
    return current.id;
  };

  const findNearestNonShortAncestor = (goal: BackendGoal): BackendGoal | null => {
    let parent = goal.parent_goal_id ? goalById[goal.parent_goal_id] : null;
    while (parent && parent.period_type === 'short') {
      parent = parent.parent_goal_id ? goalById[parent.parent_goal_id] : null;
    }
    return parent;
  };

  const longTermGoals: LongTermGoal[] = goals
    .filter((goal) => goal.parent_goal_id === null)
    .map((goal) => ({
      id: goal.id,
      type: 'long',
      title: goal.title,
      description: goal.description ?? '',
      createdAt: formatDateString(goal.created_at) ?? '',
      color_code: typeof goal.color_code === 'number' ? COLOR_PALETTE[goal.color_code] : goal.color_code ?? undefined,
    }));

  const midTermGoals: MidTermGoal[] = goals
    .filter((goal) => goal.parent_goal_id !== null && goal.period_type !== 'short')
    .map((goal) => ({
      id: goal.id,
      type: 'mid',
      title: goal.title,
      description: goal.description ?? '',
      longTermGoalId: findRootLongId(goal),
      dueDate: formatDateString(goal.due_at),
      color_code: typeof goal.color_code === 'number' ? COLOR_PALETTE[goal.color_code] : goal.color_code ?? undefined,
      relatedMidTermGoalIds: [],
    }));

  const shortTermGoals: ShortTermGoal[] = goals
    .filter((goal) => goal.period_type === 'short')
    .map((goal) => {
      const rootLongId = findRootLongId(goal);
      const nearestNonShortAncestor = findNearestNonShortAncestor(goal);
      const midTermGoalId = nearestNonShortAncestor && nearestNonShortAncestor.parent_goal_id !== null
        ? nearestNonShortAncestor.id
        : undefined;

      return {
        id: goal.id,
        type: 'short',
        title: goal.title,
        description: goal.description ?? '',
        completed: goal.is_completed,
        longTermGoalId: rootLongId,
        midTermGoalId,
        dueDate: formatDateString(goal.due_at),
        color_code: typeof goal.color_code === 'number' ? COLOR_PALETTE[goal.color_code] : goal.color_code ?? undefined,
      };
    });

  return { longTermGoals, midTermGoals, shortTermGoals };
}

export function GoalsPage({ shortTermGoals, tasks }: GoalsPageProps) {
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([]);
  const [midTermGoals, setMidTermGoals] = useState<MidTermGoal[]>([]);
  const [shortTermGoalsState, setShortTermGoals] = useState<ShortTermGoal[]>(shortTermGoals);
  const [activeLtId, setActiveLtId] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalAction, setGoalAction] = useState<GoalActionState | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalLoadError, setGoalLoadError] = useState<string | null>(null);

  const activeLt    = longTermGoals.find((l) => l.id === activeLtId) ?? longTermGoals[0] ?? null;
  const activeMids  = midTermGoals.filter((m) => m.longTermGoalId === activeLt?.id);
  const activeShorts = shortTermGoalsState.filter((s) => s.longTermGoalId === activeLt?.id);

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      setIsLoadingGoals(true);
      setGoalLoadError(null);

      try {
        const goals = await goalApi.getAll();
        if (!isMounted) return;

        const { longTermGoals, midTermGoals, shortTermGoals } = buildGoalTree(goals);
        setLongTermGoals(longTermGoals);
        setMidTermGoals(midTermGoals);
        setShortTermGoals(shortTermGoals);
      } catch (error) {
        if (!isMounted) return;
        setGoalLoadError('目標の読み込みに失敗しました。');
      } finally {
        if (!isMounted) return;
        setIsLoadingGoals(false);
      }
    };

    loadGoals();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (longTermGoals.length > 0 && (!activeLtId || !longTermGoals.some((lt) => lt.id === activeLtId))) {
      setActiveLtId(longTermGoals[0].id);
    }
  }, [activeLtId, longTermGoals]);

  const handleSelectNode = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalAction({ mode: 'edit', goal });
  };

  const handleAddGoal = (goal: Goal, presetGoalType?: 'mid' | 'short') => {
    setGoalAction({ mode: 'add-goal', goal, presetGoalType });
  };

  const handleAddLongTerm = () => {
    const template: LongTermGoal = activeLt ?? longTermGoals[0] ?? {
      id: '__new_long__',
      type: 'long',
      title: '',
      description: '',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGoalAction({
      mode: 'add-long',
      goal: {
        ...template,
        id: '__new_long__',
        title: '',
        description: '',
        createdAt: new Date().toISOString().slice(0, 10),
      },
    });
    setSelectedGoal(null);
  };

  const handleSaveGoalAction = (payload: GoalActionPayload) => {
    if (!goalAction) return;

    const { mode, goal } = goalAction;

    if (mode === 'edit') {
      if (goal.type === 'long') {
        setLongTermGoals((prev) => prev.map((item) => (
          item.id === goal.id
            ? applyColorCode<LongTermGoal>({
                ...item,
                title: payload.title,
                description: payload.description,
              }, payload.color_code)
            : item
        )));
      }

      if (goal.type === 'mid' && payload.longTermGoalId) {
        const longTermGoalId = payload.longTermGoalId;
        setMidTermGoals((prev) => prev.map((item) => (
          item.id === goal.id
            ? applyColorCode<MidTermGoal>({
                ...item,
                title: payload.title,
                description: payload.description,
                dueDate: payload.dueDate,
                longTermGoalId,
              }, payload.color_code)
            : item
        )));
        setActiveLtId(longTermGoalId);
      }

      if (goal.type === 'short' && payload.longTermGoalId) {
        const longTermGoalId = payload.longTermGoalId;
        setShortTermGoals((prev) => prev.map((item) => {
          if (item.id !== goal.id) return item;
          const updated = applyColorCode<ShortTermGoal>({
            ...item,
            title: payload.title,
            description: payload.description,
            dueDate: payload.dueDate,
            completed: payload.completed ?? item.completed,
            longTermGoalId,
          }, payload.color_code);
          return applyMidTermGoalId(updated, payload.midTermGoalId);
        }));
        setActiveLtId(longTermGoalId);
      }

      setSelectedGoal((prev) => {
        if (prev?.id !== goal.id) return prev;
        if (goal.type === 'long') {
          return applyColorCode<LongTermGoal>({
            ...goal,
            title: payload.title,
            description: payload.description,
          }, payload.color_code);
        }
        if (goal.type === 'mid' && payload.longTermGoalId) {
          return applyColorCode<MidTermGoal>({
            ...goal,
            title: payload.title,
            description: payload.description,
            dueDate: payload.dueDate,
            longTermGoalId: payload.longTermGoalId,
          }, payload.color_code);
        }
        if (goal.type === 'short' && payload.longTermGoalId) {
          const updated = applyColorCode<ShortTermGoal>({
            ...goal,
            title: payload.title,
            description: payload.description,
            dueDate: payload.dueDate,
            completed: payload.completed ?? goal.completed,
            longTermGoalId: payload.longTermGoalId,
          }, payload.color_code);
          return applyMidTermGoalId(updated, payload.midTermGoalId);
        }
        return prev;
      });
      setGoalAction(null);
      return;
    }

    if (goalAction.mode === 'add-long' || payload.goalType === 'long') {
      const newGoal: LongTermGoal = applyColorCode<LongTermGoal>({
        id: `lt_${Date.now()}`,
        type: 'long',
        title: payload.title,
        description: payload.description,
        createdAt: new Date().toISOString().slice(0, 10),
      }, payload.color_code);
      setLongTermGoals((prev) => [...prev, newGoal]);
      setSelectedGoal(newGoal);
      setActiveLtId(newGoal.id);
      setGoalAction(null);
      return;
    }

    if (payload.goalType === 'mid' && payload.longTermGoalId) {
      const newGoal: MidTermGoal = applyColorCode<MidTermGoal>({
        id: `mt_${Date.now()}`,
        type: 'mid',
        title: payload.title,
        description: payload.description,
        longTermGoalId: payload.longTermGoalId,
        dueDate: payload.dueDate,
        relatedMidTermGoalIds: [],
      }, payload.color_code);
      setMidTermGoals((prev) => [...prev, newGoal]);
      setSelectedGoal(newGoal);
      setActiveLtId(payload.longTermGoalId);
    }

    if (payload.goalType === 'short' && payload.longTermGoalId) {
      const base: ShortTermGoal = {
        id: `st_${Date.now()}`,
        type: 'short',
        title: payload.title,
        description: payload.description,
        completed: false,
        longTermGoalId: payload.longTermGoalId,
        dueDate: payload.dueDate,
      };
      const withMid = payload.midTermGoalId
        ? { ...base, midTermGoalId: payload.midTermGoalId }
        : base;
      const newGoal = applyColorCode<ShortTermGoal>(withMid, payload.color_code);
      setShortTermGoals((prev) => [...prev, newGoal]);
      setSelectedGoal(newGoal);
      setActiveLtId(payload.longTermGoalId);
    }

    setGoalAction(null);
  };

  return (
    <div className="goals-page">
      {/* Graph area */}
      <div className="goals-page__graph-area">
        <div className="goals-page__header">
          <h1 className="goals-page__title">🗺️ 目標マップ</h1>
          <div className="goals-page__selector">
            <select
              id="goals-page-lt-select"
              className="form-select goals-page__lt-select"
              value={activeLtId}
              onChange={(e) => {
                setActiveLtId(e.target.value);
                setSelectedGoal(null);
              }}
            >
              {longTermGoals.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.title}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap', fontSize: 13 }}
              onClick={handleAddLongTerm}
            >
              ＋ 長期目標
            </button>
          </div>
        </div>

        <div className="graph-canvas-wrap">
          {isLoadingGoals ? (
            <div className="goals-page__loading">目標を読み込み中です...</div>
          ) : goalLoadError ? (
            <div className="goals-page__error">{goalLoadError}</div>
          ) : activeLt ? (
            <GoalGraph
              longTermGoal={activeLt}
              midTermGoals={activeMids}
              shortTermGoals={activeShorts}
              selectedId={selectedGoal?.id ?? null}
              onSelectNode={handleSelectNode}
            />
          ) : (
            <div className="goals-page__empty">長期目標がありません。</div>
          )}

          {/* Legend */}
          <div className="graph-legend">
            <div className="graph-legend__item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="-12 -12 24 24">
                <polygon points="10,0 5,8.66 -5,8.66 -10,0 -5,-8.66 5,-8.66" fill="#B0B0B0" />
              </svg>
              長期目標
            </div>
            <div className="graph-legend__item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="-10 -10 20 20">
                <rect x="-8.5" y="-8.5" width="17" height="17" fill="#B0B0B0" />
              </svg>
              中期目標
            </div>
            <div className="graph-legend__item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="-10 -10 20 20">
                <circle cx="0" cy="0" r="8" fill="#B0B0B0" />
              </svg>
              短期目標
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <GoalDetailPanel
        selected={selectedGoal}
        longTermGoals={longTermGoals}
        midTermGoals={midTermGoals}
        shortTermGoals={shortTermGoalsState}
        tasks={tasks}
        onSelectNode={handleSelectNode}
        onEditGoal={handleEditGoal}
        onAddGoal={handleAddGoal}
      />

      {goalAction && (
        <GoalActionModal
          key={`${goalAction.mode}-${goalAction.goal.id}-${goalAction.presetGoalType ?? ''}`}
          mode={goalAction.mode}
          goal={goalAction.goal}
          longTermGoals={longTermGoals}
          midTermGoals={midTermGoals}
          presetGoalType={goalAction.presetGoalType}
          onClose={() => setGoalAction(null)}
          onSave={handleSaveGoalAction}
        />
      )}
    </div>
  );
}
