import { Flag, Plus } from 'lucide-react';

interface GoalsMapEmptyStateProps {
  onAdd: () => void;
}

export function GoalsMapEmptyState({ onAdd }: GoalsMapEmptyStateProps) {
  return (
    <div className="goals-map-empty" role="status" aria-live="polite">
      <div className="goals-map-empty__card">
        <span className="goals-map-empty__icon" aria-hidden>
          <Flag size={40} strokeWidth={1.75} />
        </span>
        <h2 className="goals-map-empty__title">目標がないよ！</h2>
        <p className="goals-map-empty__body">
          小さな一歩が、大きな変化になる。まずは目標を決めよう！
        </p>
        <button
          type="button"
          className="btn-primary goals-map-empty__cta"
          onClick={onAdd}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          長期目標を追加
        </button>
      </div>
    </div>
  );
}
