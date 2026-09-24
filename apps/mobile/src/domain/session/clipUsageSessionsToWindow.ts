import type { UsageSession } from './UsageSession';
import { compareUsageSessionsForReadOrder } from './compareUsageSessionsForReadOrder';
import { usageSessionOverlapsWindow } from './usageSessionOverlapsWindow';
import { validateSessionProcessingWindow } from './validateSessionProcessingWindow';

function deriveClippedAnalyticsSessionId(
  session: UsageSession,
  fromTimestamp: number,
  toTimestamp: number,
): string {
  return `${session.id}|clip:${fromTimestamp}:${toTimestamp}`;
}

/**
 * Analytics-only view clipped to [from, to). Does not mutate input sessions.
 * Clipped ids are not storage entities.
 */
export function clipUsageSessionToWindow(
  session: UsageSession,
  fromTimestamp: number,
  toTimestamp: number,
): UsageSession | null {
  if (!usageSessionOverlapsWindow(session, fromTimestamp, toTimestamp)) {
    return null;
  }

  const startTime = Math.max(session.startTime, fromTimestamp);
  const endTime = Math.min(session.endTime, toTimestamp);
  const durationMs = endTime - startTime;
  if (durationMs <= 0) {
    return null;
  }

  return {
    ...session,
    id: deriveClippedAnalyticsSessionId(session, fromTimestamp, toTimestamp),
    app: { ...session.app },
    startTime,
    endTime,
    durationMs,
  };
}

export function clipUsageSessionsToWindow(
  sessions: readonly UsageSession[],
  fromTimestamp: number,
  toTimestamp: number,
): UsageSession[] {
  validateSessionProcessingWindow(fromTimestamp, toTimestamp);
  const clipped = sessions
    .map(session =>
      clipUsageSessionToWindow(session, fromTimestamp, toTimestamp),
    )
    .filter((session): session is UsageSession => session != null);

  return clipped.sort(compareUsageSessionsForReadOrder);
}
