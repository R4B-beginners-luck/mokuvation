import type {
  Goal,
  LongTermGoal,
  MidTermGoal,
  ShortTermGoal,
  Task,
} from '../../../types';
import type { GoalStatus } from '../components/goalNodeCard/goalNode.config';
import type { GoalProgress } from '../components/goalNodeCard/GoalNodeCard';

const DEFAULT_CATEGORY_COLOR = '#7E8A99';

/** 今日を含めてこの日数以内の期限を「期限間近」とする */
const DUE_SOON_DAYS = 5;

export interface GoalNodeAdapterContext {
  longTermGoal: LongTermGoal;
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
  /** 進捗表示単位。task=常にタスク数 / child=常に子目標数（自動切替なし） */
  progressUnit?: 'task' | 'child';
}

function isGoalCompleted(goal: Goal): boolean {
  if (goal.type === 'short') return goal.completed;
  return goal.completed ?? false;
}

function getDueDate(goal: Goal): string | undefined {
  return goal.dueDate;
}

function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ymdAfterToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isDueSoon(due: string): boolean {
  const today = todayYmdLocal();
  if (due < today) return false;
  return due <= ymdAfterToday(DUE_SOON_DAYS);
}

export function createGoalNodeAdapter(ctx: GoalNodeAdapterContext) {
  const { longTermGoal, midTermGoals, shortTermGoals, tasks, progressUnit = 'child' } = ctx;

  const goalById = new Map<string, Goal>();
  goalById.set(longTermGoal.id, longTermGoal);
  midTermGoals.forEach((m) => goalById.set(m.id, m));
  shortTermGoals.forEach((s) => goalById.set(s.id, s));

  const descendantGoalIdsCache = new Map<string, string[]>();

  function getDescendantGoalIds(goalId: string): string[] {
    const cached = descendantGoalIdsCache.get(goalId);
    if (cached) return cached;

    const ids: string[] = [];
    if (goalId === longTermGoal.id) {
      midTermGoals.forEach((m) => ids.push(m.id));
      shortTermGoals.forEach((s) => ids.push(s.id));
    } else if (midTermGoals.some((m) => m.id === goalId)) {
      shortTermGoals
        .filter((s) => s.midTermGoalId === goalId)
        .forEach((s) => ids.push(s.id));
    }

    descendantGoalIdsCache.set(goalId, ids);
    return ids;
  }

  function getSubtreeGoalIds(goalId: string): string[] {
    return [goalId, ...getDescendantGoalIds(goalId)];
  }

  const progressCache = new Map<string, GoalProgress>();

  function toProgress(goalId: string): GoalProgress {
    const cached = progressCache.get(goalId);
    if (cached) return cached;

    const subtreeIds = new Set(getSubtreeGoalIds(goalId));

    if (progressUnit === 'task') {
      const subtreeTasks = tasks.filter((t) => t.goalId && subtreeIds.has(t.goalId));
      const result: GoalProgress = {
        done: subtreeTasks.filter((t) => t.completed).length,
        total: subtreeTasks.length,
        unit: 'タスク',
      };
      progressCache.set(goalId, result);
      return result;
    }

    const childGoalIds = getDescendantGoalIds(goalId);
    const childGoals = childGoalIds
      .map((id) => goalById.get(id))
      .filter((g): g is Goal => g !== undefined);
    const result: GoalProgress = {
      done: childGoals.filter(isGoalCompleted).length,
      total: childGoals.length,
      unit: '子目標',
    };
    progressCache.set(goalId, result);
    return result;
  }

  const hasCompletedTaskCache = new Map<string, boolean>();

  function hasCompletedTaskInSubtree(goalId: string): boolean {
    const cached = hasCompletedTaskCache.get(goalId);
    if (cached !== undefined) return cached;

    const subtreeIds = new Set(getSubtreeGoalIds(goalId));
    const has = tasks.some(
      (t) => t.goalId && subtreeIds.has(t.goalId) && t.completed
    );
    hasCompletedTaskCache.set(goalId, has);
    return has;
  }

  function toGoalStatus(goal: Goal): GoalStatus {
    if (isGoalCompleted(goal)) return 'done';

    const due = getDueDate(goal);
    if (due && due < todayYmdLocal()) return 'overdue';
    if (due && isDueSoon(due)) return 'due_soon';

    if (hasCompletedTaskInSubtree(goal.id)) return 'in_progress';

    return 'todo';
  }

  function toCategoryColor(goal: Goal): string {
    return goal.color_code ?? DEFAULT_CATEGORY_COLOR;
  }

  return { toGoalStatus, toProgress, toCategoryColor };
}
