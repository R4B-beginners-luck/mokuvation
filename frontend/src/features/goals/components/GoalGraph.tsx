import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type {  LongTermGoal, MidTermGoal, ShortTermGoal, Goal, NodePosition  } from '../../../types';
import { DEFAULT_GOAL_COLOR } from '../../../const/colors';
import { computeInitialPositions, mergeGoalPositions, toLogicalPoint } from '../utils/goalMapLayout';

interface GoalGraphProps {
  longTermGoal: LongTermGoal;
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  selectedId: string | null;
  savedPositions: Record<string, NodePosition>;
  pendingPositions: Record<string, NodePosition>;
  placementMode?: {
    type: 'add' | 'edit';
    movableGoalIds: string[];
    focusGoalId?: string;
  } | null;
  onSelectNode: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: (goal: Goal, presetGoalType?: 'mid' | 'short') => void;
  onToggleCompleted: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
  onPositionCommit: (goalId: string, position: NodePosition) => void;
}

interface ContextMenuState {
  goal: Goal;
  x: number;
  y: number;
}

// ノードの形状と大きさを定義（ノード色は goal.color_code を使用）
const NODE_CONFIG = {
  long:  { r: 36, fontSize: 13, fontWeight: '700' },
  mid:   { r: 26, fontSize: 12, fontWeight: '600' },
  short: { r: 18, fontSize: 11, fontWeight: '500' },
};

function getNodeColor(goal: Goal): string {
  return goal.color_code ?? DEFAULT_GOAL_COLOR;
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function getPolygonPoints(type: string, radius: number): string {
  if (type === 'long') {
    // Hexagon
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${radius * Math.cos(angle_rad)},${radius * Math.sin(angle_rad)}`);
    }
    return points.join(' ');
  }
  if (type === 'mid') {
    // Square
    const size = radius;
    return `-${size},-${size} ${size},-${size} ${size},${size} -${size},${size}`;
  }
  return '';
}

export function GoalGraph({
  longTermGoal,
  midTermGoals,
  shortTermGoals,
  selectedId,
  savedPositions,
  pendingPositions,
  placementMode = null,
  onSelectNode,
  onEditGoal,
  onAddGoal,
  onToggleCompleted,
  onDeleteGoal,
  onPositionCommit,
}: GoalGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = size.w / 2;
  const cy = size.h / 2;
  const viewportRef = useRef({ cx, cy });
  useEffect(() => {
    viewportRef.current = { cx, cy };
  }, [cx, cy]);

  const mergedPositions = useMemo(
    () => mergeGoalPositions(
      computeInitialPositions(longTermGoal, midTermGoals, shortTermGoals),
      savedPositions,
      pendingPositions,
      longTermGoal.id
    ),
    [longTermGoal, midTermGoals, shortTermGoals, savedPositions, pendingPositions]
  );

  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const dragListenersRef = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null);
  const skipClickRef = useRef(false);
  const dragOverlayRef = useRef<Record<string, NodePosition>>({});
  const [dragOverlay, setDragOverlay] = useState<Record<string, NodePosition> | null>(null);

  const movableGoalIdSet = useMemo(
    () => new Set(placementMode?.movableGoalIds ?? []),
    [placementMode]
  );

  const canDragGoal = useCallback((goalId: string, isLongTerm: boolean) => {
    if (isLongTerm) return false;
    if (placementMode) return movableGoalIdSet.has(goalId);
    return true;
  }, [placementMode, movableGoalIdSet]);

  const displayPositions = useMemo(() => {
    if (!dragOverlay) return mergedPositions;
    return { ...mergedPositions, ...dragOverlay };
  }, [mergedPositions, dragOverlay]);

  const displayPositionsRef = useRef(displayPositions);
  displayPositionsRef.current = displayPositions;

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const clearDragListeners = useCallback(() => {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    dragListenersRef.current = null;
  }, []);

  useEffect(() => () => clearDragListeners(), [clearDragListeners]);

  useEffect(() => {
    if (!contextMenu) return undefined;

    const handlePointerDown = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [contextMenu, closeContextMenu]);

  const commitDraggedPosition = useCallback(() => {
    if (!dragRef.current) return;

    const draggedId = dragRef.current.id;
    const start = dragStartRef.current;
    const current = dragOverlayRef.current[draggedId] ?? mergedPositions[draggedId];

    if (current && start && (current.x !== start.x || current.y !== start.y)) {
      skipClickRef.current = true;
      onPositionCommit(draggedId, current);
    }

    dragOverlayRef.current = {};
    setDragOverlay(null);
    dragRef.current = null;
    dragStartRef.current = null;
  }, [mergedPositions, onPositionCommit]);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    if (!canDragGoal(id, id === longTermGoal.id)) return;
    e.stopPropagation();
    clearDragListeners();
    dragOverlayRef.current = {};
    setDragOverlay(null);

    const svg = svgRef.current!;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const { cx: vcx, cy: vcy } = viewportRef.current;
    const logical = toLogicalPoint(svgP, vcx, vcy);
    const current = displayPositionsRef.current[id];
    dragStartRef.current = current
      ? { id, x: current.x, y: current.y }
      : { id, x: logical.x, y: logical.y };
    dragRef.current = {
      id,
      ox: logical.x - (current?.x ?? 0),
      oy: logical.y - (current?.y ?? 0),
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current || !svgRef.current) return;
      const movePt = svgRef.current.createSVGPoint();
      movePt.x = ev.clientX;
      movePt.y = ev.clientY;
      const moveSvgP = movePt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
      const { cx: mcx, cy: mcy } = viewportRef.current;
      const moveLogical = toLogicalPoint(moveSvgP, mcx, mcy);
      const { id: dragId, ox, oy } = dragRef.current;
      const next = { x: moveLogical.x - ox, y: moveLogical.y - oy };
      dragOverlayRef.current = { ...dragOverlayRef.current, [dragId]: next };
      setDragOverlay({ ...dragOverlayRef.current });
    };

    const handlePointerUp = () => {
      clearDragListeners();
      commitDraggedPosition();
    };

    dragListenersRef.current = { move: handlePointerMove, up: handlePointerUp };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [longTermGoal.id, clearDragListeners, commitDraggedPosition, canDragGoal]);

  const onNodeContextMenu = useCallback((e: React.MouseEvent, goal: Goal) => {
    e.preventDefault();
    e.stopPropagation();
    clearDragListeners();
    dragOverlayRef.current = {};
    setDragOverlay(null);
    dragRef.current = null;
    dragStartRef.current = null;
    onSelectNode(goal);

    const menuWidth = 210;
    const menuHeight = goal.type === 'short' ? 132 : goal.type === 'mid' ? 172 : 212;
    const x = Math.min(Math.max(8, e.clientX), window.innerWidth - menuWidth - 8);
    const y = Math.min(Math.max(8, e.clientY), window.innerHeight - menuHeight - 8);

    setContextMenu({ goal, x, y });
  }, [onSelectNode, clearDragListeners]);

  const edges: {
    x1: number; y1: number; x2: number; y2: number;
    dashed: boolean; color: string; opacity: number;
  }[] = [];

  const addEdge = (
    fromId: string, toId: string,
    dashed: boolean, color: string, opacity: number
  ) => {
    const a = displayPositions[fromId];
    const b = displayPositions[toId];
    if (!a || !b) return;
    edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, dashed, color, opacity });
  };

  // 親ノードの色でエッジを描画
  const ltColor = getNodeColor(longTermGoal);
  
  midTermGoals.forEach((m) => {
    addEdge(longTermGoal.id, m.id, false, ltColor, 0.5);
  });

  shortTermGoals
    .filter((s) => !s.midTermGoalId)
    .forEach((s) => addEdge(longTermGoal.id, s.id, false, ltColor, 0.4));

  shortTermGoals
    .filter((s) => s.midTermGoalId)
    .forEach((s) => {
      const midGoal = midTermGoals.find(m => m.id === s.midTermGoalId);
      const parentColor = midGoal ? getNodeColor(midGoal) : ltColor;
      addEdge(s.midTermGoalId!, s.id, false, parentColor, 0.45);
    });

  // NOTE: same-level relationships are intentionally not drawn to keep the map readable.

  const allGoals: Goal[] = [
    longTermGoal,
    ...midTermGoals,
    ...shortTermGoals,
  ];

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.w} ${size.h}`}
        style={{ display: 'block', userSelect: 'none', touchAction: 'none' }}
      >
        <defs>
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${cx}, ${cy})`}>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={e.color}
              strokeWidth={1.5}
              strokeOpacity={e.opacity}
            />
          ))}
        </g>

        <g transform={`translate(${cx}, ${cy})`}>
          {allGoals.map((goal) => {
            const p = displayPositions[goal.id];
            if (!p) return null;

            const cfg        = NODE_CONFIG[goal.type];
            const nodeColor  = getNodeColor(goal);
            const isSelected = goal.id === selectedId;
            const isDone     = goal.completed;
            const isLongTerm = goal.type === 'long';

            const isPlacementTarget = placementMode
              ? movableGoalIdSet.has(goal.id)
              : false;
            const isPlacementFocus = placementMode?.focusGoalId === goal.id;
            const isDraggable = canDragGoal(goal.id, isLongTerm);

            const maxLen = goal.type === 'long' ? 14 : goal.type === 'mid' ? 12 : 10;
            const displayTitle = truncateText(goal.title, maxLen);
            const iconYOffset = cfg.r * 1.5;

            return (
              <g
                key={goal.id}
                transform={`translate(${p.x},${p.y})`}
                className={[
                  isPlacementFocus ? 'goal-node--placement-focus' : '',
                  isPlacementTarget ? 'goal-node--placement-target' : '',
                  placementMode && !isPlacementTarget ? 'goal-node--placement-locked' : '',
                ].filter(Boolean).join(' ')}
                style={{ cursor: isDraggable ? 'grab' : 'default' }}
                onMouseDown={(e) => onNodeMouseDown(e, goal.id)}
                onContextMenu={(e) => onNodeContextMenu(e, goal)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (skipClickRef.current) {
                    skipClickRef.current = false;
                    return;
                  }
                  onSelectNode(goal);
                }}
              >
                {isSelected && goal.type !== 'short' && (
                  <>
                    <polygon
                      points={getPolygonPoints(goal.type, cfg.r + 10)}
                      fill={nodeColor}
                      opacity={0.15}
                    />
                    <polygon
                      points={getPolygonPoints(goal.type, cfg.r + 6)}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth={3}
                      strokeOpacity={0.8}
                    />
                  </>
                )}
                {isSelected && goal.type === 'short' && (
                  <>
                    <circle
                      r={cfg.r + 10}
                      fill={nodeColor}
                      opacity={0.15}
                    />
                    <circle
                      r={cfg.r + 6}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth={3}
                      strokeOpacity={0.8}
                    />
                  </>
                )}

                {goal.type !== 'short' ? (
                  <polygon
                    points={getPolygonPoints(goal.type, cfg.r)}
                    fill={isDone ? '#3a3840' : nodeColor}
                    stroke={isSelected ? nodeColor : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isDone ? 0.6 : 1}
                  />
                ) : (
                  <circle
                    r={cfg.r}
                    fill={isDone ? '#3a3840' : nodeColor}
                    stroke={isSelected ? nodeColor : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isDone ? 0.6 : 1}
                  />
                )}

                {isDone && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={cfg.r * 0.7}
                    fill={nodeColor}
                    opacity={0.9}
                    style={{ pointerEvents: 'none' }}
                  >
                    ✓
                  </text>
                )}

                {/* Title outside the shape */}
                <text
                  textAnchor="middle"
                  fontSize={cfg.fontSize}
                  fontWeight={cfg.fontWeight}
                  fontFamily="'DM Sans', sans-serif"
                  fill={isSelected ? '#ffffff' : nodeColor}
                  y={iconYOffset}
                  style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {displayTitle}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="goal-graph-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="goal-graph-context-menu__header">
            <span
              className="goal-graph-context-menu__dot"
              style={{ background: getNodeColor(contextMenu.goal) }}
            />
            <span className="goal-graph-context-menu__title">
              {truncateText(contextMenu.goal.title, 20)}
            </span>
          </div>

          
          
          <button
            type="button"
            className="goal-graph-context-menu__item goal-graph-context-menu__item--danger"
            onClick={() => {
              onToggleCompleted(contextMenu.goal);
              closeContextMenu();
            }}
          >
            {contextMenu.goal.completed ? '↩️ 未達成に戻す' : '✅ 達成にする'}
          </button>

          <button
            type="button"
            className="goal-graph-context-menu__item"
            onClick={() => {
              onEditGoal(contextMenu.goal);
              closeContextMenu();
            }}
          >
            ✏️ 編集する
          </button>

          {contextMenu.goal.type === 'long' && (
            <>
              <button
                type="button"
                className="goal-graph-context-menu__item"
                onClick={() => {
                  onAddGoal(contextMenu.goal, 'mid');
                  closeContextMenu();
                }}
              >
                ＋ 中期目標を追加
              </button>
              <button
                type="button"
                className="goal-graph-context-menu__item"
                onClick={() => {
                  onAddGoal(contextMenu.goal, 'short');
                  closeContextMenu();
                }}
              >
                ＋ 短期目標を追加
              </button>
            </>
          )}

          {contextMenu.goal.type === 'mid' && (
            <button
              type="button"
              className="goal-graph-context-menu__item"
              onClick={() => {
                onAddGoal(contextMenu.goal, 'short');
                closeContextMenu();
              }}
            >
              ＋ 短期目標を追加
            </button>
          )}

          <div className="goal-graph-context-menu__divider" />

          <button
            type="button"
            className="goal-graph-context-menu__item goal-graph-context-menu__item--danger"
            onClick={() => {
              onDeleteGoal(contextMenu.goal);
              closeContextMenu();
            }}
          >
            🗑️ 削除する
          </button>
        </div>
      )}
    </>
  );
}
