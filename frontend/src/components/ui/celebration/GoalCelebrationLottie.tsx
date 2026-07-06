import { useCallback, useEffect, useRef, useState } from 'react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { CelebrationCheckIcon } from './CelebrationCheckIcon';
import { GOAL_CELEBRATION_LOTTIE_SRC } from './celebrationLottie.constants';
import { prefersReducedMotion } from './celebrationUtils';

export { GOAL_CELEBRATION_LOTTIE_SRC, prefetchGoalCelebrationLottie } from './celebrationLottie.constants';

const LOTTIE_LOAD_TIMEOUT_MS = 4000;

type GoalCelebrationLottieProps = {
  /** 連続達成時にアニメーションを最初から再生し直す */
  sessionId: number;
};

type LottieStatus = 'loading' | 'ready' | 'error';

function GoalCelebrationFallback({ animate }: { animate: boolean }) {
  return (
    <CelebrationCheckIcon
      size={72}
      animate={animate}
      className="goal-celebration-content__fallback-check"
    />
  );
}

export function GoalCelebrationLottie({ sessionId }: GoalCelebrationLottieProps) {
  const [status, setStatus] = useState<LottieStatus>('loading');
  const detachListenersRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    setStatus('loading');
  }, [sessionId]);

  useEffect(() => {
    if (status !== 'loading') return undefined;

    const timer = window.setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'error' : current));
    }, LOTTIE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [sessionId, status]);

  const dotLottieRefCallback = useCallback((instance: DotLottie | null) => {
    detachListenersRef.current?.();
    detachListenersRef.current = undefined;

    if (!instance) return;

    const onLoad = () => setStatus('ready');
    const onLoadError = () => setStatus('error');

    instance.addEventListener('load', onLoad);
    instance.addEventListener('loadError', onLoadError);
    detachListenersRef.current = () => {
      instance.removeEventListener('load', onLoad);
      instance.removeEventListener('loadError', onLoadError);
    };
  }, []);

  useEffect(() => () => detachListenersRef.current?.(), []);

  if (prefersReducedMotion()) {
    return <GoalCelebrationFallback animate={false} />;
  }

  if (status === 'error') {
    return <GoalCelebrationFallback animate />;
  }

  return (
    <DotLottieReact
      key={sessionId}
      src={GOAL_CELEBRATION_LOTTIE_SRC}
      loop={false}
      autoplay
      className="goal-celebration-content__lottie"
      dotLottieRefCallback={dotLottieRefCallback}
    />
  );
}
