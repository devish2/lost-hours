import type { UsageSession } from '../session/UsageSession';
import { isValidAnalyticsSession } from '../session/isValidAnalyticsSession';
import type { BaselineProgress } from './BaselineProgress';
import {
  defaultBaselineReadinessConfig,
  validateBaselineReadinessConfig,
  type BaselineReadinessConfig,
} from './baselineReadinessConfig';
import { collectObservedLocalCalendarDates } from './collectObservedLocalCalendarDates';

/**
 * Pure baseline readiness from valid session evidence (no install age, no SQLite).
 */
export function computeBaselineProgress(
  sessions: readonly UsageSession[],
  config: BaselineReadinessConfig = defaultBaselineReadinessConfig,
): BaselineProgress {
  validateBaselineReadinessConfig(config);

  const observedDates = collectObservedLocalCalendarDates(sessions);
  const observedCalendarDays = observedDates.length;

  let trackedDurationMs = 0;
  let firstObservedAt: number | undefined;
  let lastObservedAt: number | undefined;

  for (const session of sessions) {
    if (!isValidAnalyticsSession(session)) {
      continue;
    }
    trackedDurationMs += session.durationMs;
    if (firstObservedAt === undefined || session.startTime < firstObservedAt) {
      firstObservedAt = session.startTime;
    }
    if (lastObservedAt === undefined || session.endTime > lastObservedAt) {
      lastObservedAt = session.endTime;
    }
  }

  const status =
    observedCalendarDays >= config.targetCalendarDays ? 'READY' : 'COLLECTING';

  return {
    status,
    observedCalendarDays,
    targetCalendarDays: config.targetCalendarDays,
    firstObservedAt,
    lastObservedAt,
    trackedDurationMs,
  };
}
