import { useMemo, useState } from 'react';
import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../types';
import { longTermGoals as longTermGoalsInitial, midTermGoals as midTermGoalsInitial } from '../data/dummy';
import { GoalGraph, GoalDetailPanel } from '../features/goals';
import { GoalActionModal, type GoalActionMode, type GoalActionPayload } from '../features/goals/components/GoalActionModal';

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
  colorCode: string | null | undefined
): T {
  if (colorCode === null) {
    const { color_code: _removed, ...rest } = item;
    return rest as T;
  }
  if (colorCode) {
    return { ...item, color_code: colorCode };
  }
  return item;
}

/** デモ表示用: 達成済みなしモードでは達成済み短期目標のノードを非表示 */
function applyCompletedDemoView(
  goals: ShortTermGoal[],
  showCompleted: boolean
): ShortTermGoal[] {
  if (showCompleted) return goals;
  return goals.filter((goal) => !goal.completed);
}

function resolveGoalFromState(
  goal: Goal,
  shortTermGoals: ShortTermGoal[],
  midTermGoals: MidTermGoal[],
  longTermGoals: LongTermGoal[]
): Goal {
  if (goal.type === 'short') {
    return shortTermGoals.find((item) => item.id === goal.id) ?? goal;
  }
  if (goal.type === 'mid') {
    return midTermGoals.find((item) => item.id === goal.id) ?? goal;
  }
  return longTermGoals.find((item) => item.id === goal.id) ?? goal;
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

export function GoalsPage({ shortTermGoals, tasks }: GoalsPageProps) {
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>(longTermGoalsInitial);
  const [midTermGoals, setMidTermGoals] = useState<MidTermGoal[]>(midTermGoalsInitial);
  const [shortTermGoalsState, setShortTermGoals] = useState<ShortTermGoal[]>(shortTermGoals);
  const [activeLtId, setActiveLtId]   = useState(longTermGoalsInitial[0]?.id ?? '');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalAction, setGoalAction] = useState<GoalActionState | null>(null);
  const [demoShowCompleted, setDemoShowCompleted] = useState(true);

  const shortTermGoalsForDisplay = useMemo(
    () => applyCompletedDemoView(shortTermGoalsState, demoShowCompleted),
    [shortTermGoalsState, demoShowCompleted]
  );

  const activeLt    = longTermGoals.find((l) => l.id === activeLtId)!;
  const activeMids  = midTermGoals.filter((m) => m.longTermGoalId === activeLtId);
  const activeShorts = shortTermGoalsForDisplay.filter((s) => s.longTermGoalId === activeLtId);

  const handleDemoCompletedToggle = () => {
    const next = !demoShowCompleted;
    setDemoShowCompleted(next);
    setSelectedGoal((prev) => {
      if (!prev || prev.type !== 'short') return prev;
      const source = shortTermGoalsState.find((item) => item.id === prev.id);
      if (!source) return prev;
      if (!next && source.completed) return null;
      return source;
    });
  };

  const handleSelectNode = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalAction({
      mode: 'edit',
      goal: resolveGoalFromState(goal, shortTermGoalsState, midTermGoals, longTermGoals),
    });
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
            ? applyColorCode({
                ...item,
                title: payload.title,
                description: payload.description,
              }, payload.color_code)
            : item
        )));
      }

      if (goal.type === 'mid' && payload.longTermGoalId) {
        setMidTermGoals((prev) => prev.map((item) => (
          item.id === goal.id
            ? applyColorCode({
                ...item,
                title: payload.title,
                description: payload.description,
                dueDate: payload.dueDate,
                longTermGoalId: payload.longTermGoalId as string,
              }, payload.color_code)
            : item
        )));
        setActiveLtId(payload.longTermGoalId);
      }

      if (goal.type === 'short' && payload.longTermGoalId) {
        const longTermGoalId = payload.longTermGoalId;
        setShortTermGoals((prev) => prev.map((item) => {
          if (item.id !== goal.id) return item;
          const updated = applyColorCode({
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
          return applyColorCode({
            ...goal,
            title: payload.title,
            description: payload.description,
          }, payload.color_code);
        }
        if (goal.type === 'mid' && payload.longTermGoalId) {
          return applyColorCode({
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
      const newGoal = applyColorCode(withMid, payload.color_code);
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
          {activeLt && (
            <GoalGraph
              longTermGoal={activeLt}
              midTermGoals={activeMids}
              shortTermGoals={activeShorts}
              selectedId={selectedGoal?.id ?? null}
              onSelectNode={handleSelectNode}
            />
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
        shortTermGoals={shortTermGoalsForDisplay}
        tasks={tasks}
        onSelectNode={handleSelectNode}
        onEditGoal={handleEditGoal}
        onAddGoal={handleAddGoal}
      />

      <button
        type="button"
        className="demo-toggle goals-demo-toggle"
        onClick={handleDemoCompletedToggle}
        title="達成済みの短期目標ノードの表示/非表示を切り替えるデモ用ボタン"
      >
        {demoShowCompleted ? '✅ 達成済みの目標あり（デモ）' : '○ 達成済みの目標なし（デモ）'}
      </button>

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
