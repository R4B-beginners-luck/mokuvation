import type { LongTermGoal, MidTermGoal, ShortTermGoal } from '../../../types';

/** マップ上の表示モード。hidden は描画しない、ghost は痕跡表示 */
export type GoalDisplayMode = 'full' | 'ghost' | 'hidden';

function isGoalCompleted(goal: { completed?: boolean }): boolean {
  return goal.completed ?? false;
}

/** 葉ノード（短期）: 達成済みかつ非表示モードなら hidden、それ以外 full */
function resolveLeafVisibility(completed: boolean, hideCompleted: boolean): GoalDisplayMode {
  if (!hideCompleted || !completed) return 'full';
  return 'hidden';
}

/**
 * 達成済みの親: 配下に1つでも表示対象があれば ghost、
 * 配下がすべて hidden なら自分も hidden
 */
function resolveCompletedParentVisibility(childModes: GoalDisplayMode[]): GoalDisplayMode {
  const hasVisibleChild = childModes.some((mode) => mode !== 'hidden');
  return hasVisibleChild ? 'ghost' : 'hidden';
}

/**
 * 末端（短期）→ 中期 → 長期の順に子から判定する。
 * 親の ghost/hidden は「配下に未達成が残っているか」に依存するため、
 * 子を先に確定しないと親を正しく決められない。
 */
export function resolveGoalVisibilities(
  longTermGoal: LongTermGoal,
  midTermGoals: MidTermGoal[],
  shortTermGoals: ShortTermGoal[],
  hideCompleted: boolean,
): Record<string, GoalDisplayMode> {
  const result: Record<string, GoalDisplayMode> = {};

  if (!hideCompleted) {
    result[longTermGoal.id] = 'full';
    midTermGoals.forEach((mid) => { result[mid.id] = 'full'; });
    shortTermGoals.forEach((short) => { result[short.id] = 'full'; });
    return result;
  }

  const shortsByMid = new Map<string, ShortTermGoal[]>();
  const orphanShorts: ShortTermGoal[] = [];

  shortTermGoals.forEach((short) => {
    if (short.midTermGoalId) {
      const list = shortsByMid.get(short.midTermGoalId) ?? [];
      list.push(short);
      shortsByMid.set(short.midTermGoalId, list);
    } else {
      orphanShorts.push(short);
    }
  });

  const midModes: GoalDisplayMode[] = [];

  midTermGoals.forEach((mid) => {
    const children = shortsByMid.get(mid.id) ?? [];
    const childModes = children.map((short) => {
      const mode = resolveLeafVisibility(isGoalCompleted(short), true);
      result[short.id] = mode;
      return mode;
    });

    if (!isGoalCompleted(mid)) {
      result[mid.id] = 'full';
    } else {
      result[mid.id] = resolveCompletedParentVisibility(childModes);
    }
    midModes.push(result[mid.id]);
  });

  const orphanModes = orphanShorts.map((short) => {
    const mode = resolveLeafVisibility(isGoalCompleted(short), true);
    result[short.id] = mode;
    return mode;
  });

  // アクティブな長期目標はマップの錨のため hidden にしない（従来どおり常に表示）
  if (!isGoalCompleted(longTermGoal)) {
    result[longTermGoal.id] = 'full';
  } else {
    const childModes = [...midModes, ...orphanModes];
    const hasVisibleChild = childModes.some((mode) => mode !== 'hidden');
    result[longTermGoal.id] = hasVisibleChild ? 'ghost' : 'full';
  }

  return result;
}

export function isGoalHiddenOnMap(
  goalId: string,
  displayModes: Record<string, GoalDisplayMode>,
): boolean {
  return displayModes[goalId] === 'hidden';
}
