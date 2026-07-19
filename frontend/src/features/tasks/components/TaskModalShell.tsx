import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

interface TaskModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * PC: 共有 Modal / スマホ: ボトムシート（date-picker-sheet と同系統）。
 * 目標マップの GoalDetailSheet ほど複雑なスナップは持たせず、高さ上限＋内部スクロールで収める。
 */
export function TaskModalShell({ title, onClose, children }: TaskModalShellProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  useLockBodyScroll();

  if (!isMobile) {
    return (
      <Modal title={title} onClose={onClose}>
        <div className="modal__form">{children}</div>
      </Modal>
    );
  }

  return (
    <div
      className="task-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="task-sheet"
        role="dialog"
        aria-modal
        aria-labelledby="task-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-sheet__handle" aria-hidden />
        <div className="task-sheet__header">
          <h2 className="task-sheet__title" id="task-sheet-title">{title}</h2>
          <button type="button" className="task-sheet__close" onClick={onClose} aria-label="閉じる">
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="task-sheet__body">{children}</div>
      </div>
    </div>
  );
}
