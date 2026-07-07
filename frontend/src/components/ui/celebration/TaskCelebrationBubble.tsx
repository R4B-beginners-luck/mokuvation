import { CelebrationCheckIcon } from './CelebrationCheckIcon';
import type { CelebrationPhase } from './useCelebrationPhase';
import './celebration.css';

const TASK_CELEBRATION_TIMING = {
  enterMs: 320,
  visibleMs: 2200,
  exitMs: 380,
} as const;

type TaskCelebrationBubbleProps = {
  message: string;
  phase: CelebrationPhase;
  onSkip: () => void;
  onAnimationEnd: (e: React.AnimationEvent<HTMLElement>) => void;
};

function phaseClass(base: string, phase: CelebrationPhase): string {
  if (phase === 'idle') return '';
  return `${base}--${phase}`;
}

export { TASK_CELEBRATION_TIMING };

export function TaskCelebrationBubble({
  message,
  phase,
  onSkip,
  onAnimationEnd,
}: TaskCelebrationBubbleProps) {
  if (phase === 'idle') return null;

  return (
    <span
      className={[
        'task-celebration-bubble',
        phaseClass('task-celebration-bubble', phase),
      ].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      onClick={(e) => {
        e.stopPropagation();
        onSkip();
      }}
      onAnimationEnd={phase === 'entering' || phase === 'exiting' ? onAnimationEnd : undefined}
    >
      {message}
    </span>
  );
}

type TaskCelebrationCheckProps = {
  completed: boolean;
  showCheckPop: boolean;
  animationKey?: number;
};

export function TaskCelebrationCheck({
  completed,
  showCheckPop,
  animationKey,
}: TaskCelebrationCheckProps) {
  return (
    <div
      className={[
        'goal-item__check',
        completed && 'checked',
        showCheckPop && 'goal-item__check--celebrating',
      ].filter(Boolean).join(' ')}
    >
      {completed && (
        <CelebrationCheckIcon
          key={animationKey}
          size={20}
          animate={showCheckPop}
        />
      )}
    </div>
  );
}
