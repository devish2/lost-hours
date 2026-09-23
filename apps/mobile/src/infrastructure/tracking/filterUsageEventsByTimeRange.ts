import type { UsageEvent } from '../../domain/usage/UsageEvent';

/** Returns events with timestamp in **[fromTimestamp, toTimestamp)** without mutating input. */
export function filterUsageEventsByTimeRange(
  events: readonly UsageEvent[],
  fromTimestamp: number,
  toTimestamp: number,
): readonly UsageEvent[] {
  return events.filter(
    event =>
      event.timestamp >= fromTimestamp && event.timestamp < toTimestamp,
  );
}
