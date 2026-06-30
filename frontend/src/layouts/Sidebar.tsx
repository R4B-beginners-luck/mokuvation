import { Zap, Calendar, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page, User } from '../types';
import { BrandMark } from '../components/BrandMark/BrandMark';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user: User | null;
}

const NAV_ITEMS: { page: Page; icon: LucideIcon; label: string }[] = [
  { page: 'top',      icon: Zap,      label: 'Today' },
  { page: 'calendar', icon: Calendar, label: 'カレンダー' },
  { page: 'goals',    icon: Map,      label: '目標マップ' },
];
export function Sidebar({ currentPage, onNavigate, onLogout, user }: SidebarProps) {
  const displayUserName =
    typeof user?.user_name === 'string' && user.user_name.trim()
      ? user.user_name.trim()
      : 'ゲスト';
  const avatarChar = [...displayUserName][0] ?? '?';

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <BrandMark size={32} />
        </div>
        <span className="sidebar__name">
          moku<span>vation</span>
        </span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            className={`sidebar__nav-item${currentPage === page ? ' active' : ''}`}
            onClick={() => onNavigate(page)}
          >
            <span className="sidebar__nav-icon">
              <Icon size={18} strokeWidth={1.75} aria-hidden />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{avatarChar}</div>
          <div>
            <div className="sidebar__username">{displayUserName}</div>
            <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 11 }} onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
