import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import type { HistoricalAnalyticsWindow } from '../historical/HistoricalAnalyticsWindow';

/** Half-open local calendar day window `[dayStart, dayEnd)`. */
export function getLocalCalendarDayAnalyticsWindow(
  dayStartTimestamp: number,
): HistoricalAnalyticsWindow {
  if (!Number.isFinite(dayStartTimestamp)) {
    throw new Error(
      `Invalid day window: dayStartTimestamp must be finite (got ${dayStartTimestamp})`,
    );
  }

  const dayStart = getLocalCalendarDayStart(dayStartTimestamp);
  const dayEnd = getNextLocalCalendarDayStart(dayStart);

  return {
    fromTimestamp: dayStart,
    toTimestamp: dayEnd,
  };
}
