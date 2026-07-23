import type { GoalChain } from '../utils/resolveGoalChain';
import { goalChainHasAny } from '../utils/resolveGoalChain';

interface GoalChainTagsProps {
  chain: GoalChain;
  emptyLabel?: string;
}

/** タスク詳細・編集で共通の、紐づき目標（長期／中期／短期）タグ表示 */
export function GoalChainTags({ chain, emptyLabel = 'なし' }: GoalChainTagsProps) {
  if (!goalChainHasAny(chain)) {
    return <div className="task-detail__muted">{emptyLabel}</div>;
  }

  return (
    <div className="task-detail__tags">
      {chain.long && <span className="tag tag--long">{chain.long.title}</span>}
      {chain.mid && <span className="tag tag--mid">{chain.mid.title}</span>}
      {chain.short && <span className="tag tag--short">{chain.short.title}</span>}
    </div>
  );
}
