import { createContext, useContext, type ReactNode } from 'react';

interface PageSecondaryPanelContextValue {
  setPanel: (panel: ReactNode | null) => void;
}

const PageSecondaryPanelContext = createContext<PageSecondaryPanelContextValue | null>(null);

export function PageSecondaryPanelProvider({
  children,
  setPanel,
}: {
  children: ReactNode;
  setPanel: (panel: ReactNode | null) => void;
}) {
  return (
    <PageSecondaryPanelContext.Provider value={{ setPanel }}>
      {children}
    </PageSecondaryPanelContext.Provider>
  );
}

export function usePageSecondaryPanel(): PageSecondaryPanelContextValue {
  const context = useContext(PageSecondaryPanelContext);
  if (!context) {
    throw new Error('usePageSecondaryPanel must be used within PageSecondaryPanelProvider');
  }
  return context;
}
