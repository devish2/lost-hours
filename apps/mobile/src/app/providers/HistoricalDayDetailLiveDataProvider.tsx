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

import { HistoricalDayDetailLiveService } from '../../application/history/HistoricalDayDetailLiveService';
import { HistoricalDayDetailError } from '../../application/historical/HistoricalDayDetailError';
import {
  mapHistoricalDayDetailModelToUiState,
  type HistoricalDayDetailUiState,
} from '../../features/history/historicalDayDetailUiState';

type HistoricalDayDetailLiveDataContextValue = {
  uiState: HistoricalDayDetailUiState;
  isRefreshing: boolean;
  refreshDayDetail: () => void;
  nowTimestamp: number;
};

const HistoricalDayDetailLiveDataContext =
  createContext<HistoricalDayDetailLiveDataContextValue | null>(null);

type HistoricalDayDetailLiveDataProviderProps = {
  children: ReactNode;
  dayStartTimestamp: number;
  service?: HistoricalDayDetailLiveService;
};

export function HistoricalDayDetailLiveDataProvider({
  children,
  dayStartTimestamp,
  service,
}: HistoricalDayDetailLiveDataProviderProps) {
  const liveService = useMemo(
    () => service ?? new HistoricalDayDetailLiveService(),
    [service],
  );
  const [uiState, setUiState] = useState<HistoricalDayDetailUiState>({
    phase: 'loading',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
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
        const capturedNow = Date.now();
        const model = await liveService.loadDayDetail({ dayStartTimestamp });
        if (!isMountedRef.current || generation !== refreshGenerationRef.current) {
          return;
        }
        setNowTimestamp(capturedNow);
        setUiState(mapHistoricalDayDetailModelToUiState(model));
      } catch (error) {
        if (!isMountedRef.current || generation !== refreshGenerationRef.current) {
          return;
        }
        const message =
          error instanceof HistoricalDayDetailError
            ? error.message
            : 'Could not load day detail';
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
  }, [dayStartTimestamp, liveService]);

  useEffect(() => {
    runRefresh().catch(() => undefined);
  }, [runRefresh]);

  const value = useMemo(
    () => ({
      uiState,
      isRefreshing,
      refreshDayDetail: () => {
        runRefresh().catch(() => undefined);
      },
      nowTimestamp,
    }),
    [uiState, isRefreshing, runRefresh, nowTimestamp],
  );

  return (
    <HistoricalDayDetailLiveDataContext.Provider value={value}>
      {children}
    </HistoricalDayDetailLiveDataContext.Provider>
  );
}

export function useHistoricalDayDetailLiveData(): HistoricalDayDetailLiveDataContextValue {
  const context = useContext(HistoricalDayDetailLiveDataContext);
  if (context == null) {
    throw new Error(
      'useHistoricalDayDetailLiveData requires HistoricalDayDetailLiveDataProvider',
    );
  }
  return context;
}
