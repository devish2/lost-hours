import { getLocalCalendarDateString } from '../../shared/time/localCalendarDay';
import { clipUsageSessionToLocalCalendarDayPieces } from '../session/clipUsageSessionToLocalCalendarDayPieces';
import type { UsageSession } from '../session/UsageSession';

/**
 * Distinct local calendar dates (`YYYY-MM-DD`) with positive tracked overlap.
 * A session crossing midnight contributes to each local day it overlaps (via clip).
 */
export function collectObservedLocalCalendarDates(
  sessions: readonly UsageSession[],
): string[] {
  const dates = new Set<string>();

  for (const session of sessions) {
    for (const piece of clipUsageSessionToLocalCalendarDayPieces(session)) {
      dates.add(getLocalCalendarDateString(piece.startTime));
    }
  }

  return [...dates].sort();
}
