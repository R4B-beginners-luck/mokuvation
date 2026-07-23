import { Modal } from '../../../components/Modal';
import { ButtonSpinner } from '../../../components/ui/ButtonSpinner';

interface GoalPositionLeaveModalProps {
  isSaving: boolean;
  /** false のとき「保存せず移動」を出さない（新規追加の配置中など） */
  allowDiscard?: boolean;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onCancel: () => void;
}

export function GoalPositionLeaveModal({
  isSaving,
  allowDiscard = true,
  onSaveAndLeave,
  onDiscardAndLeave,
  onCancel,
}: GoalPositionLeaveModalProps) {
  return (
    <Modal title="配置の変更が保存されていません" onClose={onCancel}>
      <div className="goal-position-leave-modal">
        <p className="goal-position-leave-modal__message">
          {allowDiscard
            ? '保存されていない配置の変更があります。どうしますか？'
            : '追加した目標の配置を保存してから移動してください。未操作のまま保存すると自動配置で確定されます。'}
        </p>
        <div className="goal-position-leave-modal__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            キャンセル
          </button>
          {allowDiscard && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onDiscardAndLeave}
              disabled={isSaving}
            >
              保存せず移動
            </button>
          )}
          <button
            type="button"
            className="btn-primary goal-position-leave-modal__save"
            onClick={onSaveAndLeave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ButtonSpinner />
                保存中…
              </>
            ) : (
              '保存して移動'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
