import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar.tsx';
import type {  Page  } from '../types';
import type { User } from '../types';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: ReactNode;
  user: User | null;
}

export function Layout({ currentPage, onNavigate, onLogout, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}
