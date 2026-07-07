import { prefersReducedMotion } from './celebrationUtils';

type CelebrationCheckIconProps = {
  /** 表示サイズ（px） */
  size?: number;
  /** true のときチェックの描画アニメーションを1回再生する */
  animate?: boolean;
  className?: string;
};

/**
 * 提供アセット（太めの白チェック）に合わせた SVG。
 * 背景は透過のため、暗いオーバーレイやチェック枠の上にそのまま載せられる。
 */
export function CelebrationCheckIcon({
  size = 56,
  animate = false,
  className,
}: CelebrationCheckIconProps) {
  const shouldAnimate = animate && !prefersReducedMotion();

  return (
    <svg
      className={[
        'celebration-check-icon',
        shouldAnimate && 'celebration-check-icon--animate',
        className,
      ].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
    >
      <path
        className="celebration-check-icon__mark"
        d="M22 52 L42 74 L78 26"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
