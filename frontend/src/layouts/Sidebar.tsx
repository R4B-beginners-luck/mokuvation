import { Menu, X } from 'lucide-react';
import type { Page } from '../types';
import { BrandMark } from '../components/BrandMark/BrandMark';
import { NAV_ITEMS } from './navItems';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  rail?: boolean;
}

export function Sidebar({
  currentPage,
  onNavigate,
  rail = false,
}: SidebarProps) {
  return (
    <aside className={`sidebar${rail ? ' sidebar--rail' : ''}`}>
      <div className="sidebar__surface">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <BrandMark size={32} />
          </div>
          <span className="sidebar__name">
            moku<span>vation</span>
          </span>
        </div>

        <nav className="sidebar__nav" aria-label="メインナビゲーション">
          {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
            <button
              key={page}
              type="button"
              className={`sidebar__nav-item${currentPage === page ? ' active' : ''}`}
              onClick={() => onNavigate(page)}
              title={label}
              aria-label={label}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              <span className="sidebar__nav-icon">
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="sidebar__nav-label">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
