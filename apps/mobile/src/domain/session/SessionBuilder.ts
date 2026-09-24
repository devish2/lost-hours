import type { UsageEvent } from '../usage/UsageEvent';
import type { UsageSession } from './UsageSession';

/** Pure conversion from factual usage events to temporal app sessions. */
export interface SessionBuilder {
  buildSessions(
    events: readonly UsageEvent[],
    fromTimestamp: number,
    toTimestamp: number,
  ): readonly UsageSession[];
}
