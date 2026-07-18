/** localStorage keys for goal-map UI preferences (device-local). */

export type ProgressUnitMode = 'task' | 'child';

const PROGRESS_UNIT_KEY = 'goals-progress-unit';
/** @deprecated migrated to PROGRESS_UNIT_KEY */
const LEGACY_PREFER_TASK_KEY = 'goals-prefer-task-progress';
const LT_ORDER_KEY = 'goals-lt-order';

export function readProgressUnitMode(): ProgressUnitMode {
  if (typeof window === 'undefined') return 'child';
  const stored = localStorage.getItem(PROGRESS_UNIT_KEY);
  if (stored === 'task' || stored === 'child') return stored;
  // 旧トグル（自動 vs タスク統一）からの移行
  if (localStorage.getItem(LEGACY_PREFER_TASK_KEY) === 'true') return 'task';
  return 'child';
}

export function writeProgressUnitMode(value: ProgressUnitMode): void {
  localStorage.setItem(PROGRESS_UNIT_KEY, value);
}

export function readLongTermGoalOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LT_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeLongTermGoalOrder(ids: string[]): void {
  localStorage.setItem(LT_ORDER_KEY, JSON.stringify(ids));
}

/** Apply stored id order; unknown ids keep relative API order and append at end. */
export function sortGoalsByStoredOrder<T extends { id: string }>(goals: T[]): T[] {
  if (goals.length <= 1) return goals;
  const order = readLongTermGoalOrder();
  if (order.length === 0) return goals;

  const byId = new Map(goals.map((g) => [g.id, g]));
  const sorted: T[] = [];
  for (const id of order) {
    const g = byId.get(id);
    if (g) {
      sorted.push(g);
      byId.delete(id);
    }
  }
  for (const g of goals) {
    if (byId.has(g.id)) sorted.push(g);
  }
  return sorted;
}
