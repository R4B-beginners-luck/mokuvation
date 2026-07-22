import type { ReactNode } from 'react';
import { Modal } from '../../../components/Modal';
import {
  CALENDAR_SHEET_LEVELS,
  SnapBottomSheet,
} from '../../../components/common/SnapBottomSheet';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

interface TaskModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 同一タイトルでも内容が変わったときにシート状態をリセットしたい場合 */
  resetKey?: string;
}

/**
 * PC: 共有 Modal / スマホ: SnapBottomSheet（6/10・1段階・スワイプ閉じ）。
 * 目標マップと同じスワイプ仕組みを使い、段階数・高さだけカレンダー向けに絞る。
 */
export function TaskModalShell({ title, onClose, children, resetKey }: TaskModalShellProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  useLockBodyScroll();

  if (!isMobile) {
    return (
      <Modal title={title} onClose={onClose}>
        <div className="modal__form task-modal-form">{children}</div>
      </Modal>
    );
  }

  return (
    <SnapBottomSheet
      levels={CALENDAR_SHEET_LEVELS}
      initialLevelId="full"
      resetKey={resetKey ?? title}
      title={title}
      onClose={onClose}
      hasBackdrop
      classPrefix="goal-detail-sheet"
    >
      {() => children}
    </SnapBottomSheet>
  );
}
