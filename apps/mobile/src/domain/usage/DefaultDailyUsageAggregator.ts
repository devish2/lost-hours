import { ActivityClassification } from '../classification/ActivityClassification';
import { isValidAnalyticsSession } from '../session/isValidAnalyticsSession';
import type { UsageSession } from '../session/UsageSession';
import type { DailyUsageAggregator } from './DailyUsageAggregator';
import type { DailyUsageSummary } from './DailyUsageSummary';

function emptyDailySummary(date: string): DailyUsageSummary {
  return {
    date,
    totalTrackedMs: 0,
    productiveMs: 0,
    neutralMs: 0,
    leisureMs: 0,
    wasteMs: 0,
    unknownMs: 0,
    sessionCount: 0,
    longestSessionMs: 0,
  };
}

/**
 * Aggregates pre-selected sessions for a local calendar date (`YYYY-MM-DD`).
 * Does not filter sessions by timestamp; callers supply date-bound sessions.
 * Ignores sessions with `durationMs <= 0` without throwing or mutating input.
 */
export class DefaultDailyUsageAggregator implements DailyUsageAggregator {
  aggregate(date: string, sessions: readonly UsageSession[]): DailyUsageSummary {
    const summary = emptyDailySummary(date);

    for (const session of sessions) {
      if (!isValidAnalyticsSession(session)) {
        continue;
      }

      summary.totalTrackedMs += session.durationMs;
      summary.sessionCount += 1;
      if (session.durationMs > summary.longestSessionMs) {
        summary.longestSessionMs = session.durationMs;
      }

      switch (session.classification) {
        case ActivityClassification.PRODUCTIVE:
          summary.productiveMs += session.durationMs;
          break;
        case ActivityClassification.NEUTRAL:
          summary.neutralMs += session.durationMs;
          break;
        case ActivityClassification.LEISURE:
          summary.leisureMs += session.durationMs;
          break;
        case ActivityClassification.WASTE:
          summary.wasteMs += session.durationMs;
          break;
        case ActivityClassification.UNKNOWN:
          summary.unknownMs += session.durationMs;
          break;
        default: {
          const _exhaustive: never = session.classification;
          return _exhaustive;
        }
      }
    }

    return summary;
  }
}

export const defaultDailyUsageAggregator = new DefaultDailyUsageAggregator();
