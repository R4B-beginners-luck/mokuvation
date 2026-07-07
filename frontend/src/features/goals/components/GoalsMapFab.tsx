import { useState } from 'react';
import { Eye, EyeOff, MapPin, Menu, X } from 'lucide-react';

interface GoalsMapFabProps {
  showCompleted: boolean;
  onToggleCompleted: () => void;
  onRecenterToLongTerm: () => void;
}

export function GoalsMapFab({
  showCompleted,
  onToggleCompleted,
  onRecenterToLongTerm,
}: GoalsMapFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleCompleted = () => {
    onToggleCompleted();
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
        {isOpen ? (
          <X size={22} strokeWidth={1.75} aria-hidden />
        ) : (
          <Menu size={22} strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}
