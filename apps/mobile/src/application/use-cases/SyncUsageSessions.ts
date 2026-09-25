import { enrichUsageSessionsWithAppMetadata } from '../session/enrichUsageSessionsWithAppMetadata';
import type { UsageSessionRepository } from '../../domain/repositories/UsageSessionRepository';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';
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
    private readonly appMetadataPort: AppMetadataPort | null = null,
  ) {}

  async execute(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<SyncUsageSessionsResult> {
    const sessions = await this.collectUsageSessions.execute(
      fromTimestamp,
      toTimestamp,
    );
    const sessionsToPersist = await enrichUsageSessionsWithAppMetadata(
      sessions,
      this.appMetadataPort,
    );
    await this.usageSessionRepository.saveManyWithOpeningReconciliation(
      sessionsToPersist,
    );
    return {
      fromTimestamp,
      toTimestamp,
      collectedSessionCount: sessions.length,
      persistedSessionCount: sessions.length,
    };
  }
}
