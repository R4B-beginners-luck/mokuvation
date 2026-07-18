import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { HelpContent, TermsContent, PrivacyContent } from './ModalContents';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** ダークテーマ共通モーダル（設定のヘルプ／規約／ポリシーでも使用） */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal aria-labelledby="modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="閉じる">
            <X size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface HelpTermsPrivacyModalsProps {
  type: 'help' | 'terms' | 'privacy' | null;
  onClose: () => void;
}

export function HelpTermsPrivacyModals({ type, onClose }: HelpTermsPrivacyModalsProps) {
  if (!type) return null;

  const modalConfig = {
    help: {
      title: 'ヘルプ',
      children: <HelpContent />,
    },
    terms: {
      title: '利用規約',
      children: <TermsContent />,
    },
    privacy: {
      title: 'プライバシーポリシー',
      children: <PrivacyContent />,
    },
  };

  const currentModal = modalConfig[type];

  return (
    <Modal title={currentModal.title} onClose={onClose}>
      {currentModal.children}
    </Modal>
  );
}
