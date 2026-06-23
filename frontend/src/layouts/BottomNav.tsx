import { useState } from 'react';
import type { Page, User } from '../types';
import { NAV_ITEMS } from './navItems';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user: User | null;
}

export function BottomNav({ currentPage, onNavigate, onLogout, user }: BottomNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayUserName = user?.user_name || 'ゲスト';
  const avatarChar = displayUserName.charAt(0);

  const handleNavigate = (page: Page) => {
    setIsMenuOpen(false);
    onNavigate(page);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        {NAV_ITEMS.map(({ page, icon, label }) => (
          <button
            key={page}
            type="button"
            className={`bottom-nav__item${currentPage === page ? ' active' : ''}`}
            onClick={() => handleNavigate(page)}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{icon}</span>
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`bottom-nav__item${isMenuOpen ? ' active' : ''}`}
          onClick={() => setIsMenuOpen(true)}
          aria-expanded={isMenuOpen}
          aria-haspopup="dialog"
        >
          <span className="bottom-nav__icon" aria-hidden="true">☰</span>
          <span className="bottom-nav__label">メニュー</span>
        </button>
      </nav>

      {isMenuOpen && (
        <div className="bottom-sheet-root">
          <button
            type="button"
            className="bottom-sheet-backdrop"
            aria-label="メニューを閉じる"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="メニュー">
            <div className="bottom-sheet__handle" aria-hidden="true" />
            <div className="bottom-sheet__header">
              <h2 className="bottom-sheet__title">メニュー</h2>
              <button
                type="button"
                className="bottom-sheet__close"
                aria-label="閉じる"
                onClick={() => setIsMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="bottom-sheet__user">
              <div className="bottom-sheet__avatar">{avatarChar}</div>
              <div className="bottom-sheet__username">{displayUserName}</div>
            </div>
            <button
              type="button"
              className="btn-secondary bottom-sheet__logout"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
    </>
  );
}
