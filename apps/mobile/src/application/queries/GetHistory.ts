import type { HistoricalDailyAnalyticsItem } from '../../domain/analytics/HistoricalDailyAnalyticsItem';
import type { BaselineProgress } from '../../domain/baseline/BaselineProgress';
import type { HistoryDayItem, HistoryModel } from '../models/HistoryModel';
import { BaselineProgressError } from '../baseline/BaselineProgressError';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import { HistoryError } from '../history/HistoryError';
import {
  DEFAULT_HISTORY_LOCAL_CALENDAR_DAYS,
  getRecentLocalCalendarHistoryWindow,
} from '../history/recentLocalCalendarHistoryWindow';
import type { GetBaselineProgress } from './GetBaselineProgress';
import type { GetHistoricalDailyAnalyticsForRange } from './GetHistoricalDailyAnalyticsForRange';

export type GetHistoryInput = {
  nowTimestamp: number;
  numberOfLocalCalendarDays?: number;
};

export type GetHistoryDeps = {
  getHistoricalDailyAnalyticsForRange: GetHistoricalDailyAnalyticsForRange;
  getBaselineProgress: GetBaselineProgress;
};

function toHistoryDayItem(day: HistoricalDailyAnalyticsItem): HistoryDayItem {
  return {
    dayStartTimestamp: day.dayStartTimestamp,
    dayEndTimestamp: day.dayEndTimestamp,
    trackedDurationMs: day.trackedDurationMs,
    lostDurationMs: day.lostDurationMs,
    productiveDurationMs: day.productiveDurationMs,
    neutralDurationMs: day.neutralDurationMs,
    leisureDurationMs: day.leisureDurationMs,
    unknownDurationMs: day.unknownDurationMs,
  };
}

function newestFirstDays(
  daysAscending: readonly HistoricalDailyAnalyticsItem[],
): HistoryDayItem[] {
  return [...daysAscending].reverse().map(toHistoryDayItem);
}

/**
 * History read model: recent local-calendar daily analytics + full-history baseline.
 */
export class GetHistory {
  constructor(private readonly deps: GetHistoryDeps) {}

  async execute(input: GetHistoryInput): Promise<HistoryModel> {
    const numberOfLocalCalendarDays =
      input.numberOfLocalCalendarDays ?? DEFAULT_HISTORY_LOCAL_CALENDAR_DAYS;

    let window;
    try {
      window = getRecentLocalCalendarHistoryWindow(
        input.nowTimestamp,
        numberOfLocalCalendarDays,
      );
    } catch (error) {
      throw new HistoryError(
        'INVALID_WINDOW',
        error instanceof Error ? error.message : 'Invalid history window',
        error,
      );
    }

    let baseline: BaselineProgress;
    try {
      baseline = await this.deps.getBaselineProgress.execute();
    } catch (error) {
      if (error instanceof BaselineProgressError) {
        throw new HistoryError(
          'BASELINE_QUERY_FAILED',
          'Could not load baseline progress for History',
          error,
        );
      }
      throw error;
    }

    let dailyAscending: readonly HistoricalDailyAnalyticsItem[];
    try {
      dailyAscending =
        await this.deps.getHistoricalDailyAnalyticsForRange.execute(window);
    } catch (error) {
      if (error instanceof HistoricalUsageAnalyticsError) {
        throw new HistoryError(
          'HISTORICAL_QUERY_FAILED',
          'Could not load historical daily analytics for History',
          error,
        );
      }
      throw error;
    }

    return {
      fromTimestamp: window.fromTimestamp,
      toTimestamp: window.toTimestamp,
      baseline,
      days: newestFirstDays(dailyAscending),
    };
  }
}
