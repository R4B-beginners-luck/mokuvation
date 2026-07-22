import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

/** 軸判定を始める移動量（px） */
const AXIS_LOCK_PX = 10;
/** 月移動とみなす水平スワイプ距離（px） */
const SWIPE_THRESHOLD_PX = 56;

type Axis = 'undecided' | 'horizontal' | 'vertical';

interface SwipeState {
  pointerId: number;
  startX: number;
  startY: number;
  axis: Axis;
}

interface UseMonthSwipeOptions {
  enabled: boolean;
  /** 左スワイプ（翌月） */
  onSwipeLeft: () => void;
  /** 右スワイプ（前月） */
  onSwipeRight: () => void;
}

/**
 * スマホのカレンダー月グリッド向け。左右スワイプで月移動。
 * 縦優勢の動きは無視してページ／シートの縦スクロールを妨げない。
 * スワイプ成立後は直後の click（日付選択）を抑止する。
 */
export function useMonthSwipe({
  enabled,
  onSwipeLeft,
  onSwipeRight,
}: UseMonthSwipeOptions) {
  const stateRef = useRef<SwipeState | null>(null);
  const suppressClickRef = useRef(false);

  const clear = useCallback(() => {
    stateRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || e.button !== 0) return;
    // マルチタッチ（将来のピンチ等）は無視
    if (e.pointerType === 'touch' && e.isPrimary === false) return;

    stateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      axis: 'undecided',
    };
  }, [enabled]);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (state.axis === 'undecided') {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < AXIS_LOCK_PX && absY < AXIS_LOCK_PX) return;

      // 縦が優勢なら以降はスワイプ月移動しない（縦スクロール優先）
      if (absY > absX) {
        state.axis = 'vertical';
        return;
      }
      state.axis = 'horizontal';
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    if (state.axis === 'horizontal') {
      // 水平ロック後はブラウザの横ジェスチャと競合しにくいよう抑止
      e.preventDefault();
    }
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    if (state.axis === 'horizontal' && Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
      suppressClickRef.current = true;
      if (dx < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }

    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    clear();
  }, [clear, onSwipeLeft, onSwipeRight]);

  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    clear();
  }, [clear]);

  /** スワイプ直後の日付 click を一度だけ無視する */
  const shouldSuppressClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  if (!enabled) {
    return {
      handlers: {} as const,
      shouldSuppressClick: () => false,
    };
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    shouldSuppressClick,
  };
}
