import type { Page } from '../types';
import { NAV_ITEMS } from './navItems';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
        <button
          key={page}
          type="button"
          className={`bottom-nav__item${currentPage === page ? ' active' : ''}`}
          onClick={() => onNavigate(page)}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} aria-hidden />
          </span>
          <span className="bottom-nav__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
