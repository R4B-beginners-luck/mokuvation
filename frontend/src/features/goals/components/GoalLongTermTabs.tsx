import { Plus } from 'lucide-react';
import type { LongTermGoal } from '../../../types';

interface GoalLongTermTabsProps {
  longTermGoals: LongTermGoal[];
  activeLtId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function GoalLongTermTabs({
  longTermGoals,
  activeLtId,
  disabled = false,
  onSelect,
  onAdd,
}: GoalLongTermTabsProps) {
  return (
    <div className="goal-lt-tabs" role="tablist" aria-label="長期目標">
      <div className="goal-lt-tabs__scroll">
        {longTermGoals.map((goal) => {
          const isActive = goal.id === activeLtId;
          return (
            <button
              key={goal.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`goal-lt-tabs__tab${isActive ? ' goal-lt-tabs__tab--active' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(goal.id)}
              title={goal.title}
            >
              {goal.title}
            </button>
          );
        })}
        <button
          type="button"
          className="goal-lt-tabs__tab goal-lt-tabs__tab--add"
          aria-label="長期目標を追加"
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
