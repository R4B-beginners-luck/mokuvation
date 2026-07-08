/**
 * iOS Safari / PWA 向けのビューポート高さ。
 * visualViewport が使える環境ではそちらを優先し、
 * 取得できない場合のみ innerHeight にフォールバックする。
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height ?? window.innerHeight;
}

/** vh 単位をビューポート px に変換 */
export function vhToViewportPx(vh: number): number {
  return (getViewportHeight() * vh) / 100;
}

/** ビューポート px を vh 単位に変換 */
export function viewportPxToVh(px: number): number {
  const height = getViewportHeight();
  if (height <= 0) return 0;
  return (px / height) * 100;
}
