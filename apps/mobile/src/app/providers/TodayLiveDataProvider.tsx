import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { TodayLiveDashboardService } from '../../application/today/TodayLiveDashboardService';
import { TodayDashboardRefreshError } from '../../application/today/TodayDashboardRefreshError';
import type { TodayUiState } from '../../features/dashboard/todayUiState';
import { mapRefreshResultToUiState } from '../../features/dashboard/todayUiState';
import { useUsageTrackingComposition } from './UsageTrackingContext';

type TodayLiveDataContextValue = {
  uiState: TodayUiState;
  isRefreshing: boolean;
  refreshToday: () => void;
  openUsageAccessSettings: () => void;
};

const TodayLiveDataContext = createContext<TodayLiveDataContextValue | null>(
  null,
);

type TodayLiveDataProviderProps = {
  children: ReactNode;
  service?: TodayLiveDashboardService;
};

export function TodayLiveDataProvider({
  children,
  service,
}: TodayLiveDataProviderProps) {
  const composition = useUsageTrackingComposition();
  const liveService = useMemo(
    () => service ?? new TodayLiveDashboardService({ composition }),
    [composition, service],
  );

  const [uiState, setUiState] = useState<TodayUiState>({ phase: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshGenerationRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runRefresh = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const generation = ++refreshGenerationRef.current;
    setIsRefreshing(true);
    if (generation === refreshGenerationRef.current) {
      setUiState({ phase: 'loading' });
    }

    const task = (async () => {
      try {
        const result = await liveService.refreshToday();
        if (!isMountedRef.current || generation !== refreshGenerationRef.current) {
          return;
        }
        setUiState(mapRefreshResultToUiState(result));
      } catch (error) {
        if (!isMountedRef.current || generation !== refreshGenerationRef.current) {
          return;
        }
        if (error instanceof TodayDashboardRefreshError) {
          if (error.code === 'PERMISSION_REQUIRED') {
            setUiState({
              phase: 'permission_required',
              message: error.message,
            });
            return;
          }
          if (error.code === 'TRACKING_UNAVAILABLE') {
            setUiState({
              phase: 'tracking_unavailable',
              message: error.message,
            });
            return;
          }
        }
        const message =
          error instanceof Error ? error.message : 'Could not load Today';
        setUiState({ phase: 'error', message });
      } finally {
        if (isMountedRef.current && generation === refreshGenerationRef.current) {
          setIsRefreshing(false);
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = task;
    return task;
  }, [liveService]);

  const refreshToday = useCallback(() => {
    runRefresh().catch(() => {});
  }, [runRefresh]);

  const openUsageAccessSettings = useCallback(() => {
    liveService.openUsageAccessSettings().catch(error => {
      if (!isMountedRef.current) {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : 'Could not open Usage Access settings';
      setUiState({ phase: 'error', message });
    });
  }, [liveService]);

  const value = useMemo(
    () => ({
      uiState,
      isRefreshing,
      refreshToday,
      openUsageAccessSettings,
    }),
    [uiState, isRefreshing, refreshToday, openUsageAccessSettings],
  );

  return (
    <TodayLiveDataContext.Provider value={value}>
      {children}
    </TodayLiveDataContext.Provider>
  );
}

export function useTodayLiveData(): TodayLiveDataContextValue {
  const value = useContext(TodayLiveDataContext);
  if (value == null) {
    throw new Error('useTodayLiveData must be used within TodayLiveDataProvider');
  }
  return value;
}
