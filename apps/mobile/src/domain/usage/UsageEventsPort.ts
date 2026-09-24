import type { UsageEvent } from './UsageEvent';

/** Domain port for retrieving factual usage events over a half-open window. */
export interface UsageEventsPort {
  getUsageEvents(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly UsageEvent[]>;
}
