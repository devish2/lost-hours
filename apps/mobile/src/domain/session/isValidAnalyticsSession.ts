import type { UsageSession } from './UsageSession';

/** Sessions with non-positive duration are excluded from analytics aggregation. */
export function isValidAnalyticsSession(session: UsageSession): boolean {
  return session.durationMs > 0;
}
