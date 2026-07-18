import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { PageSecondaryPanelProvider } from './PageSecondaryPanelContext';
import { Sidebar } from './Sidebar.tsx';
import type { Page } from '../types';

const GOALS_SECONDARY_COLLAPSED_KEY = 'goals-secondary-sidebar-collapsed';

function readGoalsSecondaryCollapsed(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(GOALS_SECONDARY_COLLAPSED_KEY);
  if (stored === null) return true;
  return stored === 'true';
}

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [secondaryPanel, setSecondaryPanel] = useState<ReactNode | null>(null);
  const [goalsSecondaryCollapsed, setGoalsSecondaryCollapsed] = useState(readGoalsSecondaryCollapsed);
  const [railExpanded, setRailExpanded] = useState(false);
  const overRailRef = useRef(false);
  const overLaunchRef = useRef(false);

  const setCollapsed = useCallback((next: boolean) => {
    setGoalsSecondaryCollapsed(next);
    localStorage.setItem(GOALS_SECONDARY_COLLAPSED_KEY, String(next));
  }, []);

  const toggleSecondary = useCallback(() => {
    setCollapsed(!goalsSecondaryCollapsed);
  }, [goalsSecondaryCollapsed, setCollapsed]);

  const secondaryAvailable = currentPage === 'goals' && !!secondaryPanel;
  const secondaryOpen = secondaryAvailable && !goalsSecondaryCollapsed;

  const handleRailEnter = useCallback(() => {
    overRailRef.current = true;
    setRailExpanded(true);
  }, []);

  const handleRailLeave = useCallback(() => {
    overRailRef.current = false;
    // ハンバーガーへ移る瞬間の leave では閉じない
    window.requestAnimationFrame(() => {
      if (!overLaunchRef.current) setRailExpanded(false);
    });
  }, []);

  const handleLaunchEnter = useCallback(() => {
    overLaunchRef.current = true;
    // すでに開いているときだけ維持（閉じた状態からのホバーでは開かない）
    setRailExpanded((prev) => prev || overRailRef.current);
  }, []);

  const handleLaunchLeave = useCallback(() => {
    overLaunchRef.current = false;
    if (!overRailRef.current) setRailExpanded(false);
  }, []);

  return (
    <PageSecondaryPanelProvider setPanel={setSecondaryPanel}>
      <div className="app-shell">
        <div className={`app-shell__sidebars${railExpanded ? ' app-shell__sidebars--rail-expanded' : ''}`}>
          <div
            className="sidebar-rail-hover"
            onMouseEnter={handleRailEnter}
            onMouseLeave={handleRailLeave}
          >
            <Sidebar
              currentPage={currentPage}
              onNavigate={onNavigate}
              rail
            />
          </div>

          {secondaryAvailable && (
            <button
              type="button"
              className={`sidebar-secondary-launch${secondaryOpen ? ' sidebar-secondary-launch--open' : ''}`}
              onClick={toggleSecondary}
              onMouseEnter={handleLaunchEnter}
              onMouseLeave={handleLaunchLeave}
              aria-expanded={secondaryOpen}
              aria-label={secondaryOpen ? '目標パネルを閉じる' : '目標パネルを開く'}
              title={secondaryOpen ? '目標パネルを閉じる' : '目標パネルを開く'}
            >
              {secondaryOpen ? (
                <X size={28} strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu size={28} strokeWidth={1.75} aria-hidden />
              )}
            </button>
          )}

          {secondaryAvailable && (
            <aside
              className={`sidebar-secondary${secondaryOpen ? '' : ' sidebar-secondary--collapsed'}`}
              aria-hidden={!secondaryOpen}
            >
              <div className="sidebar-secondary__inner">
                {secondaryPanel}
              </div>
            </aside>
          )}
        </div>
        <main className="page-content">
          {children}
        </main>
        <BottomNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      </div>
    </PageSecondaryPanelProvider>
  );
}
