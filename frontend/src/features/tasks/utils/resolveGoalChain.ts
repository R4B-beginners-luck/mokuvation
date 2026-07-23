import type { LocalGoal } from '../../../services/db';

export type GoalChain = {
  long?: LocalGoal;
  mid?: LocalGoal;
  short?: LocalGoal;
};

/**
 * タスクが直接紐づく goalId から、長期・中期・短期の祖先チェーンを解決する。
 * タイトルは goals 配列のライブ値を使う（タスク側に名前は持たない）。
 */
export function resolveGoalChain(
  goalId: string | null | undefined,
  goals: LocalGoal[],
): GoalChain {
  if (!goalId) return {};
  const byId = new Map(goals.map((g) => [String(g.id), g]));
  const linked = byId.get(String(goalId));
  if (!linked) return {};

  const chain: GoalChain = {};
  if (linked.period_type === 'short') chain.short = linked;
  else if (linked.period_type === 'middle') chain.mid = linked;
  else if (linked.period_type === 'long') chain.long = linked;

  let cur: LocalGoal | undefined = linked;
  while (cur?.parent_goal_id) {
    const parent = byId.get(String(cur.parent_goal_id));
    if (!parent) break;
    if (parent.period_type === 'middle') chain.mid = parent;
    if (parent.period_type === 'long') chain.long = parent;
    cur = parent;
  }

  return chain;
}

export function goalChainHasAny(chain: GoalChain): boolean {
  return Boolean(chain.long || chain.mid || chain.short);
}
