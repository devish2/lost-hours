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

import type { ExplicitActivityClassification } from '../../domain/classification/appUserClassificationRule';
import { TodayLiveDashboardService } from '../../application/today/TodayLiveDashboardService';
import { TodayClassificationMutationError } from '../../application/today/TodayAppClassificationActions';
import { TodayDashboardRefreshError } from '../../application/today/TodayDashboardRefreshError';
import type { TodayUiState } from '../../features/dashboard/todayUiState';
import { mapRefreshResultToUiState } from '../../features/dashboard/todayUiState';
import { useUsageTrackingComposition } from './UsageTrackingContext';

type TodayLiveDataContextValue = {
  uiState: TodayUiState;
  isRefreshing: boolean;
  refreshToday: () => void;
  openUsageAccessSettings: () => void;
  getExplicitAppClassification: (
    packageName: string,
  ) => Promise<ExplicitActivityClassification | null>;
  setAppClassification: (
    packageName: string,
    classification: ExplicitActivityClassification,
  ) => Promise<boolean>;
  clearAppClassification: (packageName: string) => Promise<boolean>;
  classifyingPackageName: string | null;
  classificationMutationError: string | null;
  clearClassificationMutationError: () => void;
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
  const [classifyingPackageName, setClassifyingPackageName] = useState<
    string | null
  >(null);
  const [classificationMutationError, setClassificationMutationError] =
    useState<string | null>(null);
  const refreshGenerationRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const classificationInFlightByPackageRef = useRef(
    new Map<string, Promise<boolean>>(),
  );
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

  const applyRefreshResult = useCallback(
    (result: Awaited<ReturnType<TodayLiveDashboardService['refreshToday']>>) => {
      setUiState(mapRefreshResultToUiState(result));
    },
    [],
  );

  const getExplicitAppClassification = useCallback(
    (packageName: string) => liveService.getExplicitAppClassification(packageName),
    [liveService],
  );

  const runPackageClassificationMutation = useCallback(
    async (
      packageName: string,
      mutate: () => Promise<
        Awaited<ReturnType<TodayLiveDashboardService['refreshToday']>>
      >,
    ): Promise<boolean> => {
      const inflight = classificationInFlightByPackageRef.current.get(packageName);
      if (inflight != null) {
        return inflight;
      }

      const task = (async (): Promise<boolean> => {
        setClassificationMutationError(null);
        setClassifyingPackageName(packageName);
        try {
          const result = await mutate();
          if (!isMountedRef.current) {
            return false;
          }
          applyRefreshResult(result);
          return true;
        } catch (error) {
          if (!isMountedRef.current) {
            return false;
          }
          const message =
            error instanceof TodayClassificationMutationError
              ? error.message
              : error instanceof Error
                ? error.message
                : 'Could not update classification';
          setClassificationMutationError(message);
          return false;
        } finally {
          if (isMountedRef.current) {
            setClassifyingPackageName(null);
          }
          classificationInFlightByPackageRef.current.delete(packageName);
        }
      })();

      classificationInFlightByPackageRef.current.set(packageName, task);
      return task;
    },
    [applyRefreshResult],
  );

  const setAppClassification = useCallback(
    async (packageName: string, classification: ExplicitActivityClassification) =>
      runPackageClassificationMutation(packageName, () =>
        liveService.setClassification(packageName, classification),
      ),
    [liveService, runPackageClassificationMutation],
  );

  const clearAppClassification = useCallback(
    async (packageName: string) =>
      runPackageClassificationMutation(packageName, () =>
        liveService.clearClassification(packageName),
      ),
    [liveService, runPackageClassificationMutation],
  );

  const clearClassificationMutationError = useCallback(() => {
    setClassificationMutationError(null);
  }, []);

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
      getExplicitAppClassification,
      setAppClassification,
      clearAppClassification,
      classifyingPackageName,
      classificationMutationError,
      clearClassificationMutationError,
    }),
    [
      uiState,
      isRefreshing,
      refreshToday,
      openUsageAccessSettings,
      getExplicitAppClassification,
      setAppClassification,
      clearAppClassification,
      classifyingPackageName,
      classificationMutationError,
      clearClassificationMutationError,
    ],
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
