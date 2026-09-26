import type { HistoryModel } from '../models/HistoryModel';
import type { Clock } from '../../shared/time/Clock';
import { systemClock } from '../../shared/time/Clock';
import { getAppStorage } from '../../infrastructure/storage/getAppStorage';
import { createGetHistory } from '../../infrastructure/storage/createGetHistory';
import { HistoryError } from './HistoryError';
import type { GetHistoryInput } from '../queries/GetHistory';

export type HistoryLiveServiceDeps = {
  clock?: Clock;
  getStorage?: typeof getAppStorage;
};

/** Loads History from persisted SQLite analytics (no UsageStats sync). */
export class HistoryLiveService {
  private readonly clock: Clock;
  private readonly getStorage: typeof getAppStorage;

  constructor(deps: HistoryLiveServiceDeps = {}) {
    this.clock = deps.clock ?? systemClock;
    this.getStorage = deps.getStorage ?? getAppStorage;
  }

  async loadHistory(
    input: Omit<GetHistoryInput, 'nowTimestamp'> & {
      nowTimestamp?: number;
    } = {},
  ): Promise<{ model: HistoryModel; nowTimestamp: number }> {
    const nowTimestamp = input.nowTimestamp ?? this.clock.now();

    let storage;
    try {
      storage = await this.getStorage();
    } catch (error) {
      throw new HistoryError(
        'BASELINE_QUERY_FAILED',
        'Local storage is unavailable',
        error,
      );
    }

    const getHistory = createGetHistory(storage.repositories);
    try {
      const model = await getHistory.execute({
        nowTimestamp,
        numberOfLocalCalendarDays: input.numberOfLocalCalendarDays,
      });
      return { model, nowTimestamp };
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError(
        'HISTORICAL_QUERY_FAILED',
        'Could not load History',
        error,
      );
    }
  }
}
