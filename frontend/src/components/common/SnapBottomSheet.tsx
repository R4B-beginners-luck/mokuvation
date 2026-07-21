import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { vhToViewportPx, viewportPxToVh } from '../../utils/viewport';

export type SnapSheetLevel = { id: string; vh: number };

/** 目標マップ：背後マップ操作のため 1/5・1/2・9/10 */
export const GOALS_SHEET_LEVELS: SnapSheetLevel[] = [
  { id: 'peek', vh: 20 },
  { id: 'half', vh: 50 },
  { id: 'full', vh: 90 },
];

/** カレンダー詳細・追加：背後操作不要のため 9/10 のみ */
export const CALENDAR_SHEET_LEVELS: SnapSheetLevel[] = [
  { id: 'full', vh: 90 },
];

const DEFAULT_CLOSE_THRESHOLD_VH = 12;
const ENTER_ANIMATION_MS = 280;

export interface SnapBottomSheetProps {
  /** 段階定義（vh 昇順推奨）。呼び出し側で 1 段階 or 3 段階などを指定 */
  levels: SnapSheetLevel[];
  /** 開いたときの初期段階（未指定なら levels の先頭） */
  initialLevelId?: string;
  /** コンテンツ差し替え時に状態をリセットするキー */
  resetKey?: string;
  title: string;
  ariaLabel?: string;
  isClosing?: boolean;
  onClose: () => void;
  onSheetHeightChange?: (heightPx: number) => void;
  /**
   * 最上段（levels 末尾）で × を押したとき、一段下げる段階 id。
   * 目標マップ: 'half'。カレンダーの 1 段階では未指定（そのまま閉じる）。
   */
  collapseLevelId?: string;
  /** half 相当で「もっと見る」を出す段階 id（目標マップ用） */
  expandHintFromLevelId?: string;
  /** 「もっと見る」で遷移する段階 id（既定: levels 末尾） */
  expandToLevelId?: string;
  /** 暗転 backdrop（カレンダー用）。マップ連動シートでは false */
  hasBackdrop?: boolean;
  /** CSS クラス接頭辞。目標マップ互換のため既定は goal-detail-sheet */
  classPrefix?: string;
  /** ドラッグ中に body へ付けるクラス（マップの pointer 抑制用） */
  draggingBodyClassName?: string;
  children: (levelId: string) => ReactNode;
}

function vhToPx(vh: number): number {
  return vhToViewportPx(vh);
}

function resolveLevelId(
  levels: SnapSheetLevel[],
  preferred?: string,
): string {
  if (preferred && levels.some((l) => l.id === preferred)) return preferred;
  return levels[0]?.id ?? 'full';
}

/** 高さから最も近い段階（または close）を決める。しきい値は隣り合う vh の中点 */
function heightToSnapId(
  heightPx: number,
  levels: SnapSheetLevel[],
  closeThresholdVh: number,
): string | 'close' {
  const vh = viewportPxToVh(heightPx);
  if (vh < closeThresholdVh) return 'close';

  const sorted = [...levels].sort((a, b) => a.vh - b.vh);
  if (sorted.length === 0) return 'close';
  if (sorted.length === 1) return sorted[0].id;

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const mid = (sorted[i].vh + sorted[i + 1].vh) / 2;
    if (vh < mid) return sorted[i].id;
  }
  return sorted[sorted.length - 1].id;
}

/**
 * スワイプで開閉できる共通ボトムシート。
 * 段階数・高さは levels で呼び出し側が指定する。
 */
export function SnapBottomSheet({
  levels,
  initialLevelId,
  resetKey,
  title,
  ariaLabel,
  isClosing = false,
  onClose,
  onSheetHeightChange,
  collapseLevelId,
  expandHintFromLevelId,
  expandToLevelId,
  hasBackdrop = false,
  classPrefix = 'goal-detail-sheet',
  draggingBodyClassName = 'goal-sheet-dragging',
  children,
}: SnapBottomSheetProps) {
  const levelById = useMemo(() => {
    const map = new Map<string, SnapSheetLevel>();
    for (const level of levels) map.set(level.id, level);
    return map;
  }, [levels]);

  const topLevelId = levels[levels.length - 1]?.id;
  const expandTargetId = expandToLevelId ?? topLevelId;

  const [snap, setSnap] = useState(() => resolveLevelId(levels, initialLevelId));
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const dragRef = useRef<{ startY: number; startSnap: string } | null>(null);

  useEffect(() => {
    setSnap(resolveLevelId(levels, initialLevelId));
    setDragOffset(0);
    setIsDragging(false);
    dragRef.current = null;
    setIsEntering(true);
    const timer = window.setTimeout(() => setIsEntering(false), ENTER_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [resetKey, levels, initialLevelId]);

  const snapVh = levelById.get(snap)?.vh ?? levels[0]?.vh ?? 90;
  const baseHeightPx = vhToPx(snapVh);
  const sheetHeightPx = Math.max(0, baseHeightPx - dragOffset);

  useEffect(() => {
    onSheetHeightChange?.(sheetHeightPx);
  }, [onSheetHeightChange, sheetHeightPx]);

  useEffect(() => {
    return () => onSheetHeightChange?.(0);
  }, [resetKey, onSheetHeightChange]);

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

    const startVh = levelById.get(dragRef.current.startSnap)?.vh ?? snapVh;
    const startHeight = vhToPx(startVh);
    const finalHeight = startHeight - dragOffset;
    const next = heightToSnapId(finalHeight, levels, DEFAULT_CLOSE_THRESHOLD_VH);

    if (next === 'close') {
      onClose();
    } else {
      setSnap(next);
    }

    setDragOffset(0);
    clearDrag();
  }, [clearDrag, dragOffset, levelById, levels, onClose, snapVh]);

  const onDragPointerCancel = useCallback(() => {
    setDragOffset(0);
    clearDrag();
  }, [clearDrag]);

  const handleCloseClick = useCallback(() => {
    if (isClosing) return;
    if (collapseLevelId && snap === topLevelId && levelById.has(collapseLevelId)) {
      setSnap(collapseLevelId);
      return;
    }
    onClose();
  }, [collapseLevelId, isClosing, levelById, onClose, snap, topLevelId]);

  const handleExpand = useCallback(() => {
    if (isClosing || !expandTargetId) return;
    setSnap(expandTargetId);
  }, [expandTargetId, isClosing]);

  useEffect(() => {
    if (!isDragging || !draggingBodyClassName) return undefined;
    document.body.classList.add(draggingBodyClassName);
    return () => {
      document.body.classList.remove(draggingBodyClassName);
    };
  }, [draggingBodyClassName, isDragging]);

  const stopSheetPointerBubble = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const p = classPrefix;
  const sheet = (
    <div
      className={[
        p,
        `${p}--${snap}`,
        isDragging ? `${p}--dragging` : '',
        isEntering ? `${p}--enter` : '',
        isClosing ? `${p}--closing` : '',
      ].filter(Boolean).join(' ')}
      style={{ height: sheetHeightPx, maxHeight: sheetHeightPx }}
      role="dialog"
      aria-modal={hasBackdrop || undefined}
      aria-label={ariaLabel ?? title}
      aria-hidden={isClosing}
      onPointerDown={stopSheetPointerBubble}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`${p}__drag-zone`}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerCancel}
      >
        <div className={`${p}__handle`} aria-hidden="true" />
        <div className={`${p}__header`}>
          <h2 className={`${p}__title`}>{title}</h2>
          <button
            type="button"
            className={`${p}__close`}
            aria-label={
              collapseLevelId && snap === topLevelId ? '標準表示に戻す' : '閉じる'
            }
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleCloseClick}
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <div
        className={[
          `${p}__body`,
          snap === 'peek' ? `${p}__body--peek` : '',
        ].filter(Boolean).join(' ')}
      >
        {children(snap)}
        {expandHintFromLevelId && snap === expandHintFromLevelId && (
          <button
            type="button"
            className={`btn-ghost ${p}__more`}
            onClick={handleExpand}
          >
            もっと見る
          </button>
        )}
      </div>
    </div>
  );

  if (hasBackdrop) {
    return (
      <div
        className={`${p}-backdrop ${p}--open`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isClosing) onClose();
        }}
      >
        {sheet}
      </div>
    );
  }

  return (
    <div className={`${p}-root ${p}--open`}>
      {sheet}
    </div>
  );
}
