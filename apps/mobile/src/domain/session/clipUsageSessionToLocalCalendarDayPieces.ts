import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { clipUsageSessionToWindow } from './clipUsageSessionsToWindow';
import { isValidAnalyticsSession } from './isValidAnalyticsSession';
import type { UsageSession } from './UsageSession';

/**
 * Splits one session into analytics pieces at local calendar-day boundaries.
 * Does not mutate the input session.
 */
export function clipUsageSessionToLocalCalendarDayPieces(
  session: UsageSession,
): UsageSession[] {
  if (!isValidAnalyticsSession(session)) {
    return [];
  }

  const pieces: UsageSession[] = [];
  let dayStart = getLocalCalendarDayStart(session.startTime);

  while (dayStart < session.endTime) {
    const dayEnd = getNextLocalCalendarDayStart(dayStart);
    const clipped = clipUsageSessionToWindow(session, dayStart, dayEnd);
    if (clipped != null) {
      pieces.push(clipped);
    }
    dayStart = dayEnd;
  }

  return pieces;
}
