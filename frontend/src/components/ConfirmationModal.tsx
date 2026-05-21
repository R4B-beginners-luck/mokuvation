import { Modal } from './Modal';

interface ConfirmationModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div style={{ display: 'grid', gap: 16 }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>{description}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
            style={{ minWidth: 92 }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ minWidth: 92 }}
          >
            {isLoading ? '削除中…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
