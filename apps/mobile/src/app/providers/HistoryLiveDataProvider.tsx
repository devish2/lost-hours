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

import { HistoryLiveService } from '../../application/history/HistoryLiveService';
import { HistoryError } from '../../application/history/HistoryError';
import {
  mapHistoryModelToUiState,
  type HistoryUiState,
} from '../../features/history/historyUiState';

type HistoryLiveDataContextValue = {
  uiState: HistoryUiState;
  isRefreshing: boolean;
  refreshHistory: () => void;
  nowTimestamp: number;
};

const HistoryLiveDataContext =
  createContext<HistoryLiveDataContextValue | null>(null);

type HistoryLiveDataProviderProps = {
  children: ReactNode;
  service?: HistoryLiveService;
};

export function HistoryLiveDataProvider({
  children,
  service,
}: HistoryLiveDataProviderProps) {
  const liveService = useMemo(
    () => service ?? new HistoryLiveService(),
    [service],
  );
  const [uiState, setUiState] = useState<HistoryUiState>({ phase: 'loading' });
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
        const { model, nowTimestamp: capturedNow } =
          await liveService.loadHistory();
        if (!isMountedRef.current || generation !== refreshGenerationRef.current) {
          return;
        }
        setNowTimestamp(capturedNow);
        setUiState(mapHistoryModelToUiState(model));
      } catch (error) {
        if (!isMountedRef.current || generation !== refreshGenerationRef.current) {
          return;
        }
        const message =
          error instanceof HistoryError
            ? error.message
            : 'Could not load History';
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

  useEffect(() => {
    runRefresh().catch(() => undefined);
  }, [runRefresh]);

  const value = useMemo(
    () => ({
      uiState,
      isRefreshing,
      refreshHistory: () => {
        runRefresh().catch(() => undefined);
      },
      nowTimestamp,
    }),
    [uiState, isRefreshing, runRefresh, nowTimestamp],
  );

  return (
    <HistoryLiveDataContext.Provider value={value}>
      {children}
    </HistoryLiveDataContext.Provider>
  );
}

export function useHistoryLiveData(): HistoryLiveDataContextValue {
  const context = useContext(HistoryLiveDataContext);
  if (context == null) {
    throw new Error('useHistoryLiveData requires HistoryLiveDataProvider');
  }
  return context;
}
