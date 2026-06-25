import { useEffect, useState } from 'react';
import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../types';
import { GoalGraph, GoalDetailPanel } from '../features/goals';
import { GoalActionModal, type GoalActionMode, type GoalActionPayload } from '../features/goals/components/GoalActionModal';
import { goalApi, type BackendGoal, type CreateGoalPayload, type UpdateGoalPayload } from '../features/goals/api/goalApi';
import { ConfirmationModal } from '../components/ConfirmationModal';
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

function getLoadingProgressLabel(progress: number): string {
  if (progress < 30) return '長期目標を取得しています';
  if (progress < 60) return '中期・短期目標を整理しています';
  if (progress < 90) return '目標マップを組み立てています';
  return '表示の最終調整をしています';
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
      completed: goal.is_completed,
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
      completed: goal.is_completed,
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

function updateGoalCompleted<T extends Goal>(
  goals: T[],
  goalId: string,
  completed: boolean
): T[] {
  return goals.map((goal) => (
    goal.id === goalId ? { ...goal, completed } : goal
  )) as T[];
}

export function GoalsPage({ shortTermGoals, tasks }: GoalsPageProps) {
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([]);
  const [midTermGoals, setMidTermGoals] = useState<MidTermGoal[]>([]);
  const [shortTermGoalsState, setShortTermGoals] = useState<ShortTermGoal[]>(shortTermGoals);
  const [showCompletedGoals, setShowCompletedGoals] = useState(true);
  const [demoShowCompleted, setDemoShowCompleted] = useState(true);
  const [activeLtId, setActiveLtId] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalAction, setGoalAction] = useState<GoalActionState | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(16);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [goalLoadError, setGoalLoadError] = useState<string | null>(null);

  const activeLt = longTermGoals.find((l) => l.id === activeLtId) ?? longTermGoals[0] ?? null;
  const hiddenLongTermIds = new Set(longTermGoals.filter((l) => l.completed).map((l) => l.id));
  const hiddenMidTermIds = new Set(
    midTermGoals
      .filter((m) => m.completed || hiddenLongTermIds.has(m.longTermGoalId))
      .map((m) => m.id)
  );
  const hiddenShortTermIds = new Set(
    shortTermGoalsState
      .filter((s) => s.completed || hiddenLongTermIds.has(s.longTermGoalId) || (s.midTermGoalId ? hiddenMidTermIds.has(s.midTermGoalId) : false))
      .map((s) => s.id)
  );

  const displayMidTermGoals = demoShowCompleted
    ? midTermGoals
    : midTermGoals.filter((m) => !hiddenMidTermIds.has(m.id));

  const shortTermGoalsForDisplay = demoShowCompleted
    ? shortTermGoalsState
    : shortTermGoalsState.filter((s) => !hiddenShortTermIds.has(s.id));

  const activeMids = displayMidTermGoals.filter((m) => m.longTermGoalId === activeLt?.id);
  const activeShorts = shortTermGoalsForDisplay.filter((s) => s.longTermGoalId === activeLt?.id);

  useEffect(() => {
    const stored = localStorage.getItem('goals-show-completed');
    setShowCompletedGoals(stored === null ? true : stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('goals-show-completed', String(showCompletedGoals));
  }, [showCompletedGoals]);

  useEffect(() => {
    if (!showCompletedGoals && selectedGoal?.completed) {
      setSelectedGoal(null);
    }
  }, [showCompletedGoals, selectedGoal]);

  useEffect(() => {
    if (!demoShowCompleted && selectedGoal) {
      const selectedIsHidden = selectedGoal.type === 'short'
        ? hiddenShortTermIds.has(selectedGoal.id)
        : selectedGoal.type === 'mid'
          ? hiddenMidTermIds.has(selectedGoal.id)
          : selectedGoal.type === 'long'
            ? hiddenLongTermIds.has(selectedGoal.id)
            : false;

      if (selectedIsHidden) {
        setSelectedGoal(null);
      }
    }
  }, [demoShowCompleted, selectedGoal, hiddenLongTermIds, hiddenMidTermIds, hiddenShortTermIds]);

  useEffect(() => {
    if (!isLoadingGoals) return undefined;

    const timer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 94) return prev;
        const step = prev < 45 ? 10 : prev < 75 ? 6 : 3;
        return Math.min(prev + step, 94);
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [isLoadingGoals]);

  const loadGoals = async (preferredActiveLtId?: string, showLoadingUI = false) => {
    if (showLoadingUI) {
      setLoadingProgress(16);
      setIsLoadingGoals(true);
    }
    setGoalLoadError(null);
    setShowCompletedGoals(showCompletedGoals);
    
    try {
      const goals = await goalApi.getAll();
      const { longTermGoals, midTermGoals, shortTermGoals } = buildGoalTree(goals);
      setLongTermGoals(longTermGoals);
      setMidTermGoals(midTermGoals);
      setShortTermGoals(shortTermGoals);
      if (preferredActiveLtId && longTermGoals.some((lt) => lt.id === preferredActiveLtId)) {
        setActiveLtId(preferredActiveLtId);
      }
    } catch (error) {
      setGoalLoadError('目標の読み込みに失敗しました。');
    } finally {
      if (showLoadingUI) {
        setLoadingProgress(100);
        await new Promise((resolve) => window.setTimeout(resolve, 90));
        setIsLoadingGoals(false);
      }
    }
  };

  useEffect(() => {
    loadGoals(undefined, true);
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

  const handleDeleteGoal = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteGoalFromMap = (goal: Goal) => {
    handleEditGoal(goal);
    setIsDeleteConfirmOpen(true);
  };

  const handleDemoCompletedToggle = () => {
    setDemoShowCompleted((prev) => !prev);
  };

  const handleToggleCompleted = async (goal: Goal) => {
    const nextCompleted = !goal.completed;
    setGoalLoadError(null);
    setIsSavingGoal(true);

    if (goal.type === 'long') {
      setLongTermGoals((prev) => updateGoalCompleted(prev, goal.id, nextCompleted));
    } else if (goal.type === 'mid') {
      setMidTermGoals((prev) => updateGoalCompleted(prev, goal.id, nextCompleted));
    } else {
      setShortTermGoals((prev) => updateGoalCompleted(prev, goal.id, nextCompleted));
    }

    setSelectedGoal((prev) => (
      prev?.id === goal.id ? { ...prev, completed: nextCompleted } as Goal : prev
    ));

    try {
      const updatedGoal = await goalApi.update(goal.id, { is_completed: nextCompleted });

      if (updatedGoal.is_completed !== nextCompleted) {
        if (goal.type === 'long') {
          setLongTermGoals((prev) => updateGoalCompleted(prev, goal.id, updatedGoal.is_completed));
        } else if (goal.type === 'mid') {
          setMidTermGoals((prev) => updateGoalCompleted(prev, goal.id, updatedGoal.is_completed));
        } else {
          setShortTermGoals((prev) => updateGoalCompleted(prev, goal.id, updatedGoal.is_completed));
        }

        setSelectedGoal((prev) => (
          prev?.id === goal.id ? { ...prev, completed: updatedGoal.is_completed } as Goal : prev
        ));
      }
    } catch (error) {
      if (goal.type === 'long') {
        setLongTermGoals((prev) => updateGoalCompleted(prev, goal.id, goal.completed ?? false));
      } else if (goal.type === 'mid') {
        setMidTermGoals((prev) => updateGoalCompleted(prev, goal.id, goal.completed ?? false));
      } else {
        setShortTermGoals((prev) => updateGoalCompleted(prev, goal.id, goal.completed));
      }

      setSelectedGoal((prev) => (
        prev?.id === goal.id ? { ...prev, completed: goal.completed } as Goal : prev
      ));

      console.error('Goal completion toggle failed', error);
      setGoalLoadError('達成状態の更新に失敗しました。再度お試しください。');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!goalAction) return;

    setIsSavingGoal(true);
    try {
      const { goal } = goalAction;
      await goalApi.delete(goal.id);

      const preferredActiveLtId = goal.type === 'long'
        ? undefined
        : (goal as MidTermGoal | ShortTermGoal).longTermGoalId;

      await loadGoals(preferredActiveLtId);
      setSelectedGoal(null);
      setGoalAction(null);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Goal delete failed', error);
      setGoalLoadError('目標の削除に失敗しました。再度お試しください。');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleSaveGoalAction = async (payload: GoalActionPayload) => {
    if (!goalAction) return;

    setIsSavingGoal(true);
    try {
      const { mode, goal } = goalAction;

      if (mode === 'edit') {
        const updatePayload: UpdateGoalPayload = {
          title: payload.title,
          description: payload.description ?? null,
          due_at: payload.dueDate ?? null,
          is_completed: payload.completed,
          color_code: payload.color_code ?? null,
        };
        await goalApi.update(goal.id, updatePayload);

        const preferredActiveLtId = goal.type === 'long'
          ? goal.id
          : payload.longTermGoalId ?? (goal as MidTermGoal | ShortTermGoal).longTermGoalId;

        await loadGoals(preferredActiveLtId);
        setSelectedGoal(null);
        setGoalAction(null);
        return;
      }

      const createPayload: CreateGoalPayload = {
        title: payload.title,
        description: payload.description ?? null,
        period_type: mode === 'add-long' || payload.goalType === 'long'
          ? 'long'
          : payload.goalType === 'mid'
            ? 'middle'
            : 'short',
        due_at: payload.dueDate ?? null,
        parent_goal_id: payload.goalType === 'short'
          ? payload.midTermGoalId ?? payload.longTermGoalId ?? undefined
          : payload.longTermGoalId ?? undefined,
        color_code: payload.color_code ?? null,
      };
      const createdGoal = await goalApi.create(createPayload);

      const preferredActiveLtId = createdGoal.period_type === 'long'
        ? createdGoal.id
        : payload.longTermGoalId;

      await loadGoals(preferredActiveLtId);
      setSelectedGoal(null);
      setGoalAction(null);
    } catch (error) {
      console.error('Goal save failed', error);
      setGoalLoadError('目標の保存に失敗しました。再度お試しください。');
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <div className="goals-page">
      {/* Graph area */}
      <div className="goals-page__graph-area">
        <div className="goals-page__header">
          <h1 className="goals-page__title">🗺️ 目標マップ</h1>
          <div className="goals-page__selector">
            <button
              type="button"
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap', fontSize: 13 }}
              onClick={handleDemoCompletedToggle}
              title="達成済みの短期目標の表示/非表示を切り替え"
            >
              {demoShowCompleted ? '達成済み目標の非表示' : '達成済み短期を表示'}
            </button>
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
            <div className="goals-page__loading" role="status" aria-live="polite">
              <div className="goals-page__loading-card">
                <div className="goals-page__loading-header">
                  <div className="goals-page__loading-title">目標を読み込み中です...</div>
                  <div className="goals-page__loading-percent">{loadingProgress}%</div>
                </div>
                <div className="goals-page__loading-bar">
                  <div
                    className="goals-page__loading-bar-fill"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="goals-page__loading-subtext">
                  {getLoadingProgressLabel(loadingProgress)}
                </div>
              </div>
            </div>
          ) : goalLoadError ? (
            <div className="goals-page__error">{goalLoadError}</div>
          ) : activeLt ? (
            <GoalGraph
              longTermGoal={activeLt}
              midTermGoals={activeMids}
              shortTermGoals={activeShorts}
              selectedId={selectedGoal?.id ?? null}
              onSelectNode={handleSelectNode}
              onToggleCompleted={handleToggleCompleted}
              onEditGoal={handleEditGoal}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoalFromMap}
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
        midTermGoals={displayMidTermGoals}
        shortTermGoals={shortTermGoalsForDisplay}
        tasks={tasks}
        onSelectNode={handleSelectNode}
        onEditGoal={handleEditGoal}
        onAddGoal={handleAddGoal}
        onToggleCompleted={handleToggleCompleted}
        isSaving={isSavingGoal}
      />

      {goalAction && (
        <>
          <GoalActionModal
            key={`${goalAction.mode}-${goalAction.goal.id}-${goalAction.presetGoalType ?? ''}`}
            mode={goalAction.mode}
            goal={goalAction.goal}
            longTermGoals={longTermGoals}
            midTermGoals={midTermGoals}
            presetGoalType={goalAction.presetGoalType}
            onClose={() => setGoalAction(null)}
            onSave={handleSaveGoalAction}
            onDelete={handleDeleteGoal}
            isSaving={isSavingGoal}
          />
          {isDeleteConfirmOpen && (
            <ConfirmationModal
              title="目標の削除確認"
              description="この目標とその配下の目標およびタスクをすべて削除します。よろしいですか？"
              confirmLabel="削除する"
              cancelLabel="キャンセル"
              onConfirm={handleConfirmDeleteGoal}
              onCancel={handleCancelDelete}
              isLoading={isSavingGoal}
            />
          )}
        </>
      )}
    </div>
  );
}
