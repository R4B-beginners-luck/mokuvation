/**
 * BrandMark のスプラッシュアニメーション全体の所要時間（ms）。
 * brand-mark.css の最終キーフレーム（chk: 0.82s delay + 0.4s）に合わせ、余裕を持たせる。
 */
export const BRAND_SPLASH_ANIMATION_MS = 1300;

/** スプラッシュ表示開始からアニメーション1周分が経過するまで待つ */
export function waitForBrandSplashAnimation(startedAt: number): Promise<void> {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }

  const remaining = BRAND_SPLASH_ANIMATION_MS - (Date.now() - startedAt);
  if (remaining <= 0) return Promise.resolve();

  return new Promise((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}
