import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

type LeaveProceed = () => void;

export type GoalsLeaveGuardApi = {
  hasUnsavedChanges: () => boolean;
  requestLeave: (proceed: LeaveProceed) => void;
};

type GoalsLeaveGuardContextValue = {
  register: (api: GoalsLeaveGuardApi | null) => void;
  requestLeave: (proceed: LeaveProceed) => void;
};

const GoalsLeaveGuardContext = createContext<GoalsLeaveGuardContextValue | null>(null);

export function GoalsLeaveGuardProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<GoalsLeaveGuardApi | null>(null);

  const register = useCallback((api: GoalsLeaveGuardApi | null) => {
    apiRef.current = api;
  }, []);

  const requestLeave = useCallback((proceed: LeaveProceed) => {
    const api = apiRef.current;
    if (!api?.hasUnsavedChanges()) {
      proceed();
      return;
    }
    api.requestLeave(proceed);
  }, []);

  const value = useMemo(
    () => ({ register, requestLeave }),
    [register, requestLeave],
  );

  return (
    <GoalsLeaveGuardContext.Provider value={value}>
      {children}
    </GoalsLeaveGuardContext.Provider>
  );
}

export function useGoalsLeaveGuardRegistrar(): GoalsLeaveGuardContextValue['register'] {
  const context = useContext(GoalsLeaveGuardContext);
  if (!context) {
    throw new Error('useGoalsLeaveGuardRegistrar must be used within GoalsLeaveGuardProvider');
  }
  return context.register;
}

export function useGoalsLeaveRequest(): GoalsLeaveGuardContextValue['requestLeave'] {
  const context = useContext(GoalsLeaveGuardContext);
  if (!context) {
    throw new Error('useGoalsLeaveRequest must be used within GoalsLeaveGuardProvider');
  }
  return context.requestLeave;
}
