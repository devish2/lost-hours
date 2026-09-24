import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import { createUsageEvent } from '../../domain/testSupport/createUsageEvent';
import { UsageEventType } from '../../domain/usage/UsageEventType';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { CollectUsageSessions } from '../use-cases/CollectUsageSessions';
import { SyncUsageSessions } from '../use-cases/SyncUsageSessions';

/**
 * D2.5 truncated session + D2.6 opening-identity reconciliation (device-free).
 */
describe('truncated → extended session reconciliation', () => {
  const packageName = 'com.google.android.youtube';
  const foregroundAt = new Date(2024, 5, 15, 10, 50, 0).getTime();
  const firstSyncEnd = new Date(2024, 5, 15, 11, 0, 0).getTime();
  const backgroundAt = new Date(2024, 5, 15, 11, 7, 0).getTime();
  const secondSyncEnd = new Date(2024, 5, 15, 11, 10, 0).getTime();
  const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();

  it('replaces truncated session with extended session after BACKGROUND arrives', async () => {
    const repository = new InMemoryUsageSessionRepository();
    const port: UsageEventsPort = {
      getUsageEvents: jest
        .fn()
        .mockResolvedValueOnce([
          createUsageEvent({
            timestamp: foregroundAt,
            eventType: UsageEventType.FOREGROUND,
            app: { packageName },
          }),
        ])
        .mockResolvedValueOnce([
          createUsageEvent({
            timestamp: foregroundAt,
            eventType: UsageEventType.FOREGROUND,
            app: { packageName },
          }),
          createUsageEvent({
            timestamp: backgroundAt,
            eventType: UsageEventType.BACKGROUND,
            app: { packageName },
          }),
        ]),
    };

    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
    );

    await sync.execute(dayStart, firstSyncEnd);
    expect(repository.allSessions()).toHaveLength(1);
    expect(repository.allSessions()[0]?.endTime).toBe(firstSyncEnd);

    await sync.execute(dayStart, secondSyncEnd);
    const sessions = repository.allSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.startTime).toBe(foregroundAt);
    expect(sessions[0]?.endTime).toBe(backgroundAt);
  });
});
