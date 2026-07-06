import { lazy, Suspense, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCelebrationPhase } from './useCelebrationPhase';
import './celebration.css';

/** 目標達成時のみ読み込む（DotLottie はバンドルが大きいため） */
const GoalCelebrationLottie = lazy(() =>
  import('./GoalCelebrationLottie').then((mod) => ({ default: mod.GoalCelebrationLottie })),
);

export const GOAL_CELEBRATION_TIMING = {
  enterMs: 300,
  visibleMs: 2000,
  exitMs: 300,
} as const;

export type GoalCelebrationSession = {
  goalId: string;
  goalTitle: string;
  message: string;
  /** 連続達成時も演出を再発火させるための一意キー */
  sessionId: number;
};

type GoalCelebrationOverlayProps = {
  session: GoalCelebrationSession | null;
  onDismissed: () => void;
};

function phaseClass(base: string, phase: string): string {
  if (phase === 'idle') return '';
  return `${base}--${phase}`;
}

export function GoalCelebrationOverlay({ session, onDismissed }: GoalCelebrationOverlayProps) {
  const sessionKey = session ? `${session.goalId}-${session.sessionId}` : null;

  const { phase, startExit, handleAnimationEnd } = useCelebrationPhase({
    sessionKey,
    ...GOAL_CELEBRATION_TIMING,
    onDismissed,
  });

  const handleBackdropClick = useCallback(() => {
    startExit();
  }, [startExit]);

  if (!session || phase === 'idle') return null;

  return createPortal(
    <div
      className={[
        'goal-celebration-backdrop',
        phaseClass('goal-celebration-backdrop', phase),
      ].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="目標達成"
      onClick={handleBackdropClick}
    >
      <div
        className={[
          'goal-celebration-content',
          phaseClass('goal-celebration-content', phase),
        ].filter(Boolean).join(' ')}
        onAnimationEnd={phase === 'entering' || phase === 'exiting' ? handleAnimationEnd : undefined}
      >
        <div className="goal-celebration-content__icon" aria-hidden>
          <Suspense fallback={null}>
            <GoalCelebrationLottie sessionId={session.sessionId} />
          </Suspense>
        </div>
        <p className="goal-celebration-content__title">目標を達成しました</p>
        <p className="goal-celebration-content__message">{session.message}</p>
      </div>
    </div>,
    document.body,
  );
}
