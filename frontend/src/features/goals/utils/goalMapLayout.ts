import type { LongTermGoal, MidTermGoal, NodePosition, ShortTermGoal } from '../../../types';

/** 長期目標は論理座標の原点に固定 */
export const LONG_TERM_FIXED_POSITION: NodePosition = { x: 0, y: 0 };

/** GoalNodeCard のバウンディングボックス（初期レイアウト・エッジ交点で共用） */
export const GOAL_CARD_WIDTH = 230;
export const GOAL_CARD_MIN_HEIGHT = 120;
/** 長期目標カード上部ピンのはみ出し量（foreignObject・ラッパー padding-top と共用） */
export const GOAL_LONG_PIN_OFFSET = 16;

export function computeInitialPositions(
  lt: LongTermGoal,
  mids: MidTermGoal[],
  shorts: ShortTermGoal[]
): Record<string, NodePosition> {
  const pos: Record<string, NodePosition> = {};

  pos[lt.id] = { ...LONG_TERM_FIXED_POSITION };

  const R1 = 300;
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

    const R2 = parentId === lt.id ? 420 : 200;
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

export interface MapViewport {
  panX: number;
  panY: number;
  scale: number;
}

export const MAP_VIEWPORT_SCALE_MIN = 0.4;
export const MAP_VIEWPORT_SCALE_MAX = 2.5;

export const DEFAULT_MAP_VIEWPORT: MapViewport = {
  panX: 0,
  panY: 0,
  scale: 1,
};

export function toLogicalPoint(
  svgPoint: { x: number; y: number },
  centerX: number,
  centerY: number,
  viewport: Pick<MapViewport, 'panX' | 'panY' | 'scale'> = DEFAULT_MAP_VIEWPORT
): NodePosition {
  return {
    x: (svgPoint.x - (centerX + viewport.panX)) / viewport.scale,
    y: (svgPoint.y - (centerY + viewport.panY)) / viewport.scale,
  };
}

export function clampViewportScale(scale: number): number {
  return Math.min(MAP_VIEWPORT_SCALE_MAX, Math.max(MAP_VIEWPORT_SCALE_MIN, scale));
}

/** 画面中央を基準に倍率を設定（スライダー用） */
export function setViewportScaleAtCenter(
  centerX: number,
  centerY: number,
  viewport: MapViewport,
  newScale: number
): MapViewport {
  const clamped = clampViewportScale(newScale);
  if (clamped === viewport.scale) return viewport;

  const logical = toLogicalPoint({ x: centerX, y: centerY }, centerX, centerY, viewport);
  return {
    scale: clamped,
    panX: -logical.x * clamped,
    panY: -logical.y * clamped,
  };
}

/** 指定した SVG 座標を中心にズーム（ホイール用） */
export function zoomViewportAtPoint(
  svgPoint: { x: number; y: number },
  centerX: number,
  centerY: number,
  viewport: MapViewport,
  zoomFactor: number
): MapViewport {
  const newScale = clampViewportScale(viewport.scale * zoomFactor);
  if (newScale === viewport.scale) return viewport;

  const logical = toLogicalPoint(svgPoint, centerX, centerY, viewport);
  return {
    scale: newScale,
    panX: svgPoint.x - centerX - logical.x * newScale,
    panY: svgPoint.y - centerY - logical.y * newScale,
  };
}
