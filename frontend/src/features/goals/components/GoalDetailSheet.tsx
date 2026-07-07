import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type GoalDetailSheetLevel = 'peek' | 'half' | 'full';

const SHEET_VH: Record<GoalDetailSheetLevel, number> = {
  peek: 20,
  half: 50,
  full: 90,
};

const CLOSE_THRESHOLD_VH = 12;
const ENTER_ANIMATION_MS = 280;

interface GoalDetailSheetProps {
  goalId: string;
  isClosing?: boolean;
  onClose: () => void;
  onSheetHeightChange?: (heightPx: number) => void;
  children: (sheetLevel: GoalDetailSheetLevel) => ReactNode;
}

function vhToPx(vh: number): number {
  return (window.innerHeight * vh) / 100;
}

function heightToSnap(heightPx: number): GoalDetailSheetLevel | 'close' {
  const vh = (heightPx / window.innerHeight) * 100;
  if (vh < CLOSE_THRESHOLD_VH) {
    return 'close';
  }
  if (vh < 35) {
    return 'peek';
  }
  if (vh < 70) {
    return 'half';
  }
  return 'full';
}

export function GoalDetailSheet({
  goalId,
  isClosing = false,
  onClose,
  onSheetHeightChange,
  children,
}: GoalDetailSheetProps) {
  const [snap, setSnap] = useState<GoalDetailSheetLevel>('peek');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const dragRef = useRef<{ startY: number; startSnap: GoalDetailSheetLevel } | null>(null);

  useEffect(() => {
    setSnap('peek');
    setDragOffset(0);
    setIsDragging(false);
    dragRef.current = null;
    setIsEntering(true);
    const timer = window.setTimeout(() => setIsEntering(false), ENTER_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [goalId]);

  const baseHeightPx = vhToPx(SHEET_VH[snap]);
  const sheetHeightPx = Math.max(0, baseHeightPx - dragOffset);

  useEffect(() => {
    onSheetHeightChange?.(sheetHeightPx);
  }, [onSheetHeightChange, sheetHeightPx]);

  useEffect(() => {
    return () => onSheetHeightChange?.(0);
  }, [goalId, onSheetHeightChange]);

  const clearDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const onDragPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isClosing) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startSnap: snap };
    setIsDragging(true);
    setDragOffset(0);
  }, [isClosing, snap]);

  const onDragPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.clientY - dragRef.current.startY;
    setDragOffset(delta);
  }, []);

  const onDragPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);

    const startHeight = vhToPx(SHEET_VH[dragRef.current.startSnap]);
    const finalHeight = startHeight - dragOffset;
    const next = heightToSnap(finalHeight);

    if (next === 'close') {
      onClose();
    } else {
      setSnap(next);
    }

    setDragOffset(0);
    clearDrag();
  }, [clearDrag, dragOffset, onClose]);

  const onDragPointerCancel = useCallback(() => {
    setDragOffset(0);
    clearDrag();
  }, [clearDrag]);

  const handleCloseClick = useCallback(() => {
    if (isClosing) return;
    if (snap === 'full') {
      setSnap('half');
      return;
    }
    onClose();
  }, [isClosing, onClose, snap]);

  const handleExpandFull = useCallback(() => {
    if (isClosing) return;
    setSnap('full');
  }, [isClosing]);

  useEffect(() => {
    if (!isDragging) return undefined;
    document.body.classList.add('goal-sheet-dragging');
    return () => {
      document.body.classList.remove('goal-sheet-dragging');
    };
  }, [isDragging]);

  const stopSheetPointerBubble = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="goal-detail-sheet-root goal-detail-sheet--open">
      <div
        className={[
          'goal-detail-sheet',
          `goal-detail-sheet--${snap}`,
          isDragging ? 'goal-detail-sheet--dragging' : '',
          isEntering ? 'goal-detail-sheet--enter' : '',
          isClosing ? 'goal-detail-sheet--closing' : '',
        ].filter(Boolean).join(' ')}
        style={{ height: sheetHeightPx, maxHeight: sheetHeightPx }}
        role="region"
        aria-label="目標の詳細"
        aria-hidden={isClosing}
        onPointerDown={stopSheetPointerBubble}
      >
        <div
          className="goal-detail-sheet__drag-zone"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerCancel}
        >
          <div className="goal-detail-sheet__handle" aria-hidden="true" />
          <div className="goal-detail-sheet__header">
            <h2 className="goal-detail-sheet__title">目標の詳細</h2>
            <button
              type="button"
              className="goal-detail-sheet__close"
              aria-label={snap === 'full' ? '標準表示に戻す' : '閉じる'}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleCloseClick}
            >
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <div
          className={[
            'goal-detail-sheet__body',
            snap === 'peek' ? 'goal-detail-sheet__body--peek' : '',
          ].filter(Boolean).join(' ')}
        >
          {children(snap)}
          {snap === 'half' && (
            <button
              type="button"
              className="btn-ghost goal-detail-sheet__more"
              onClick={handleExpandFull}
            >
              もっと見る
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
