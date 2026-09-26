import { aggregateUsageByApp } from '../../domain/analytics/aggregateUsageByApp';
import type { HistoricalDayDetailModel } from '../models/HistoricalDayDetailModel';
import { HistoricalDayDetailError } from '../historical/HistoricalDayDetailError';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import { getLocalCalendarDayAnalyticsWindow } from '../history/localCalendarDayWindow';
import type { GetHistoricalUsageAnalyticsForRange } from './GetHistoricalUsageAnalyticsForRange';

export type GetHistoricalDayDetailInput = {
  dayStartTimestamp: number;
};

export type GetHistoricalDayDetailDeps = {
  getHistoricalUsageAnalyticsForRange: GetHistoricalUsageAnalyticsForRange;
};

export class GetHistoricalDayDetail {
  constructor(private readonly deps: GetHistoricalDayDetailDeps) {}

  async execute(
    input: GetHistoricalDayDetailInput,
  ): Promise<HistoricalDayDetailModel> {
    let window;
    try {
      window = getLocalCalendarDayAnalyticsWindow(input.dayStartTimestamp);
    } catch (error) {
      throw new HistoricalDayDetailError(
        'INVALID_DAY',
        error instanceof Error ? error.message : 'Invalid day window',
        error,
      );
    }

    let analytics;
    try {
      analytics =
        await this.deps.getHistoricalUsageAnalyticsForRange.execute(window);
    } catch (error) {
      if (error instanceof HistoricalUsageAnalyticsError) {
        if (error.code === 'INVALID_WINDOW') {
          throw new HistoricalDayDetailError(
            'INVALID_DAY',
            error.message,
            error,
          );
        }
        if (error.code === 'SESSION_QUERY_FAILED') {
          throw new HistoricalDayDetailError(
            'SESSION_QUERY_FAILED',
            'Could not read stored usage for this day',
            error,
          );
        }
        if (error.code === 'RULE_QUERY_FAILED') {
          throw new HistoricalDayDetailError(
            'RULE_QUERY_FAILED',
            'Could not load classification rules for this day',
            error,
          );
        }
        throw new HistoricalDayDetailError(
          'ANALYTICS_FAILED',
          'Could not calculate day detail analytics',
          error,
        );
      }
      throw error;
    }

    const apps = aggregateUsageByApp(analytics.effectiveSessions);

    return {
      dayStartTimestamp: window.fromTimestamp,
      dayEndTimestamp: window.toTimestamp,
      trackedDurationMs: analytics.trackedDurationMs,
      lostDurationMs: analytics.lostDurationMs,
      productiveDurationMs: analytics.productiveDurationMs,
      neutralDurationMs: analytics.neutralDurationMs,
      leisureDurationMs: analytics.leisureDurationMs,
      unknownDurationMs: analytics.unknownDurationMs,
      apps,
    };
  }
}
