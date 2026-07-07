import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './celebrationUtils';

/** 選択ピンと同じ idle → entering → visible → exiting の遷移 */
export type CelebrationPhase = 'idle' | 'entering' | 'visible' | 'exiting';

export type CelebrationTiming = {
  enterMs: number;
  visibleMs: number;
  exitMs: number;
};

type UseCelebrationPhaseOptions = CelebrationTiming & {
  /** sessionKey が null になると idle に戻す。新しいキーで入場を開始する */
  sessionKey: string | null;
  onDismissed?: () => void;
};

/**
 * 入場→表示→退場のライフサイクルを管理する。
 * generation でタイマー競合を防ぎ、animationend 未発火時はタイムアウトでフォールバックする
 * （GoalNodeCard の選択ピンと同じ考え方）。
 */
export function useCelebrationPhase({
  sessionKey,
  enterMs,
  visibleMs,
  exitMs,
  onDismissed,
}: UseCelebrationPhaseOptions) {
  const [phase, setPhase] = useState<CelebrationPhase>('idle');
  const genRef = useRef(0);
  const exitMsRef = useRef(exitMs);
  exitMsRef.current = exitMs;
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;
  /** finish 後に親へ通知する。setState updater 内では副作用を呼ばない */
  const pendingDismissRef = useRef(false);

  const finish = useCallback(() => {
    setPhase((current) => {
      if (current === 'idle') return current;
      pendingDismissRef.current = true;
      return 'idle';
    });
  }, []);

  const startExit = useCallback(() => {
    genRef.current += 1;
    const gen = genRef.current;

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    setPhase((current) => {
      if (current === 'idle' || current === 'exiting') return current;
      return 'exiting';
    });

    // 手動スキップ時は effect 内タイマーが無効化されるため、退場完了のフォールバックを別途張る
    window.setTimeout(() => {
      if (genRef.current !== gen) return;
      finish();
    }, exitMsRef.current + 80);
  }, [finish]);

  // 入場フェーズは描画前に開始し、初回表示の空白フレームを防ぐ
  useLayoutEffect(() => {
    if (!sessionKey) {
      setPhase('idle');
      pendingDismissRef.current = false;
      return;
    }

    pendingDismissRef.current = false;
    genRef.current += 1;
    setPhase(prefersReducedMotion() ? 'visible' : 'entering');
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey) return undefined;

    const gen = genRef.current;

    if (prefersReducedMotion()) {
      const timer = window.setTimeout(() => {
        if (genRef.current !== gen) return;
        finish();
      }, visibleMs);
      return () => window.clearTimeout(timer);
    }

    const toVisibleTimer = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      setPhase((current) => (current === 'entering' ? 'visible' : current));
    }, enterMs + 80);

    const toExitTimer = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      setPhase((current) => (current === 'visible' || current === 'entering' ? 'exiting' : current));
    }, enterMs + visibleMs);

    const toIdleTimer = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      finish();
    }, enterMs + visibleMs + exitMs + 80);

    return () => {
      window.clearTimeout(toVisibleTimer);
      window.clearTimeout(toExitTimer);
      window.clearTimeout(toIdleTimer);
    };
  }, [sessionKey, enterMs, visibleMs, exitMs, finish]);

  // 退場完了後に親 state を更新（render 中の setState を避ける）
  useEffect(() => {
    if (phase !== 'idle' || !pendingDismissRef.current || !sessionKey) return;
    pendingDismissRef.current = false;
    onDismissedRef.current?.();
  }, [phase, sessionKey]);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    const name = e.animationName;
    if (
      name.includes('celebration-enter')
      || name.includes('celebration-content-in')
      || name.includes('celebration-backdrop-in')
    ) {
      setPhase((current) => (current === 'entering' ? 'visible' : current));
    } else if (
      name.includes('celebration-exit')
      || name.includes('celebration-content-out')
      || name.includes('celebration-backdrop-out')
    ) {
      finish();
    }
  }, [finish]);

  return { phase, startExit, handleAnimationEnd };
}
