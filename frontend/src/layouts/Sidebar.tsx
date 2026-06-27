import type { Page, User } from '../types'; // 🌟 User 型をインポート

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user: User | null; // ─── 🌟 1. ここに user を追加！
}

const NAV_ITEMS: { page: Page; icon: string; label: string }[] = [
  { page: 'top',      icon: '⚡',  label: 'Today' },
  { page: 'calendar', icon: '📅',  label: 'カレンダー' },
  { page: 'goals',    icon: '🗺️',  label: '目標マップ' },
];

// ─── 🌟 2. 引数（Destructuring）にも user をしっかり追加！
export function Sidebar({ currentPage, onNavigate, onLogout, user }: SidebarProps) {
  const displayUserName =
    typeof user?.user_name === 'string' && user.user_name.trim()
      ? user.user_name.trim()
      : 'ゲスト';
  const avatarChar = [...displayUserName][0] ?? '?';

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
          {/* ─── 🌟 4. 「田」固定をやめて、名前の最初の1文字を自動表示！ ─── */}
          <div className="sidebar__avatar">{avatarChar}</div>
          <div>
            {/* ─── 🌟 5. 「田中 一郎」固定をやめて、ログインユーザー名を表示！ ─── */}
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