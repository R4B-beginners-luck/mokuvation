/**
 * 目標種別（長期 / 中期 / 短期）バッジ。
 * ラベル・アイコンは GOAL_TYPE_CONFIG を単一の真実とし、
 * 色は CSS 変数 --goal-type-* を参照する。
 */
import { GOAL_TYPE_CONFIG, FALLBACK_TYPE } from '../../features/goals/components/goalNodeCard/goalNode.config';

export type GoalPeriodType = 'long' | 'middle' | 'short' | 'mid';

const toConfigKey = (type: GoalPeriodType): string => (type === 'middle' ? 'mid' : type);

const toCssKey = (type: GoalPeriodType): 'long' | 'mid' | 'short' => {
  if (type === 'middle' || type === 'mid') return 'mid';
  if (type === 'short') return 'short';
  return 'long';
};

export const GOAL_PERIOD_LABEL: Record<'long' | 'middle' | 'short', string> = {
  long: GOAL_TYPE_CONFIG.long?.label ?? FALLBACK_TYPE.label,
  middle: GOAL_TYPE_CONFIG.mid?.label ?? FALLBACK_TYPE.label,
  short: GOAL_TYPE_CONFIG.short?.label ?? FALLBACK_TYPE.label,
};

interface GoalTypeBadgeProps {
  type: GoalPeriodType;
  /** 詳細パネルなど「長期目標」表記が必要なとき */
  fullLabel?: boolean;
}

export function GoalTypeBadge({ type, fullLabel = false }: GoalTypeBadgeProps) {
  const meta = GOAL_TYPE_CONFIG[toConfigKey(type)] ?? FALLBACK_TYPE;
  const Icon = meta.icon;
  const cssKey = toCssKey(type);
  const label = fullLabel
    ? ({ long: '長期目標', mid: '中期目標', short: '短期目標' } as const)[cssKey]
    : meta.label;

  return (
    <span className={`goal-type-badge goal-type-badge--${cssKey}`}>
      <Icon size={13} strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}

export const GoalTypeIcon = GoalTypeBadge;
