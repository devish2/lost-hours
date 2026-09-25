import { CollectUsageSessions } from '../../application/use-cases/CollectUsageSessions';
import { SyncUsageSessions } from '../../application/use-cases/SyncUsageSessions';
import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import type { SessionBuilder } from '../../domain/session/SessionBuilder';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import type { UsageSessionRepository } from '../../domain/repositories/UsageSessionRepository';

export type SyncUsageSessionsPipelineDeps = {
  usageEventsPort: UsageEventsPort;
  usageSessionRepository: UsageSessionRepository;
  sessionBuilder?: SessionBuilder;
  appMetadataPort?: AppMetadataPort | null;
};

/** Wires collect + persist without starting automatic sync. */
export function createSyncUsageSessionsPipeline(
  deps: SyncUsageSessionsPipelineDeps,
): SyncUsageSessions {
  const sessionBuilder =
    deps.sessionBuilder ?? new DefaultUsageSessionBuilder();
  const collectUsageSessions = new CollectUsageSessions(
    deps.usageEventsPort,
    sessionBuilder,
  );
  return new SyncUsageSessions(
    collectUsageSessions,
    deps.usageSessionRepository,
    deps.appMetadataPort ?? null,
  );
}
