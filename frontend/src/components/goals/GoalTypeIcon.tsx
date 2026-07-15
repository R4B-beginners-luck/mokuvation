/**
 * 目標マップ(GoalGraph.tsx)で使っているのと同じ図形（六角形=長期／四角=中期／丸=短期）を
 * 小さいアイコンとして描画する共通コンポーネント。
 *
 * タスク追加モーダルの目標選択など、native <select> の <option> が使えず
 * SVG/CSSタグを描画したい箇所で使う想定。
 */

type GoalPeriodType = 'long' | 'middle' | 'short';

interface GoalTypeIconProps {
  type: GoalPeriodType;
  color: string;
  size?: number;
}

// GoalGraph.tsx の getPolygonPoints と同じ形状ロジック
// （半径基準の座標なので、そのまま流用できる）
function getPolygonPoints(type: GoalPeriodType, radius: number): string {
  if (type === 'long') {
    // 六角形
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      points.push(`${radius * Math.cos(angleRad)},${radius * Math.sin(angleRad)}`);
    }
    return points.join(' ');
  }
  if (type === 'middle') {
    // 四角形
    return `-${radius},-${radius} ${radius},-${radius} ${radius},${radius} -${radius},${radius}`;
  }
  return ''; // short は circle を使うのでここは使わない
}

export function GoalTypeIcon({ type, color, size = 14 }: GoalTypeIconProps) {
  const r = size / 2 - 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      {type === 'short' ? (
        <circle r={r} fill={color} />
      ) : (
        <polygon points={getPolygonPoints(type, r)} fill={color} />
      )}
    </svg>
  );
}

export const GOAL_PERIOD_LABEL: Record<GoalPeriodType, string> = {
  long: '長期',
  middle: '中期',
  short: '短期',
};
