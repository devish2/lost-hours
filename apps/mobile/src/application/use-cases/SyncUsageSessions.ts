import type { UsageSessionRepository } from '../../domain/repositories/UsageSessionRepository';
import { CollectUsageSessions } from './CollectUsageSessions';

export type SyncUsageSessionsResult = {
  fromTimestamp: number;
  toTimestamp: number;
  collectedSessionCount: number;
  persistedSessionCount: number;
};

/** Collects factual sessions and persists them (no automatic scheduling). */
export class SyncUsageSessions {
  constructor(
    private readonly collectUsageSessions: CollectUsageSessions,
    private readonly usageSessionRepository: UsageSessionRepository,
  ) {}

  async execute(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<SyncUsageSessionsResult> {
    const sessions = await this.collectUsageSessions.execute(
      fromTimestamp,
      toTimestamp,
    );
    await this.usageSessionRepository.saveManyWithOpeningReconciliation(
      sessions,
    );
    return {
      fromTimestamp,
      toTimestamp,
      collectedSessionCount: sessions.length,
      persistedSessionCount: sessions.length,
    };
  }
}
