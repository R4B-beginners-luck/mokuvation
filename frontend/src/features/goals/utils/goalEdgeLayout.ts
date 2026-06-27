import {
  GOAL_CARD_MIN_HEIGHT,
  GOAL_CARD_WIDTH,
  GOAL_LONG_PIN_OFFSET,
} from './goalMapLayout';

export const DEFAULT_EDGE_INSET = 4;

export type GoalCardBounds = {
  width: number;
  halfWidth: number;
  /** 中心より上方向の半分（長期はピン分を含む） */
  halfHeightTop: number;
  /** 中心より下方向の半分 */
  halfHeightBottom: number;
};

/** エッジ交点計算用のカード矩形（goalMapLayout / goal-node.css と同期） */
export function getGoalCardBounds(goalType: string): GoalCardBounds {
  const halfWidth = GOAL_CARD_WIDTH / 2;
  const halfHeight = GOAL_CARD_MIN_HEIGHT / 2;

  if (goalType === 'long') {
    return {
      width: GOAL_CARD_WIDTH,
      halfWidth,
      halfHeightTop: halfHeight + GOAL_LONG_PIN_OFFSET,
      halfHeightBottom: halfHeight,
    };
  }

  return {
    width: GOAL_CARD_WIDTH,
    halfWidth,
    halfHeightTop: halfHeight,
    halfHeightBottom: halfHeight,
  };
}

/**
 * 中心間の直線とカード矩形の交点（境界から inset px 内側）。
 * 長期目標は上部ピン分だけ非対称矩形（上: 60+16px / 下: 60px）。
 */
export function getCardBoundaryPoint(
  fromCenter: { x: number; y: number },
  toCenter: { x: number; y: number },
  bounds: GoalCardBounds = getGoalCardBounds('mid'),
  inset = DEFAULT_EDGE_INSET
): { x: number; y: number } {
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (dx === 0 && dy === 0) {
    return { x: fromCenter.x, y: fromCenter.y };
  }

  const scaleX = dx !== 0 ? bounds.halfWidth / Math.abs(dx) : Infinity;
  const scaleY =
    dy !== 0
      ? (dy > 0 ? bounds.halfHeightBottom : bounds.halfHeightTop) / Math.abs(dy)
      : Infinity;
  const scale = Math.min(scaleX, scaleY);

  let x = fromCenter.x + dx * scale;
  let y = fromCenter.y + dy * scale;

  const len = Math.hypot(dx, dy);
  if (len > 0 && inset > 0) {
    x -= (dx / len) * inset;
    y -= (dy / len) * inset;
  }

  return { x, y };
}
