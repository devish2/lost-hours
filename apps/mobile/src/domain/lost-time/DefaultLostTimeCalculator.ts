import { ActivityClassification } from '../classification/ActivityClassification';
import { isValidAnalyticsSession } from '../session/isValidAnalyticsSession';
import type { UsageSession } from '../session/UsageSession';
import type { LostTimeCalculator } from './LostTimeCalculator';
import type { LostTimeSummary } from './LostTimeSummary';

/**
 * MVP Lost Time: sum of `durationMs` for valid sessions classified as WASTE.
 * Ignores sessions with `durationMs <= 0` without throwing or mutating input.
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
