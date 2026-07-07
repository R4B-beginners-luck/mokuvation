/** Vite public 配下のローカル .lottie（オフライン・PWA 対応） */
export const GOAL_CELEBRATION_LOTTIE_SRC = '/animations/goal-celebration.lottie';

export function prefetchGoalCelebrationLottie(): void {
  void import('./GoalCelebrationLottie');
  void fetch(GOAL_CELEBRATION_LOTTIE_SRC);
}
