import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Goal, LongTermGoal, MidTermGoal, ShortTermGoal, Task, NodePosition } from '../types';
import { GoalGraph, GoalDetailPanel, GoalDetailSheet } from '../features/goals';
import { GoalLongTermTabs } from '../features/goals/components/GoalLongTermTabs';
import { GoalsMapFab } from '../features/goals/components/GoalsMapFab';
import { GoalPositionLeaveModal } from '../features/goals/components/GoalPositionLeaveModal';
import { GoalPositionSaveBar } from '../features/goals/components/GoalPositionSaveBar';
import { GoalPositionSaveToast } from '../features/goals/components/GoalPositionSaveToast';
import { GoalsMapSecondaryPanel } from '../features/goals/components/GoalsMapSecondaryPanel';
import { useGoalsLeaveGuardRegistrar, useGoalsLeaveRequest } from '../layouts/GoalsLeaveGuardContext';
import { usePageSecondaryPanel } from '../layouts/PageSecondaryPanelContext';
import { computeInitialPositions, mergeGoalPositions } from '../features/goals/utils/goalMapLayout';
import { isGoalHiddenOnMap, resolveGoalVisibilities } from '../features/goals/utils/resolveGoalVisibility';
import { GoalActionModal, type GoalActionMode, type GoalActionPayload } from '../features/goals/components/GoalActionModal';
import { goalApi, type BackendGoal, type CreateGoalPayload, type UpdateGoalPayload } from '../features/goals/api/goalApi';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { COLOR_PALETTE } from '../const/colors';
import { GoalsPageSkeleton } from '../components/ui/GoalsPageSkeleton';
import { ButtonSpinner } from '../components/ui/ButtonSpinner';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  GoalCelebrationOverlay,
  pickRandomGoalMessage,
  prefetchGoalCelebrationLottie,
  type GoalCelebrationSession,
} from '../components/ui/celebration';

const DETAIL_CLOSE_MS = 280;

type GoalActionState = {
  mode: GoalActionMode;
  goal: Goal;
  presetGoalType?: 'mid' | 'short';
};

type PlacementSession = {
  type: 'add' | 'edit';
  movableGoalIds: string[];
  draftPositions: Record<string, NodePosition>;
  baselinePositions: Record<string, NodePosition>;
};

type LoadedGoalsData = {
  longTermGoals: LongTermGoal[];
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  savedPositions: Record<string, NodePosition>;
};

interface GoalsPageProps {
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
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

function extractSavedPositions(goals: BackendGoal[]): Record<string, NodePosition> {
  const saved: Record<string, NodePosition> = {};

  goals.forEach((goal) => {
    if (goal.period_type === 'long') return;
    if (goal.position_x == null || goal.position_y == null) return;

    const x = Number(goal.position_x);
    const y = Number(goal.position_y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    saved[goal.id] = { x, y };
  });

  return saved;
}

function filterPendingPositions(
  pending: Record<string, NodePosition>,
  validGoalIds: Set<string>
): Record<string, NodePosition> {
  return Object.fromEntries(
    Object.entries(pending).filter(([goalId]) => validGoalIds.has(goalId))
  );
}

function sanitizePosition(position: NodePosition): NodePosition | null {
  const x = Math.round(position.x * 100) / 100;
  const y = Math.round(position.y * 100) / 100;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function collectActiveMovableGoalIds(
  mids: MidTermGoal[],
  shorts: ShortTermGoal[],
  activeLtId: string
): string[] {
  return [
    ...mids.filter((m) => m.longTermGoalId === activeLtId).map((m) => m.id),
    ...shorts.filter((s) => s.longTermGoalId === activeLtId).map((s) => s.id),
  ];
}

function buildBaselinePositions(
  longTermGoal: LongTermGoal,
  mids: MidTermGoal[],
  shorts: ShortTermGoal[],
  saved: Record<string, NodePosition>,
  goalIds: string[]
): Record<string, NodePosition> {
  const auto = computeInitialPositions(longTermGoal, mids, shorts);
  const merged = mergeGoalPositions(auto, saved, {}, longTermGoal.id);
  const baseline: Record<string, NodePosition> = {};
  goalIds.forEach((id) => {
    if (merged[id]) baseline[id] = merged[id];
  });
  return baseline;
}

function formatPositionSaveError(error: unknown): string {
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as { status: number; data?: Record<string, unknown> };
    const message = typeof apiError.data?.message === 'string'
      ? apiError.data.message
      : null;
    const validationErrors = apiError.data?.errors;
    const firstValidationError =
      validationErrors && typeof validationErrors === 'object'
        ? Object.values(validationErrors as Record<string, string[]>).flat()[0]
        : null;

    if (apiError.status === 401) {
      return '認証が切れています。再度ログインしてください。';
    }
    if (apiError.status === 404) {
      return '配置保存APIが見つかりません。バックエンドのデプロイとマイグレーションを確認してください。';
    }
    if (firstValidationError) {
      return `配置の保存に失敗しました: ${firstValidationError}`;
    }
    if (message) {
      return `配置の保存に失敗しました: ${message}`;
    }
    return `配置の保存に失敗しました（HTTP ${apiError.status}）。`;
  }

  return '配置の保存に失敗しました。再度お試しください。';
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
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [goalLoadError, setGoalLoadError] = useState<string | null>(null);
  const [savedPositions, setSavedPositions] = useState<Record<string, NodePosition>>({});
  const [pendingPositions, setPendingPositions] = useState<Record<string, NodePosition>>({});
  const [isSavingPositions, setIsSavingPositions] = useState(false);
  const [positionSaveNotice, setPositionSaveNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [goalCelebration, setGoalCelebration] = useState<GoalCelebrationSession | null>(null);
  const [placementSession, setPlacementSession] = useState<PlacementSession | null>(null);
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [focusGoalId, setFocusGoalId] = useState<string | null>(null);
  const [mobileSheetHeightPx, setMobileSheetHeightPx] = useState(0);
  const [detailClosing, setDetailClosing] = useState(false);
  const [leavePrompt, setLeavePrompt] = useState<{ proceed: () => void } | null>(null);
  const placementSessionRef = useRef<PlacementSession | null>(null);
  const isMobileLayout = useMediaQuery('(max-width: 768px)');
  const { setPanel } = usePageSecondaryPanel();
  const registerLeaveGuard = useGoalsLeaveGuardRegistrar();
  const requestGoalsLeave = useGoalsLeaveRequest();
  useEffect(() => {
    placementSessionRef.current = placementSession;
  }, [placementSession]);

  // 達成演出の初回表示を軽くするため、目標マップ表示中に Lottie を先読みする
  useEffect(() => {
    prefetchGoalCelebrationLottie();
  }, []);

  const dismissGoalCelebration = useCallback(() => {
    setGoalCelebration(null);
  }, []);

  const graphPendingPositions = placementSession?.draftPositions ?? pendingPositions;

  const longTermGoalIds = useMemo(
    () => new Set(longTermGoals.map((goal) => goal.id)),
    [longTermGoals]
  );
  const pendingPositionCount = useMemo(
    () => Object.keys(pendingPositions).filter((goalId) => !longTermGoalIds.has(goalId)).length,
    [pendingPositions, longTermGoalIds]
  );

  const activeLt = longTermGoals.find((l) => l.id === activeLtId) ?? longTermGoals[0] ?? null;

  const activeMids = useMemo(
    () => midTermGoals.filter((m) => m.longTermGoalId === activeLt?.id),
    [midTermGoals, activeLt?.id],
  );
  const activeShorts = useMemo(
    () => shortTermGoalsState.filter((s) => s.longTermGoalId === activeLt?.id),
    [shortTermGoalsState, activeLt?.id],
  );

  const goalDisplayModes = useMemo(() => {
    if (!activeLt) return {};
    return resolveGoalVisibilities(
      activeLt,
      activeMids,
      activeShorts,
      !demoShowCompleted,
    );
  }, [activeLt, activeMids, activeShorts, demoShowCompleted]);

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
    if (!demoShowCompleted && selectedGoal && isGoalHiddenOnMap(selectedGoal.id, goalDisplayModes)) {
      setSelectedGoal(null);
    }
  }, [demoShowCompleted, selectedGoal, goalDisplayModes]);

  const loadGoals = async (preferredActiveLtId?: string, showLoadingUI = false): Promise<LoadedGoalsData | null> => {
    if (showLoadingUI) {
      setIsLoadingGoals(true);
    }
    setGoalLoadError(null);
    setShowCompletedGoals(showCompletedGoals);
    
    try {
      const goals = await goalApi.getAll();
      const { longTermGoals, midTermGoals, shortTermGoals } = buildGoalTree(goals);
      const validGoalIds = new Set(goals.map((goal) => goal.id));
      const apiLongTermIds = new Set(
        goals.filter((goal) => goal.period_type === 'long').map((goal) => goal.id)
      );
      const nextSavedPositions = extractSavedPositions(goals);
      setLongTermGoals(longTermGoals);
      setMidTermGoals(midTermGoals);
      setShortTermGoals(shortTermGoals);
      setSavedPositions(nextSavedPositions);
      setPendingPositions((prev) => Object.fromEntries(
        Object.entries(filterPendingPositions(prev, validGoalIds))
          .filter(([goalId]) => !apiLongTermIds.has(goalId))
      ));
      if (preferredActiveLtId && longTermGoals.some((lt) => lt.id === preferredActiveLtId)) {
        setActiveLtId(preferredActiveLtId);
      }
      return {
        longTermGoals,
        midTermGoals,
        shortTermGoals,
        savedPositions: nextSavedPositions,
      };
    } catch (error) {
      setGoalLoadError('目標の読み込みに失敗しました。');
      return null;
    } finally {
      if (showLoadingUI) {
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

  const requestCloseDetail = useCallback(() => {
    setDetailClosing(true);
    setMobileSheetHeightPx(0);
    window.setTimeout(() => {
      setSelectedGoal(null);
      setDetailClosing(false);
    }, DETAIL_CLOSE_MS);
  }, []);

  const handleSelectNode = (goal: Goal) => {
    if (selectedGoal?.id === goal.id) {
      requestCloseDetail();
      return;
    }
    setDetailClosing(false);
    setSelectedGoal(goal);
    setFocusGoalId(goal.id);
    if (isMobileLayout) {
      setMobileSheetHeightPx((window.innerHeight * 20) / 100);
    }
  };

  const switchActiveLongTerm = useCallback((id: string) => {
    if (id === activeLtId) return;
    requestGoalsLeave(() => {
      setActiveLtId(id);
      setSelectedGoal(null);
      setFocusGoalId(null);
    });
  }, [activeLtId, requestGoalsLeave]);

  const hasUnsavedChanges = useCallback(
    () => pendingPositionCount > 0 || placementSession !== null,
    [pendingPositionCount, placementSession],
  );

  useEffect(() => {
    registerLeaveGuard({
      hasUnsavedChanges,
      requestLeave: (proceed) => setLeavePrompt({ proceed }),
    });
    return () => registerLeaveGuard(null);
  }, [registerLeaveGuard, hasUnsavedChanges]);

  const handleLeaveDiscard = useCallback(() => {
    const proceed = leavePrompt?.proceed;
    setPendingPositions({});
    setPlacementSession(null);
    setPositionSaveNotice(null);
    setLeavePrompt(null);
    proceed?.();
  }, [leavePrompt]);

  const handleLeaveCancel = useCallback(() => {
    setLeavePrompt(null);
  }, []);

  const handleCloseDetailSheet = useCallback(() => {
    requestCloseDetail();
  }, [requestCloseDetail]);

  const handleSheetHeightChange = useCallback((heightPx: number) => {
    setMobileSheetHeightPx(heightPx);
  }, []);

  const handleRecenterToLongTerm = useCallback(() => {
    setFocusGoalId(null);
    setRecenterRequest((count) => count + 1);
    if (selectedGoal) {
      requestCloseDetail();
    }
  }, [selectedGoal, requestCloseDetail]);

  const handleEditGoal = (goal: Goal) => {
    if (placementSession) return;
    setGoalAction({
      mode: 'edit',
      goal: resolveGoalFromState(goal, shortTermGoalsState, midTermGoals, longTermGoals),
    });
  };

  const handleAddGoal = (goal: Goal, presetGoalType?: 'mid' | 'short') => {
    if (placementSession) return;
    setGoalAction({ mode: 'add-goal', goal, presetGoalType });
  };

  const handleAddLongTerm = () => {
    if (placementSession) return;
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

  useEffect(() => {
    if (isMobileLayout) {
      setPanel(null);
      return undefined;
    }

    setPanel(
      <GoalsMapSecondaryPanel
        longTermGoals={longTermGoals}
        activeLtId={activeLtId}
        showCompleted={demoShowCompleted}
        disabled={!!placementSession}
        onSelect={switchActiveLongTerm}
        onAdd={handleAddLongTerm}
        onToggleCompleted={handleDemoCompletedToggle}
        onRecenterToLongTerm={handleRecenterToLongTerm}
      />
    );

    return () => setPanel(null);
  }, [
    isMobileLayout,
    longTermGoals,
    activeLtId,
    demoShowCompleted,
    placementSession,
    setPanel,
    switchActiveLongTerm,
    handleRecenterToLongTerm,
  ]);

  const handlePositionCommit = useCallback((goalId: string, position: NodePosition) => {
    if (longTermGoalIds.has(goalId)) return;

    if (placementSessionRef.current) {
      setPlacementSession((prev) => {
        if (!prev || !prev.movableGoalIds.includes(goalId)) return prev;
        return { ...prev, draftPositions: { ...prev.draftPositions, [goalId]: position } };
      });
    } else {
      setPendingPositions((prev) => ({ ...prev, [goalId]: position }));
    }
    setPositionSaveNotice(null);
  }, [longTermGoalIds]);

  const beginPlacementSession = useCallback((
    type: PlacementSession['type'],
    movableGoalIds: string[],
    data: LoadedGoalsData,
    activeLongTermId: string
  ) => {
    const longTermGoal = data.longTermGoals.find((lt) => lt.id === activeLongTermId);
    if (!longTermGoal || movableGoalIds.length === 0) return;

    const activeMidsForLt = data.midTermGoals.filter((m) => m.longTermGoalId === activeLongTermId);
    const activeShortsForLt = data.shortTermGoals.filter((s) => s.longTermGoalId === activeLongTermId);
    const baselinePositions = buildBaselinePositions(
      longTermGoal,
      activeMidsForLt,
      activeShortsForLt,
      data.savedPositions,
      movableGoalIds
    );

    setPlacementSession({
      type,
      movableGoalIds,
      draftPositions: {},
      baselinePositions,
    });
    setPositionSaveNotice(null);
    setPendingPositions({});

    const focusId = type === 'add' ? movableGoalIds[0] : null;
    if (focusId) {
      const focused =
        activeMidsForLt.find((m) => m.id === focusId)
        ?? activeShortsForLt.find((s) => s.id === focusId)
        ?? null;
      if (focused) {
        setSelectedGoal(focused);
        setFocusGoalId(focused.id);
      }
    }
  }, []);

  const handleSkipPlacement = useCallback(() => {
    setPlacementSession(null);
    setPositionSaveNotice(null);
  }, []);

  const handleConfirmPlacement = async (options?: { suppressNotice?: boolean }): Promise<boolean> => {
    if (!placementSession || isSavingPositions) return false;

    const resolvePosition = (goalId: string): NodePosition | null => {
      const raw = placementSession.draftPositions[goalId]
        ?? placementSession.baselinePositions[goalId];
      return raw ? sanitizePosition(raw) : null;
    };

    let entries: readonly (readonly [string, NodePosition])[];

    if (placementSession.type === 'add') {
      const goalId = placementSession.movableGoalIds[0];
      const position = goalId ? resolvePosition(goalId) : null;
      entries = goalId && position ? [[goalId, position] as const] : [];
    } else {
      entries = placementSession.movableGoalIds
        .map((goalId) => {
          const position = resolvePosition(goalId);
          if (!position) return null;
          const baseline = placementSession.baselinePositions[goalId];
          if (baseline && baseline.x === position.x && baseline.y === position.y) return null;
          return [goalId, position] as const;
        })
        .filter((entry): entry is readonly [string, NodePosition] => entry !== null);
    }

    if (entries.length === 0) {
      setPlacementSession(null);
      if (!options?.suppressNotice) {
        setPositionSaveNotice({ type: 'success', text: '配置を確定しました。' });
      }
      return true;
    }

    setIsSavingPositions(true);
    setPositionSaveNotice(null);

    try {
      await goalApi.updatePositions({
        positions: entries.map(([goal_id, position]) => ({
          goal_id,
          x: position.x,
          y: position.y,
        })),
      });

      setSavedPositions((prev) => {
        const next = { ...prev };
        entries.forEach(([goalId, position]) => {
          next[goalId] = position;
        });
        return next;
      });
      setPlacementSession(null);
      if (!options?.suppressNotice) {
        setPositionSaveNotice({ type: 'success', text: '配置を確定しました。' });
      }
      return true;
    } catch (error) {
      setPositionSaveNotice({ type: 'error', text: formatPositionSaveError(error) });
      return false;
    } finally {
      setIsSavingPositions(false);
    }
  };

  const handleSavePositions = async (options?: { suppressNotice?: boolean }): Promise<boolean> => {
    const entries = Object.entries(pendingPositions)
      .filter(([goalId]) => !longTermGoalIds.has(goalId))
      .map(([goalId, position]) => {
        const sanitized = sanitizePosition(position);
        return sanitized ? [goalId, sanitized] as const : null;
      })
      .filter((entry): entry is readonly [string, NodePosition] => entry !== null);

    if (entries.length === 0) return true;
    if (isSavingPositions) return false;

    setIsSavingPositions(true);
    setPositionSaveNotice(null);

    try {
      await goalApi.updatePositions({
        positions: entries.map(([goal_id, position]) => ({
          goal_id,
          x: position.x,
          y: position.y,
        })),
      });

      setSavedPositions((prev) => {
        const next = { ...prev };
        entries.forEach(([goalId, position]) => {
          next[goalId] = position;
        });
        return next;
      });
      setPendingPositions({});
      if (!options?.suppressNotice) {
        setPositionSaveNotice({ type: 'success', text: '保存しました' });
      }
      return true;
    } catch (error) {
      setPositionSaveNotice({ type: 'error', text: formatPositionSaveError(error) });
      return false;
    } finally {
      setIsSavingPositions(false);
    }
  };

  const handleLeaveSave = async () => {
    if (!leavePrompt || isSavingPositions) return;
    const proceed = leavePrompt.proceed;
    setLeavePrompt(null);
    const ok = placementSession
      ? await handleConfirmPlacement({ suppressNotice: true })
      : await handleSavePositions({ suppressNotice: true });
    if (ok) {
      proceed();
      return;
    }
    setLeavePrompt({ proceed });
  };

  useEffect(() => {
    if (pendingPositionCount === 0 && !placementSession) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingPositionCount, placementSession]);

  useEffect(() => {
    if (!positionSaveNotice) return undefined;

    const durationMs = positionSaveNotice.type === 'success' ? 1800 : 4000;
    const timer = window.setTimeout(() => {
      setPositionSaveNotice(null);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [positionSaveNotice]);

  const handleToggleCompleted = async (goal: Goal) => {
    const nextCompleted = !goal.completed;
    setGoalLoadError(null);
    setIsSavingGoal(true);

    // 右クリック・詳細パネル・詳細シートはすべてここを通る。達成にする瞬間だけ中央演出を出す
    if (nextCompleted) {
      setGoalCelebration({
        goalId: goal.id,
        goalTitle: goal.title,
        message: pickRandomGoalMessage(goal.title),
        sessionId: Date.now(),
      });
    }

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

        const data = await loadGoals(preferredActiveLtId);
        setGoalAction(null);

        if (data && goal.type !== 'long') {
          const activeLongTermId = preferredActiveLtId ?? data.longTermGoals[0]?.id ?? '';
          const movableGoalIds = collectActiveMovableGoalIds(
            data.midTermGoals,
            data.shortTermGoals,
            activeLongTermId
          );
          beginPlacementSession('edit', movableGoalIds, data, activeLongTermId);
        } else {
          setSelectedGoal(null);
        }
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

      const data = await loadGoals(preferredActiveLtId);
      setGoalAction(null);

      if (data && createdGoal.period_type !== 'long') {
        const activeLongTermId = preferredActiveLtId ?? data.longTermGoals[0]?.id ?? '';
        beginPlacementSession('add', [createdGoal.id], data, activeLongTermId);
      } else {
        setSelectedGoal(null);
      }
    } catch (error) {
      console.error('Goal save failed', error);
      setGoalLoadError('目標の保存に失敗しました。再度お試しください。');
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <div className={`goals-page${isMobileLayout ? ' goals-page--mobile' : ''}`}>
      {/* Graph area */}
      <div className="goals-page__graph-area">
        {isMobileLayout && (
          <GoalLongTermTabs
            longTermGoals={longTermGoals}
            activeLtId={activeLtId}
            disabled={!!placementSession}
            onSelect={switchActiveLongTerm}
            onAdd={handleAddLongTerm}
          />
        )}
        {placementSession && (
        <div className="goals-page__header">
          <div className="goals-page__placement-bar" role="region" aria-label="配置プレビュー">
              <p className="goals-page__placement-message">
                {placementSession.type === 'add'
                  ? '追加した目標の位置を決めてください。'
                  : '目標の位置を調整してください。複数まとめて動かせます。'}
              </p>
              <div className="goals-page__placement-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isSavingPositions}
                  onClick={handleSkipPlacement}
                >
                  スキップ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={isSavingPositions}
                  onClick={() => { void handleConfirmPlacement(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isSavingPositions ? (
                    <>
                      <ButtonSpinner />
                      保存中...
                    </>
                  ) : '配置を確定'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`graph-canvas-wrap${placementSession ? ' graph-canvas-wrap--placement' : ''}`}>
          {isLoadingGoals ? (
            <div className="goals-page__loading" role="status" aria-live="polite">
              <GoalsPageSkeleton />
            </div>
          ) : goalLoadError ? (
            <div className="goals-page__error">{goalLoadError}</div>
          ) : activeLt ? (
            <GoalGraph
              longTermGoal={activeLt}
              midTermGoals={activeMids}
              shortTermGoals={activeShorts}
              tasks={tasks}
              selectedId={selectedGoal?.id ?? null}
              savedPositions={savedPositions}
              pendingPositions={graphPendingPositions}
              recenterRequest={recenterRequest}
              focusGoalId={focusGoalId}
              mobileSheetObstructionPx={
                isMobileLayout && selectedGoal && !detailClosing
                  ? mobileSheetHeightPx
                  : 0
              }
              placementMode={placementSession ? {
                type: placementSession.type,
                movableGoalIds: placementSession.movableGoalIds,
                focusGoalId: placementSession.type === 'add'
                  ? placementSession.movableGoalIds[0]
                  : undefined,
              } : null}
              onSelectNode={handleSelectNode}
              onToggleCompleted={handleToggleCompleted}
              onEditGoal={handleEditGoal}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoalFromMap}
              onPositionCommit={handlePositionCommit}
              goalDisplayModes={goalDisplayModes}
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

      {/* Detail panel (desktop) — 選択時のみ表示 */}
      {selectedGoal && !isMobileLayout && (
        <GoalDetailPanel
          selected={selectedGoal}
          longTermGoals={longTermGoals}
          midTermGoals={midTermGoals}
          shortTermGoals={shortTermGoalsState}
          tasks={tasks}
          onSelectNode={handleSelectNode}
          onEditGoal={handleEditGoal}
          onAddGoal={handleAddGoal}
          onToggleCompleted={handleToggleCompleted}
          onClose={handleCloseDetailSheet}
          isSaving={isSavingGoal}
          isClosing={detailClosing}
        />
      )}

      {isMobileLayout && selectedGoal && !placementSession && (
        <GoalDetailSheet
          goalId={selectedGoal.id}
          isClosing={detailClosing}
          onClose={handleCloseDetailSheet}
          onSheetHeightChange={handleSheetHeightChange}
        >
          {(sheetLevel) => (
            <GoalDetailPanel
              embedded
              sheetLevel={sheetLevel}
              selected={selectedGoal}
              longTermGoals={longTermGoals}
              midTermGoals={midTermGoals}
              shortTermGoals={shortTermGoalsState}
              tasks={tasks}
              onSelectNode={handleSelectNode}
              onEditGoal={handleEditGoal}
              onAddGoal={handleAddGoal}
              onToggleCompleted={handleToggleCompleted}
              isSaving={isSavingGoal}
            />
          )}
        </GoalDetailSheet>
      )}

      {isMobileLayout && (
        <GoalsMapFab
          showCompleted={demoShowCompleted}
          onToggleCompleted={handleDemoCompletedToggle}
          onRecenterToLongTerm={handleRecenterToLongTerm}
        />
      )}

      {leavePrompt && (
        <GoalPositionLeaveModal
          isSaving={isSavingPositions}
          onSaveAndLeave={handleLeaveSave}
          onDiscardAndLeave={handleLeaveDiscard}
          onCancel={handleLeaveCancel}
        />
      )}

      {!placementSession && pendingPositionCount > 0 && (
        <GoalPositionSaveBar
          isSaving={isSavingPositions}
          onSave={() => { void handleSavePositions(); }}
        />
      )}

      {positionSaveNotice && (
        <GoalPositionSaveToast
          message={positionSaveNotice.text}
          type={positionSaveNotice.type}
        />
      )}

      <GoalCelebrationOverlay
        session={goalCelebration}
        onDismissed={dismissGoalCelebration}
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
