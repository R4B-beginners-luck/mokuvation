import type { LongTermGoal, MidTermGoal, NodePosition, ShortTermGoal } from '../../../types';

/** 長期目標は論理座標の原点に固定 */
export const LONG_TERM_FIXED_POSITION: NodePosition = { x: 0, y: 0 };

export function computeInitialPositions(
  lt: LongTermGoal,
  mids: MidTermGoal[],
  shorts: ShortTermGoal[]
): Record<string, NodePosition> {
  const pos: Record<string, NodePosition> = {};

  pos[lt.id] = { ...LONG_TERM_FIXED_POSITION };

  const R1 = 170;
  mids.forEach((m, i) => {
    const angle = mids.length > 0
      ? (i / mids.length) * 2 * Math.PI - Math.PI / 2
      : 0;
    pos[m.id] = { x: R1 * Math.cos(angle), y: R1 * Math.sin(angle) };
  });

  const grouped: Record<string, ShortTermGoal[]> = {};
  shorts.forEach((s) => {
    const pid = s.midTermGoalId ?? lt.id;
    if (!grouped[pid]) grouped[pid] = [];
    grouped[pid].push(s);
  });

  Object.entries(grouped).forEach(([parentId, children]) => {
    const parent = pos[parentId];
    if (!parent) return;

    const R2 = parentId === lt.id ? 280 : 115;
    const baseAngle = parentId === lt.id
      ? 0
      : Math.atan2(parent.y, parent.x);
    const spread = children.length > 1 ? Math.min(Math.PI * 0.55, (children.length - 1) * 0.3) : 0;

    children.forEach((s, i) => {
      const offset = children.length > 1
        ? -spread / 2 + (spread / (children.length - 1)) * i
        : 0;
      const angle = baseAngle + offset;
      pos[s.id] = {
        x: parent.x + R2 * Math.cos(angle),
        y: parent.y + R2 * Math.sin(angle),
      };
    });
  });

  return pos;
}

export function mergeGoalPositions(
  autoPositions: Record<string, NodePosition>,
  savedPositions: Record<string, NodePosition>,
  pendingPositions: Record<string, NodePosition> = {},
  longTermGoalId?: string
): Record<string, NodePosition> {
  const merged: Record<string, NodePosition> = { ...autoPositions };

  Object.entries(savedPositions).forEach(([goalId, position]) => {
    if (merged[goalId]) {
      merged[goalId] = position;
    }
  });

  Object.entries(pendingPositions).forEach(([goalId, position]) => {
    if (merged[goalId]) {
      merged[goalId] = position;
    }
  });

  if (longTermGoalId && merged[longTermGoalId]) {
    merged[longTermGoalId] = { ...LONG_TERM_FIXED_POSITION };
  }

  return merged;
}

export function toLogicalPoint(
  svgPoint: { x: number; y: number },
  viewportCenterX: number,
  viewportCenterY: number
): NodePosition {
  return {
    x: svgPoint.x - viewportCenterX,
    y: svgPoint.y - viewportCenterY,
  };
}
