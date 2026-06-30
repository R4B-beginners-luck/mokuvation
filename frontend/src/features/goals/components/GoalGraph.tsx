import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Check, Pencil, Plus, Trash2, Undo2 } from 'lucide-react';
import type {  LongTermGoal, MidTermGoal, ShortTermGoal, Goal, NodePosition, Task  } from '../../../types';
import { DEFAULT_GOAL_COLOR } from '../../../const/colors';
import {
  computeInitialPositions,
  DEFAULT_MAP_VIEWPORT,
  GOAL_CARD_MIN_HEIGHT,
  GOAL_CARD_WIDTH,
  GOAL_LONG_PIN_OFFSET,
  MAP_VIEWPORT_SCALE_MAX,
  MAP_VIEWPORT_SCALE_MIN,
  mergeGoalPositions,
  setViewportScaleAtCenter,
  toLogicalPoint,
  zoomViewportAtPoint,
  type MapViewport,
} from '../utils/goalMapLayout';
import { getCardBoundaryPoint, getGoalCardBounds } from '../utils/goalEdgeLayout';
import { createGoalNodeAdapter } from '../utils/goalNodeAdapter';
import GoalNodeCard from './goalNodeCard/GoalNodeCard';

const WHEEL_ZOOM_FACTOR = 1.1;

interface GoalGraphProps {
  longTermGoal: LongTermGoal;
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
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

// ノード色は goal.color_code を使用（エッジ描画）
function getNodeColor(goal: Goal): string {
  return goal.color_code ?? DEFAULT_GOAL_COLOR;
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function GoalGraph({
  longTermGoal,
  midTermGoals,
  shortTermGoals,
  tasks,
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

  const [mapViewport, setMapViewport] = useState<MapViewport>(DEFAULT_MAP_VIEWPORT);
  const mapViewportRef = useRef(mapViewport);
  mapViewportRef.current = mapViewport;

  const viewportRef = useRef({ cx, cy, viewport: mapViewport });
  useEffect(() => {
    viewportRef.current = { cx, cy, viewport: mapViewport };
  }, [cx, cy, mapViewport]);

  useEffect(() => {
    setMapViewport(DEFAULT_MAP_VIEWPORT);
  }, [longTermGoal.id]);

  const panListenersRef = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null);

  const clearPanListeners = useCallback(() => {
    const listeners = panListenersRef.current;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    panListenersRef.current = null;
  }, []);

  useEffect(() => () => clearPanListeners(), [clearPanListeners]);

  const mergedPositions = useMemo(
    () => mergeGoalPositions(
      computeInitialPositions(longTermGoal, midTermGoals, shortTermGoals),
      savedPositions,
      pendingPositions,
      longTermGoal.id
    ),
    [longTermGoal, midTermGoals, shortTermGoals, savedPositions, pendingPositions]
  );

  const goalNodeAdapter = useMemo(
    () => createGoalNodeAdapter({
      longTermGoal,
      midTermGoals,
      shortTermGoals,
      tasks,
    }),
    [longTermGoal, midTermGoals, shortTermGoals, tasks]
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

  const clientToSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }, []);

  const beginPan = useCallback((clientX: number, clientY: number) => {
    clearPanListeners();
    clearDragListeners();
    const startPan = { ...mapViewportRef.current };
    const startPointer = { x: clientX, y: clientY };

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startPointer.x;
      const dy = ev.clientY - startPointer.y;
      setMapViewport({
        ...startPan,
        panX: startPan.panX + dx,
        panY: startPan.panY + dy,
      });
    };

    const handlePointerUp = () => {
      clearPanListeners();
    };

    panListenersRef.current = { move: handlePointerMove, up: handlePointerUp };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [clearPanListeners, clearDragListeners]);

  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginPan(e.clientX, e.clientY);
  }, [beginPan]);

  const onSvgPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    beginPan(e.clientX, e.clientY);
  }, [beginPan]);

  const onSvgWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const svgPoint = clientToSvgPoint(e.clientX, e.clientY);
    if (!svgPoint) return;

    const zoomFactor = e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
    const { cx: vcx, cy: vcy } = viewportRef.current;
    setMapViewport((prev) => zoomViewportAtPoint(svgPoint, vcx, vcy, prev, zoomFactor));
  }, [clientToSvgPoint]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    svg.addEventListener('wheel', onSvgWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onSvgWheel);
  }, [onSvgWheel]);

  const onZoomSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(e.target.value) / 100;
    const { cx: vcx, cy: vcy } = viewportRef.current;
    setMapViewport((prev) => setViewportScaleAtCenter(vcx, vcy, prev, newScale));
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
    clearPanListeners();
    clearDragListeners();
    dragOverlayRef.current = {};
    setDragOverlay(null);

    const svgP = clientToSvgPoint(e.clientX, e.clientY);
    if (!svgP) return;
    const { cx: vcx, cy: vcy, viewport } = viewportRef.current;
    const logical = toLogicalPoint(svgP, vcx, vcy, viewport);
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
      const moveSvgP = clientToSvgPoint(ev.clientX, ev.clientY);
      if (!moveSvgP) return;
      const { cx: mcx, cy: mcy, viewport: moveViewport } = viewportRef.current;
      const moveLogical = toLogicalPoint(moveSvgP, mcx, mcy, moveViewport);
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
  }, [longTermGoal.id, clearDragListeners, clearPanListeners, commitDraggedPosition, canDragGoal, clientToSvgPoint]);

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

  const goalById = useMemo(() => {
    const map = new Map<string, Goal>();
    map.set(longTermGoal.id, longTermGoal);
    midTermGoals.forEach((m) => map.set(m.id, m));
    shortTermGoals.forEach((s) => map.set(s.id, s));
    return map;
  }, [longTermGoal, midTermGoals, shortTermGoals]);

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

    const fromGoal = goalById.get(fromId);
    const toGoal = goalById.get(toId);
    const fromBounds = getGoalCardBounds(fromGoal?.type ?? 'mid');
    const toBounds = getGoalCardBounds(toGoal?.type ?? 'mid');

    const fromPoint = getCardBoundaryPoint(a, b, fromBounds);
    const toPoint = getCardBoundaryPoint(b, a, toBounds);
    edges.push({
      x1: fromPoint.x,
      y1: fromPoint.y,
      x2: toPoint.x,
      y2: toPoint.y,
      dashed,
      color,
      opacity,
    });
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

  const worldTransform = `translate(${cx + mapViewport.panX}, ${cy + mapViewport.panY}) scale(${mapViewport.scale})`;
  const zoomPercent = Math.round(mapViewport.scale * 100);
  const zoomPercentLabel = `${zoomPercent}%`;
  const zoomSliderMin = Math.round(MAP_VIEWPORT_SCALE_MIN * 100);
  const zoomSliderMax = Math.round(MAP_VIEWPORT_SCALE_MAX * 100);

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="goal-graph__canvas"
        style={{ display: 'block', userSelect: 'none', touchAction: 'none' }}
        onPointerDown={onSvgPointerDown}
      >
        <defs>
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect
          x={0}
          y={0}
          width={size.w}
          height={size.h}
          fill="transparent"
          className="goal-graph__background"
          onPointerDown={onCanvasPointerDown}
        />

        <g transform={worldTransform}>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={e.color}
              strokeWidth={1.5}
              strokeOpacity={e.opacity}
            />
          ))}

          {allGoals.map((goal) => {
            const p = displayPositions[goal.id];
            if (!p) return null;

            const isLongTerm = goal.type === 'long';
            const isPlacementTarget = placementMode
              ? movableGoalIdSet.has(goal.id)
              : false;
            const isPlacementFocus = placementMode?.focusGoalId === goal.id;
            const isDraggable = canDragGoal(goal.id, isLongTerm);
            const progress = goalNodeAdapter.toProgress(goal.id);

            const pinOffset = isLongTerm ? GOAL_LONG_PIN_OFFSET : 0;

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
              >
                <foreignObject
                  x={-GOAL_CARD_WIDTH / 2}
                  y={-GOAL_CARD_MIN_HEIGHT / 2 - pinOffset}
                  width={GOAL_CARD_WIDTH}
                  height={GOAL_CARD_MIN_HEIGHT + pinOffset}
                  style={{ overflow: 'visible' }}
                >
                  <div style={{ width: GOAL_CARD_WIDTH, minHeight: GOAL_CARD_MIN_HEIGHT }}>
                    <GoalNodeCard
                      goalType={goal.type}
                      status={goalNodeAdapter.toGoalStatus(goal)}
                      title={goal.title}
                      progress={progress}
                      categoryColor={goalNodeAdapter.toCategoryColor(goal)}
                      selected={goal.id === selectedId}
                      density="full"
                      onClick={() => {
                        if (skipClickRef.current) {
                          skipClickRef.current = false;
                          return;
                        }
                        onSelectNode(goal);
                      }}
                      onContextMenu={(e) => onNodeContextMenu(e, goal)}
                    />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      <div
        className="goal-graph__zoom-control"
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <span
          className="goal-graph__zoom-label"
          aria-live="polite"
        >
          {zoomPercentLabel}
        </span>
        <input
          type="range"
          className="goal-graph__zoom-slider"
          min={zoomSliderMin}
          max={zoomSliderMax}
          step={1}
          value={zoomPercent}
          onChange={onZoomSliderChange}
          aria-label="表示倍率"
          aria-valuemin={zoomSliderMin}
          aria-valuemax={zoomSliderMax}
          aria-valuenow={zoomPercent}
          aria-valuetext={zoomPercentLabel}
        />
      </div>

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
            {contextMenu.goal.completed ? (
              <>
                <Undo2 size={15} strokeWidth={1.75} aria-hidden />
                未達成に戻す
              </>
            ) : (
              <>
                <Check size={15} strokeWidth={1.75} aria-hidden />
                達成にする
              </>
            )}
          </button>

          <button
            type="button"
            className="goal-graph-context-menu__item"
            onClick={() => {
              onEditGoal(contextMenu.goal);
              closeContextMenu();
            }}
          >
            <Pencil size={15} strokeWidth={1.75} aria-hidden />
            編集する
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
                <Plus size={15} strokeWidth={1.75} aria-hidden />
                中期目標を追加
              </button>
              <button
                type="button"
                className="goal-graph-context-menu__item"
                onClick={() => {
                  onAddGoal(contextMenu.goal, 'short');
                  closeContextMenu();
                }}
              >
                <Plus size={15} strokeWidth={1.75} aria-hidden />
                短期目標を追加
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
              <Plus size={15} strokeWidth={1.75} aria-hidden />
              短期目標を追加
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
            <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            削除する
          </button>
        </div>
      )}
    </>
  );
}
