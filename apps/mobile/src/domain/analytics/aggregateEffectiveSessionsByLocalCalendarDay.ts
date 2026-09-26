import type { HistoricalDailyAnalyticsItem } from './HistoricalDailyAnalyticsItem';
import {
  getLocalCalendarDateString,
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { DefaultLostTimeCalculator } from '../lost-time/DefaultLostTimeCalculator';
import type { LostTimeCalculator } from '../lost-time/LostTimeCalculator';
import { clipUsageSessionToLocalCalendarDayPieces } from '../session/clipUsageSessionToLocalCalendarDayPieces';
import type { UsageSession } from '../session/UsageSession';
import { DefaultDailyUsageAggregator } from '../usage/DefaultDailyUsageAggregator';
import type { DailyUsageAggregator } from '../usage/DailyUsageAggregator';

export type AggregateEffectiveSessionsByLocalCalendarDayDeps = {
  dailyUsageAggregator?: DailyUsageAggregator;
  lostTimeCalculator?: LostTimeCalculator;
};

/**
 * Groups effective sessions by device-local calendar day (midnight splits).
 * Omits days with no valid tracked usage (no zero-evidence fabrication).
 */
export function aggregateEffectiveSessionsByLocalCalendarDay(
  sessions: readonly UsageSession[],
  deps: AggregateEffectiveSessionsByLocalCalendarDayDeps = {},
): HistoricalDailyAnalyticsItem[] {
  const dailyUsageAggregator =
    deps.dailyUsageAggregator ?? new DefaultDailyUsageAggregator();
  const lostTimeCalculator =
    deps.lostTimeCalculator ?? new DefaultLostTimeCalculator();

  const byDayStart = new Map<number, UsageSession[]>();

  for (const session of sessions) {
    for (const piece of clipUsageSessionToLocalCalendarDayPieces(session)) {
      const dayStart = getLocalCalendarDayStart(piece.startTime);
      const existing = byDayStart.get(dayStart);
      if (existing == null) {
        byDayStart.set(dayStart, [piece]);
      } else {
        existing.push(piece);
      }
    }
  }

  const dayStarts = [...byDayStart.keys()].sort((a, b) => a - b);

  return dayStarts.map(dayStart => {
    const daySessions = byDayStart.get(dayStart)!;
    const dayEnd = getNextLocalCalendarDayStart(dayStart);
    const aggregateDateKey = getLocalCalendarDateString(dayStart);
    const daily = dailyUsageAggregator.aggregate(aggregateDateKey, daySessions);
    const lost = lostTimeCalculator.calculate(daySessions);

    return {
      dayStartTimestamp: dayStart,
      dayEndTimestamp: dayEnd,
      trackedDurationMs: daily.totalTrackedMs,
      lostDurationMs: lost.totalLostMs,
      productiveDurationMs: daily.productiveMs,
      neutralDurationMs: daily.neutralMs,
      leisureDurationMs: daily.leisureMs,
      unknownDurationMs: daily.unknownMs,
    };
  });
}
