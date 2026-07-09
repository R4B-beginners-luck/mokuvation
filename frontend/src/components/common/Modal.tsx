import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

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

// ==========================================
// 以下、追記したラッパーコンポーネントとコンテンツ
// ==========================================

interface HelpTermsPrivacyModalsProps {
  type: 'help' | 'terms' | 'privacy' | null;
  onClose: () => void;
}

export function HelpTermsPrivacyModals({ type, onClose }: HelpTermsPrivacyModalsProps) {
  if (!type) return null;

  const modalConfig = {
    help: {
      title: '目標マップのヘルプ',
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

function HelpContent() {
  return (
    <div className="modal-scroll-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div>
        <h4 style={{ color: 'var(--accent-gold)', marginBottom: 'var(--sp-2)' }}>1. 目標マップとは</h4>
        <p style={{ color: 'var(--text-muted)' }}>あなたの人生のゴールや、直近で達成したい目標を視覚的に整理し、行動へ移すためのツールです。</p>
      </div>
      <div>
        <h4 style={{ color: 'var(--accent-gold)', marginBottom: 'var(--sp-2)' }}>2. 基本的な使い方</h4>
        <p style={{ color: 'var(--text-muted)' }}>中央のメイン目標から、それを達成するために必要な要素を周囲に広げていくことで、今やるべき具体的なアクションが見えてきます。</p>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="modal-scroll-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>最終更新日: 2026年7月7日</p>
      <div>
        <h4 style={{ marginBottom: 'var(--sp-2)' }}>第1条（適用）</h4>
        <p style={{ color: 'var(--text-muted)' }}>本規約は、ユーザーと本サービスとの間の利用条件を定めるものです。ユーザーは本サービスを利用することにより、本規約に同意したものとみなされます。</p>
      </div>
      <div>
        <h4 style={{ marginBottom: 'var(--sp-2)' }}>第2条（禁止事項）</h4>
        <p style={{ color: 'var(--text-muted)' }}>ユーザーは、本サービスの利用にあたり、法令または公序良俗に反する行為、ほかのユーザーに不利益を与える行為を行ってはなりません。</p>
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="modal-scroll-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>最終更新日: 2026年7月7日</p>
      <div>
        <h4 style={{ marginBottom: 'var(--sp-2)' }}>1. 個人情報の取得</h4>
        <p style={{ color: 'var(--text-muted)' }}>本サービスは、ユーザーのアカウント登録およびサービスの提供にあたり、必要最低限の個人情報（メールアドレス等）を取得します。</p>
      </div>
      <div>
        <h4 style={{ marginBottom: 'var(--sp-2)' }}>2. 個人情報の利用目的</h4>
        <p style={{ color: 'var(--text-muted)' }}>取得した個人情報は、本サービスの提供・運営、本人確認、およびお問い合わせ対応のためにのみ利用し、法的な要請がある場合を除き第三者に提供することはありません。</p>
      </div>
    </div>
  );
}