import { useState } from 'react';
import { Eye, EyeOff, Hash, ListTree, MapPin, Plus } from 'lucide-react';
import type { LongTermGoal } from '../../../types';
import type { ProgressUnitMode } from '../utils/goalMapPreferences';

interface GoalsMapSecondaryPanelProps {
  longTermGoals: LongTermGoal[];
  activeLtId: string;
  showCompleted: boolean;
  progressUnit: ProgressUnitMode;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onToggleCompleted: () => void;
  onToggleProgressUnit: () => void;
  onRecenterToLongTerm: () => void;
  onReorder?: (orderedIds: string[]) => void;
}

function applyReorder(ids: string[], from: number, insertBefore: number): string[] | null {
  if (from < 0 || from >= ids.length) return null;
  if (insertBefore === from || insertBefore === from + 1) return null;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  const adjusted = insertBefore > from ? insertBefore - 1 : insertBefore;
  next.splice(adjusted, 0, moved);
  return next;
}

export function GoalsMapSecondaryPanel({
  longTermGoals,
  activeLtId,
  showCompleted,
  progressUnit,
  disabled = false,
  onSelect,
  onAdd,
  onToggleCompleted,
  onToggleProgressUnit,
  onRecenterToLongTerm,
  onReorder,
}: GoalsMapSecondaryPanelProps) {
  const isTaskUnit = progressUnit === 'task';
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [insertBefore, setInsertBefore] = useState<number | null>(null);

  const showIndicatorAt =
    dragFrom !== null &&
    insertBefore !== null &&
    insertBefore !== dragFrom &&
    insertBefore !== dragFrom + 1
      ? insertBefore
      : null;

  const clearDrag = () => {
    setDragFrom(null);
    setInsertBefore(null);
  };

  return (
    <div className="goals-map-secondary-panel">
      <div className="goals-map-secondary-panel__header">
        <h2 className="goals-map-secondary-panel__title">目標マップ</h2>
        <p className="goals-map-secondary-panel__subtitle">長期目標</p>
      </div>

      <nav className="goals-map-secondary-panel__list" aria-label="長期目標一覧">
        {longTermGoals.map((goal, index) => {
          const isActive = goal.id === activeLtId;
          return (
            <div key={goal.id} className="goals-map-secondary-panel__slot">
              {showIndicatorAt === index && (
                <span className="goals-map-secondary-panel__drop-indicator" aria-hidden />
              )}
              <button
                type="button"
                className={`goals-map-secondary-panel__item${isActive ? ' goals-map-secondary-panel__item--active' : ''}${dragFrom === index ? ' goals-map-secondary-panel__item--dragging' : ''}`}
                disabled={disabled}
                draggable={!disabled && !!onReorder}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(index));
                  e.dataTransfer.effectAllowed = 'move';
                  setDragFrom(index);
                  setInsertBefore(index);
                }}
                onDragEnd={clearDrag}
                onDragOver={(e) => {
                  if (!onReorder || disabled || dragFrom === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const rect = e.currentTarget.getBoundingClientRect();
                  const before = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
                  setInsertBefore(before);
                }}
                onDrop={(e) => {
                  if (!onReorder || disabled) return;
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('text/plain'));
                  const before = insertBefore ?? index;
                  clearDrag();
                  if (!Number.isFinite(from)) return;
                  const next = applyReorder(
                    longTermGoals.map((g) => g.id),
                    from,
                    before,
                  );
                  if (next) onReorder(next);
                }}
                onClick={() => onSelect(goal.id)}
                title={goal.title}
              >
                <span className="goals-map-secondary-panel__item-label">{goal.title}</span>
              </button>
            </div>
          );
        })}
        {showIndicatorAt === longTermGoals.length && (
          <span className="goals-map-secondary-panel__drop-indicator" aria-hidden />
        )}
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

        <button
          type="button"
          className="goals-map-secondary-panel__toggle goals-map-secondary-panel__toggle--active"
          disabled={disabled}
          onClick={onToggleProgressUnit}
          aria-pressed={isTaskUnit}
          aria-label={isTaskUnit ? '子目標数で統一する' : 'タスク数で統一する'}
        >
          {isTaskUnit ? (
            <Hash size={16} strokeWidth={1.75} aria-hidden />
          ) : (
            <ListTree size={16} strokeWidth={1.75} aria-hidden />
          )}
          <span>{isTaskUnit ? 'タスク数で統一' : '子目標数で統一'}</span>
        </button>
      </div>
    </div>
  );
}
