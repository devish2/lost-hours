import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createUsageTrackingComposition } from '../../infrastructure/tracking/createUsageTrackingComposition';
import type { UsageTrackingComposition } from '../../infrastructure/tracking/UsageTrackingComposition';

const UsageTrackingContext = createContext<UsageTrackingComposition | null>(
  null,
);

type UsageTrackingProviderProps = {
  children: ReactNode;
  /** Test override; production uses {@link createUsageTrackingComposition}. */
  composition?: UsageTrackingComposition;
};

export function UsageTrackingProvider({
  children,
  composition,
}: UsageTrackingProviderProps) {
  const value = useMemo(
    () => composition ?? createUsageTrackingComposition(),
    [composition],
  );

  return (
    <UsageTrackingContext.Provider value={value}>
      {children}
    </UsageTrackingContext.Provider>
  );
}

export function useUsageTrackingComposition(): UsageTrackingComposition {
  const value = useContext(UsageTrackingContext);
  if (value == null) {
    throw new Error(
      'useUsageTrackingComposition must be used within UsageTrackingProvider',
    );
  }
  return value;
}
