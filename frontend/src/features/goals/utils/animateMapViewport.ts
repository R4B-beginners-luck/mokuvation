import type { MapViewport } from './goalMapLayout';

/** ノード選択・長期へ戻るなど、プログラムによる viewport 移動の所要時間 */
export const VIEWPORT_ANIMATION_MS = 300;

/** 最初速く・最後ゆっくり止まる ease-out */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function interpolateMapViewport(
  from: MapViewport,
  to: MapViewport,
  progress: number,
): MapViewport {
  return {
    panX: from.panX + (to.panX - from.panX) * progress,
    panY: from.panY + (to.panY - from.panY) * progress,
    scale: from.scale + (to.scale - from.scale) * progress,
  };
}

export function mapViewportEquals(a: MapViewport, b: MapViewport): boolean {
  return a.panX === b.panX && a.panY === b.panY && a.scale === b.scale;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type ViewportAnimationCancel = () => void;

/**
 * viewport を from → to へ補間する。ユーザー操作との競合を避けるため、
 * 呼び出し側でドラッグ開始時などに返却関数でキャンセルすること。
 */
export function animateMapViewport(
  from: MapViewport,
  to: MapViewport,
  onUpdate: (viewport: MapViewport) => void,
  options?: { durationMs?: number; onComplete?: () => void },
): ViewportAnimationCancel {
  if (prefersReducedMotion() || mapViewportEquals(from, to)) {
    onUpdate(to);
    options?.onComplete?.();
    return () => {};
  }

  const durationMs = options?.durationMs ?? VIEWPORT_ANIMATION_MS;
  const startTime = performance.now();
  let rafId = 0;
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - startTime) / durationMs);
    onUpdate(interpolateMapViewport(from, to, easeOutCubic(t)));
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      options?.onComplete?.();
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
