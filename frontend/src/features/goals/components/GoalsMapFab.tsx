import { useState } from 'react';
import { ChevronDown, Eye, EyeOff, Hash, ListTree, MapPin } from 'lucide-react';
import type { ProgressUnitMode } from '../utils/goalMapPreferences';

interface GoalsMapFabProps {
  showCompleted: boolean;
  progressUnit: ProgressUnitMode;
  onToggleCompleted: () => void;
  onToggleProgressUnit: () => void;
  onRecenterToLongTerm: () => void;
}

export function GoalsMapFab({
  showCompleted,
  progressUnit,
  onToggleCompleted,
  onToggleProgressUnit,
  onRecenterToLongTerm,
}: GoalsMapFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isTaskUnit = progressUnit === 'task';

  const handleToggleCompleted = () => {
    onToggleCompleted();
    setIsOpen(false);
  };

  const handleToggleProgressUnit = () => {
    onToggleProgressUnit();
    setIsOpen(false);
  };

  const handleRecenter = () => {
    onRecenterToLongTerm();
    setIsOpen(false);
  };

  return (
    <div className={`goals-map-fab${isOpen ? ' goals-map-fab--open' : ''}`}>
      {isOpen && (
        <div className="goals-map-fab__menu" role="menu">
          <button
            type="button"
            className="goals-map-fab__action"
            role="menuitem"
            onClick={handleRecenter}
          >
            <MapPin size={18} strokeWidth={1.75} aria-hidden />
            <span>長期へ戻る</span>
          </button>
          <button
            type="button"
            className="goals-map-fab__action"
            role="menuitem"
            onClick={handleToggleCompleted}
          >
            {showCompleted ? (
              <EyeOff size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <Eye size={18} strokeWidth={1.75} aria-hidden />
            )}
            <span>{showCompleted ? '達成を隠す' : '達成済みを表示'}</span>
          </button>
          <button
            type="button"
            className="goals-map-fab__action"
            role="menuitem"
            onClick={handleToggleProgressUnit}
            aria-pressed={isTaskUnit}
          >
            {isTaskUnit ? (
              <Hash size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <ListTree size={18} strokeWidth={1.75} aria-hidden />
            )}
            <span>{isTaskUnit ? 'タスク数で統一中' : '子目標数で統一中'}</span>
          </button>
        </div>
      )}
      <button
        type="button"
        className="goals-map-fab__trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? 'メニューを閉じる' : '表示メニューを開く'}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <ChevronDown
          size={22}
          strokeWidth={1.75}
          aria-hidden
          className={`goals-map-fab__chevron${isOpen ? ' goals-map-fab__chevron--open' : ''}`}
        />
      </button>
    </div>
  );
}
