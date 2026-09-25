import { ActivityClassification } from '../classification/ActivityClassification';
import { isValidAnalyticsSession } from '../session/isValidAnalyticsSession';
import type { UsageSession } from '../session/UsageSession';
import type { LostTimeCalculator } from './LostTimeCalculator';
import type { LostTimeSummary } from './LostTimeSummary';

/**
 * Lost Time V1: sum of `durationMs` for valid effective sessions classified WASTE.
 * Input sessions must already be clipped to the analytics window; this type does
 * not load rules, access SQLite, or dedupe overlapping wall-clock time.
 * Ignores `durationMs <= 0` without throwing or mutating input.
 */
export class DefaultLostTimeCalculator implements LostTimeCalculator {
  calculate(sessions: readonly UsageSession[]): LostTimeSummary {
    let totalLostMs = 0;
    let sessionCount = 0;
    const byPlatform: LostTimeSummary['byPlatform'] = {};
    const byContentType: LostTimeSummary['byContentType'] = {};

    for (const session of sessions) {
      if (!isValidAnalyticsSession(session)) {
        continue;
      }
      if (session.classification !== ActivityClassification.WASTE) {
        continue;
      }

      totalLostMs += session.durationMs;
      sessionCount += 1;
      byPlatform[session.platform] =
        (byPlatform[session.platform] ?? 0) + session.durationMs;
      byContentType[session.contentType] =
        (byContentType[session.contentType] ?? 0) + session.durationMs;
    }

    return {
      totalLostMs,
      sessionCount,
      byPlatform,
      byContentType,
    };
  }
}

export const defaultLostTimeCalculator = new DefaultLostTimeCalculator();
