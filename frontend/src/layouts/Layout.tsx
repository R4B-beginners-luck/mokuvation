import { useCallback, useState, type ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { PageSecondaryPanelProvider } from './PageSecondaryPanelContext';
import { Sidebar } from './Sidebar.tsx';
import type { Page } from '../types';

const GOALS_SECONDARY_COLLAPSED_KEY = 'goals-secondary-sidebar-collapsed';

function readGoalsSecondaryCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(GOALS_SECONDARY_COLLAPSED_KEY) === 'true';
}

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [secondaryPanel, setSecondaryPanel] = useState<ReactNode | null>(null);
  const [goalsSecondaryCollapsed, setGoalsSecondaryCollapsed] = useState(readGoalsSecondaryCollapsed);

  const handleNavigate = useCallback((page: Page) => {
    if (page === 'goals' && currentPage === 'goals') {
      setGoalsSecondaryCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem(GOALS_SECONDARY_COLLAPSED_KEY, String(next));
        return next;
      });
      return;
    }

    onNavigate(page);
  }, [currentPage, onNavigate]);

  return (
    <PageSecondaryPanelProvider setPanel={setSecondaryPanel}>
      <div className="app-shell">
        <div className="app-shell__sidebars">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            rail
          />
          {currentPage === 'goals' && secondaryPanel && (
            <aside
              className={`sidebar-secondary${goalsSecondaryCollapsed ? ' sidebar-secondary--collapsed' : ''}`}
              aria-hidden={goalsSecondaryCollapsed}
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
