import { aggregateUsageByApp } from '../../domain/analytics/aggregateUsageByApp';
import type { UsageSession } from '../../domain/session/UsageSession';
import type { TodayAppBreakdownItem } from '../models/TodayAppBreakdownItem';

/** Aggregates effective clipped sessions into per-package Today rows. */
export function aggregateTodayUsageByApp(
  sessions: readonly UsageSession[],
): TodayAppBreakdownItem[] {
  return aggregateUsageByApp(sessions);
}
