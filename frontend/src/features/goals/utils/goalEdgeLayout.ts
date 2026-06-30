import {
  GOAL_CARD_MIN_HEIGHT,
  GOAL_CARD_WIDTH,
} from './goalMapLayout';

const DEFAULT_EDGE_INSET = 3;

/** 中心間の直線とカード矩形の交点（境界から inset px 内側） */
export function getCardBoundaryPoint(
  fromCenter: { x: number; y: number },
  toCenter: { x: number; y: number },
  cardWidth = GOAL_CARD_WIDTH,
  cardHeight = GOAL_CARD_MIN_HEIGHT,
  inset = DEFAULT_EDGE_INSET
): { x: number; y: number } {
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (dx === 0 && dy === 0) {
    return { x: fromCenter.x, y: fromCenter.y };
  }

  const hw = cardWidth / 2;
  const hh = cardHeight / 2;
  const scale = Math.min(hw / Math.abs(dx), hh / Math.abs(dy));
  let x = fromCenter.x + dx * scale;
  let y = fromCenter.y + dy * scale;

  const len = Math.hypot(dx, dy);
  if (len > 0 && inset > 0) {
    x -= (dx / len) * inset;
    y -= (dy / len) * inset;
  }

  return { x, y };
}
