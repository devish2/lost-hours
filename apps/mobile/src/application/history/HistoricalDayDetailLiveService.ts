import type { HistoricalDayDetailModel } from '../models/HistoricalDayDetailModel';
import { getAppStorage } from '../../infrastructure/storage/getAppStorage';
import { createGetHistoricalDayDetail } from '../../infrastructure/storage/createGetHistoricalDayDetail';
import { HistoricalDayDetailError } from '../historical/HistoricalDayDetailError';
import type { GetHistoricalDayDetailInput } from '../queries/GetHistoricalDayDetail';

export type HistoricalDayDetailLiveServiceDeps = {
  getStorage?: typeof getAppStorage;
};

/** Loads Day Detail from persisted SQLite analytics (no UsageStats sync). */
export class HistoricalDayDetailLiveService {
  private readonly getStorage: typeof getAppStorage;

  constructor(deps: HistoricalDayDetailLiveServiceDeps = {}) {
    this.getStorage = deps.getStorage ?? getAppStorage;
  }

  async loadDayDetail(
    input: GetHistoricalDayDetailInput,
  ): Promise<HistoricalDayDetailModel> {
    let storage;
    try {
      storage = await this.getStorage();
    } catch (error) {
      throw new HistoricalDayDetailError(
        'SESSION_QUERY_FAILED',
        'Local storage is unavailable',
        error,
      );
    }

    const getDayDetail = createGetHistoricalDayDetail(storage.repositories);
    try {
      return await getDayDetail.execute(input);
    } catch (error) {
      if (error instanceof HistoricalDayDetailError) {
        throw error;
      }
      throw new HistoricalDayDetailError(
        'ANALYTICS_FAILED',
        'Could not load day detail',
        error,
      );
    }
  }
}
