/** 選択ピン演出と同様、動きを減らす設定ではアニメーションを省略する */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
