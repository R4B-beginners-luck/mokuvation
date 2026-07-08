/** Vite public 配下のローカル .lottie（オフライン・PWA 対応） */
export const GOAL_CELEBRATION_LOTTIE_SRC = '/animations/goal-celebration.lottie';

export function prefetchGoalCelebrationLottie(): void {
  void import('./GoalCelebrationLottie');
  // 先読み失敗時もUncaught (in promise)にはしないが、握りつぶさずログだけ残す。
  // 実際の表示はGoalCelebrationLottie側のloadError/timeoutでフォールバックされるので実害はない。
  void fetch(GOAL_CELEBRATION_LOTTIE_SRC).catch((err) => {
    console.debug('[GoalCelebrationLottie] prefetch failed (fallback icon will be used):', err);
  });
}
