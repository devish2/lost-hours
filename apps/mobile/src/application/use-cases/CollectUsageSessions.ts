import type { SessionBuilder } from '../../domain/session/SessionBuilder';
import type { UsageSession } from '../../domain/session/UsageSession';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';

/** Orchestrates event port → domain sessions (no persistence). */
export class CollectUsageSessions {
  constructor(
    private readonly usageEventsPort: UsageEventsPort,
    private readonly sessionBuilder: SessionBuilder,
  ) {}

  async execute(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly UsageSession[]> {
    const events = await this.usageEventsPort.getUsageEvents(
      fromTimestamp,
      toTimestamp,
    );
    return this.sessionBuilder.buildSessions(
      events,
      fromTimestamp,
      toTimestamp,
    );
  }
}
