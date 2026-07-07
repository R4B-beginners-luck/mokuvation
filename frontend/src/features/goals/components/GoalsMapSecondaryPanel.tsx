import { Eye, EyeOff, MapPin, Plus } from 'lucide-react';
import type { LongTermGoal } from '../../../types';

interface GoalsMapSecondaryPanelProps {
  longTermGoals: LongTermGoal[];
  activeLtId: string;
  showCompleted: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onToggleCompleted: () => void;
  onRecenterToLongTerm: () => void;
}

export function GoalsMapSecondaryPanel({
  longTermGoals,
  activeLtId,
  showCompleted,
  disabled = false,
  onSelect,
  onAdd,
  onToggleCompleted,
  onRecenterToLongTerm,
}: GoalsMapSecondaryPanelProps) {
  return (
    <div className="goals-map-secondary-panel">
      <div className="goals-map-secondary-panel__header">
        <h2 className="goals-map-secondary-panel__title">目標マップ</h2>
        <p className="goals-map-secondary-panel__subtitle">長期目標</p>
      </div>

      <nav className="goals-map-secondary-panel__list" aria-label="長期目標一覧">
        {longTermGoals.map((goal) => {
          const isActive = goal.id === activeLtId;
          return (
            <button
              key={goal.id}
              type="button"
              className={`goals-map-secondary-panel__item${isActive ? ' goals-map-secondary-panel__item--active' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(goal.id)}
              title={goal.title}
            >
              <span className="goals-map-secondary-panel__item-label">{goal.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="goals-map-secondary-panel__actions">
        <button
          type="button"
          className="btn-secondary goals-map-secondary-panel__add"
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus size={15} strokeWidth={1.75} aria-hidden />
          長期を追加
        </button>

        <button
          type="button"
          className="goals-map-secondary-panel__toggle"
          disabled={disabled}
          onClick={onRecenterToLongTerm}
        >
          <MapPin size={16} strokeWidth={1.75} aria-hidden />
          <span>長期へ戻る</span>
        </button>

        <button
          type="button"
          className="goals-map-secondary-panel__toggle"
          disabled={disabled}
          onClick={onToggleCompleted}
        >
          {showCompleted ? (
            <EyeOff size={16} strokeWidth={1.75} aria-hidden />
          ) : (
            <Eye size={16} strokeWidth={1.75} aria-hidden />
          )}
          <span>{showCompleted ? '達成を隠す' : '達成を表示'}</span>
        </button>
      </div>
    </div>
  );
}
