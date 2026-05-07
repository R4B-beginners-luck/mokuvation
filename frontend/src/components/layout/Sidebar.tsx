import type { Page } from '../../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { page: Page; icon: string; label: string }[] = [
  { page: 'top',      icon: '⚡',  label: 'Today' },
  { page: 'calendar', icon: '📅',  label: 'カレンダー' },
  { page: 'goals',    icon: '🗺️',  label: '目標マップ' },
];

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">M</div>
        <span className="sidebar__name">
          moku<span>vation</span>
        </span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ page, icon, label }) => (
          <button
            key={page}
            className={`sidebar__nav-item${currentPage === page ? ' active' : ''}`}
            onClick={() => onNavigate(page)}
          >
            <span className="sidebar__nav-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">田</div>
          <div>
            <div className="sidebar__username">田中 一郎</div>
            <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 11 }} onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
