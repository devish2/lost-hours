import { aggregateEffectiveSessionsByLocalCalendarDay } from '../../domain/analytics/aggregateEffectiveSessionsByLocalCalendarDay';
import type { HistoricalDailyAnalyticsItem } from '../../domain/analytics/HistoricalDailyAnalyticsItem';
import type { HistoricalAnalyticsWindow } from '../historical/HistoricalAnalyticsWindow';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import type { GetHistoricalUsageAnalyticsForRange } from './GetHistoricalUsageAnalyticsForRange';

export type GetHistoricalDailyAnalyticsForRangeDeps = {
  getHistoricalUsageAnalyticsForRange: GetHistoricalUsageAnalyticsForRange;
};

/**
 * Read-only daily historical analytics (no sync). Reuses D4.2 range pipeline.
 */
export class GetHistoricalDailyAnalyticsForRange {
  constructor(private readonly deps: GetHistoricalDailyAnalyticsForRangeDeps) {}

  async execute(
    window: HistoricalAnalyticsWindow,
  ): Promise<readonly HistoricalDailyAnalyticsItem[]> {
    let rangeAnalytics;
    try {
      rangeAnalytics =
        await this.deps.getHistoricalUsageAnalyticsForRange.execute(window);
    } catch (error) {
      if (error instanceof HistoricalUsageAnalyticsError) {
        throw error;
      }
      throw new HistoricalUsageAnalyticsError(
        'ANALYTICS_FAILED',
        'Could not load historical range analytics for daily aggregation',
        error,
      );
    }

    try {
      return aggregateEffectiveSessionsByLocalCalendarDay(
        rangeAnalytics.effectiveSessions,
      );
    } catch (error) {
      throw new HistoricalUsageAnalyticsError(
        'ANALYTICS_FAILED',
        'Could not aggregate historical usage by local calendar day',
        error,
      );
    }
  }
}
