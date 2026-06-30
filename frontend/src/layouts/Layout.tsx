import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type {  Page, User  } from '../types';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user: User | null;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, onLogout, user, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={user}
      />
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}
