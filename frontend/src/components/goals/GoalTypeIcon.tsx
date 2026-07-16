/**
 * 目標種別（長期/中期/短期）のバッジ表示。
 *
 * 目標マップのカード（GoalNodeCard.tsx の .gnc__type）と同じ
 * アイコン・ラベル定義（goalNode.config.ts の GOAL_TYPE_CONFIG）を
 * そのまま再利用し、見た目を統一する。
 *
 * .gnc__type 自体は GoalNodeCard 用の CSS 変数(--gnc-*)にスコープされて
 * 使えないため、同じトークン値を .goal-type-badge として index.css 側に
 * 複製している（値は goal-node.css と同期させること）。
 */
import { GOAL_TYPE_CONFIG, FALLBACK_TYPE } from '../../features/goals/components/goalNodeCard/goalNode.config';

type GoalPeriodType = 'long' | 'middle' | 'short';

// LocalGoal.period_type は 'middle' 表記だが、GOAL_TYPE_CONFIG のキーは 'mid'
const toConfigKey = (type: GoalPeriodType): string => (type === 'middle' ? 'mid' : type);

export const GOAL_PERIOD_LABEL: Record<GoalPeriodType, string> = {
  long: GOAL_TYPE_CONFIG.long?.label ?? FALLBACK_TYPE.label,
  middle: GOAL_TYPE_CONFIG.mid?.label ?? FALLBACK_TYPE.label,
  short: GOAL_TYPE_CONFIG.short?.label ?? FALLBACK_TYPE.label,
};

interface GoalTypeBadgeProps {
  type: GoalPeriodType;
}

export function GoalTypeBadge({ type }: GoalTypeBadgeProps) {
  const meta = GOAL_TYPE_CONFIG[toConfigKey(type)] ?? FALLBACK_TYPE;
  const Icon = meta.icon;

  return (
    <span className={`goal-type-badge${type === 'long' ? ' goal-type-badge--long' : ''}`}>
      <Icon size={13} strokeWidth={1.75} aria-hidden />
      {meta.label}
    </span>
  );
}

// 旧名でも参照できるようにしておく（呼び出し側の移行漏れ対策）
export const GoalTypeIcon = GoalTypeBadge;
