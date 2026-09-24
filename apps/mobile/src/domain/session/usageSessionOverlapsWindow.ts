import type { UsageSession } from './UsageSession';

/**
 * True when session interval [startTime, endTime) overlaps query [from, to).
 * Half-open: touching at a boundary is not overlap.
 */
export function usageSessionOverlapsWindow(
  session: UsageSession,
  fromTimestamp: number,
  toTimestamp: number,
): boolean {
  return session.startTime < toTimestamp && session.endTime > fromTimestamp;
}
