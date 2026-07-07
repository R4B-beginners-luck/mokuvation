import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';

interface GoalPositionSaveBarProps {
  isSaving: boolean;
  onSave: () => void;
}

export function GoalPositionSaveBar({ isSaving, onSave }: GoalPositionSaveBarProps) {
  return (
    <div className="goal-position-save-bar" role="status" aria-live="polite">
      <span className="goal-position-save-bar__message">配置が変更されました</span>
      <button
        type="button"
        className="btn-primary goal-position-save-bar__save"
        disabled={isSaving}
        onClick={onSave}
      >
        {isSaving ? (
          <>
            <ButtonSpinner />
            保存中
          </>
        ) : (
          '保存'
        )}
      </button>
    </div>
  );
}
