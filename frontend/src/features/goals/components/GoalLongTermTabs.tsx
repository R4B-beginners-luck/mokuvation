import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import type { LongTermGoal } from '../../../types';

interface GoalLongTermTabsProps {
  longTermGoals: LongTermGoal[];
  activeLtId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onReorder?: (orderedIds: string[]) => void;
}

const LONG_PRESS_MS = 280;
const MOVE_CANCEL_PX = 10;

function computeInsertBefore(
  clientX: number,
  fromIndex: number,
  tabEls: Array<HTMLElement | null>,
): number {
  const centers = tabEls
    .map((el, i) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { i, mid: rect.left + rect.width / 2 };
    })
    .filter((v): v is { i: number; mid: number } => v !== null);

  let insertBefore = centers.length;
  for (const { i, mid } of centers) {
    if (clientX < mid) {
      insertBefore = i;
      break;
    }
  }

  if (insertBefore === fromIndex || insertBefore === fromIndex + 1) {
    return fromIndex;
  }
  return insertBefore;
}

function applyReorder(ids: string[], from: number, insertBefore: number): string[] | null {
  if (from < 0 || from >= ids.length) return null;
  if (insertBefore === from || insertBefore === from + 1) return null;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  const adjusted = insertBefore > from ? insertBefore - 1 : insertBefore;
  next.splice(adjusted, 0, moved);
  return next;
}

interface GhostState {
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
  active: boolean;
}

export function GoalLongTermTabs({
  longTermGoals,
  activeLtId,
  disabled = false,
  onSelect,
  onAdd,
  onReorder,
}: GoalLongTermTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [armingIndex, setArmingIndex] = useState<number | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);
  const [insertBefore, setInsertBefore] = useState<number | null>(null);
  const [ghost, setGhost] = useState<GhostState | null>(null);

  const dragFromRef = useRef<number | null>(null);
  const insertBeforeRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const resetDragState = useCallback(() => {
    clearLongPress();
    dragFromRef.current = null;
    insertBeforeRef.current = null;
    pointerIdRef.current = null;
    startPosRef.current = null;
    setArmingIndex(null);
    setDraggingFrom(null);
    setInsertBefore(null);
    setGhost(null);
  }, [clearLongPress]);

  const endDrag = useCallback(() => {
    const from = dragFromRef.current;
    const before = insertBeforeRef.current;
    const shouldCommit = from !== null && before !== null && !!onReorder;
    const ids = longTermGoals.map((g) => g.id);
    resetDragState();

    if (!shouldCommit || from === null || before === null || !onReorder) return;
    const next = applyReorder(ids, from, before);
    if (next) onReorder(next);
  }, [longTermGoals, onReorder, resetDragState]);

  const startDrag = useCallback((index: number, el: HTMLButtonElement, clientX: number, clientY: number) => {
    didDragRef.current = true;
    const rect = el.getBoundingClientRect();
    grabOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    dragFromRef.current = index;
    insertBeforeRef.current = index;
    setArmingIndex(null);
    setDraggingFrom(index);
    setInsertBefore(index);
    setGhost({
      title: longTermGoals[index]?.title ?? '',
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
      active: longTermGoals[index]?.id === activeLtId,
    });

    try {
      navigator.vibrate?.(12);
    } catch {
      /* ignore */
    }
  }, [activeLtId, longTermGoals]);

  const updateDragPosition = useCallback((clientX: number, clientY: number) => {
    const from = dragFromRef.current;
    if (from === null) return;

    const grab = grabOffsetRef.current;
    setGhost((prev) =>
      prev
        ? {
            ...prev,
            x: clientX - grab.x,
            y: clientY - grab.y,
          }
        : prev,
    );

    const before = computeInsertBefore(
      clientX,
      from,
      tabRefs.current.slice(0, longTermGoals.length),
    );
    insertBeforeRef.current = before;
    setInsertBefore(before);
  }, [longTermGoals.length]);

  useEffect(() => {
    if (draggingFrom === null) return undefined;

    const onMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      updateDragPosition(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      endDrag();
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [draggingFrom, endDrag, updateDragPosition]);

  const onPointerDownTab = (
    e: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (disabled || !onReorder || e.button !== 0) return;

    didDragRef.current = false;
    pointerIdRef.current = e.pointerId;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setArmingIndex(index);
    clearLongPress();

    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      if (pointerIdRef.current !== pointerId) return;
      const el = tabRefs.current[index];
      if (!el) return;
      startDrag(index, el, startX, startY);
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }, LONG_PRESS_MS);
  };

  const onPointerMoveTab = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    if (dragFromRef.current !== null) return;

    const start = startPosRef.current;
    if (
      start
      && (Math.abs(e.clientX - start.x) > MOVE_CANCEL_PX
        || Math.abs(e.clientY - start.y) > MOVE_CANCEL_PX)
    ) {
      clearLongPress();
      setArmingIndex(null);
    }
  };

  const onPointerUpTab = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== null && pointerIdRef.current !== e.pointerId) return;
    if (dragFromRef.current !== null) return;
    clearLongPress();
    pointerIdRef.current = null;
    startPosRef.current = null;
    setArmingIndex(null);
  };

  const onClickTab = (goalId: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onSelect(goalId);
  };

  const canReorder = !disabled && !!onReorder;
  const isDragging = draggingFrom !== null;
  const showIndicatorAt =
    draggingFrom !== null
    && insertBefore !== null
    && insertBefore !== draggingFrom
    && insertBefore !== draggingFrom + 1
      ? insertBefore
      : null;

  return (
    <div className="goal-lt-tabs" role="tablist" aria-label="長期目標">
      <div
        className={[
          'goal-lt-tabs__scroll',
          isDragging ? 'goal-lt-tabs__scroll--dragging' : '',
        ].filter(Boolean).join(' ')}
      >
        {longTermGoals.map((goal, index) => {
          const isActive = goal.id === activeLtId;
          const isSource = draggingFrom === index;
          const isArming = armingIndex === index;
          return (
            <div key={goal.id} className="goal-lt-tabs__slot">
              {showIndicatorAt === index && (
                <span className="goal-lt-tabs__drop-indicator" aria-hidden />
              )}
              <button
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'goal-lt-tabs__tab',
                  isActive ? 'goal-lt-tabs__tab--active' : '',
                  isArming ? 'goal-lt-tabs__tab--arming' : '',
                  isSource ? 'goal-lt-tabs__tab--dragging' : '',
                ].filter(Boolean).join(' ')}
                disabled={disabled}
                onPointerDown={(e) => onPointerDownTab(e, index)}
                onPointerMove={onPointerMoveTab}
                onPointerUp={onPointerUpTab}
                onPointerCancel={onPointerUpTab}
                onContextMenu={(e) => {
                  if (canReorder) e.preventDefault();
                }}
                onClick={() => onClickTab(goal.id)}
                title={canReorder ? `${goal.title}（長押しで並び替え）` : goal.title}
              >
                <span className="goal-lt-tabs__tab-label">{goal.title}</span>
              </button>
            </div>
          );
        })}
        {showIndicatorAt === longTermGoals.length && (
          <span className="goal-lt-tabs__drop-indicator" aria-hidden />
        )}
        <button
          type="button"
          className="goal-lt-tabs__tab goal-lt-tabs__tab--add"
          aria-label="長期目標を追加"
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {ghost
        && createPortal(
          <div
            className={`goal-lt-tabs__ghost${ghost.active ? ' goal-lt-tabs__ghost--active' : ''}`}
            style={{
              width: ghost.width,
              height: ghost.height,
              left: ghost.x,
              top: ghost.y,
            }}
            aria-hidden
          >
            <span className="goal-lt-tabs__tab-label">{ghost.title}</span>
          </div>,
          document.body,
        )}
    </div>
  );
}
