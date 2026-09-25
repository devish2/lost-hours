import { UsageEventType } from '../../domain/usage/UsageEventType';
import { createUsageEvent } from '../../domain/testSupport/createUsageEvent';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';
import { CollectUsageSessions } from '../use-cases/CollectUsageSessions';
import { SyncUsageSessions } from '../use-cases/SyncUsageSessions';

const PACKAGE = 'com.snapchat.android';

describe('app display name reconciliation (D3.12)', () => {
  it('updates existing sessions when metadata becomes available on later sync', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: PACKAGE },
      }),
      createUsageEvent({
        timestamp: 4000,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: PACKAGE },
      }),
    ];
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => events),
    };
    const repository = new InMemoryUsageSessionRepository();
    let metadataAvailable = false;
    const metadataPort: AppMetadataPort = {
      getAppMetadata: jest.fn(async () =>
        metadataAvailable
          ? [{ packageName: PACKAGE, displayName: 'Snapchat' }]
          : [{ packageName: PACKAGE }],
      ),
    };
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
      metadataPort,
    );

    await sync.execute(0, 5000);
    expect(repository.allSessions()[0]?.app.displayName).toBeUndefined();

    metadataAvailable = true;
    await sync.execute(0, 5000);
    expect(repository.allSessions()).toHaveLength(1);
    expect(repository.allSessions()[0]?.app.displayName).toBe('Snapchat');
    expect(repository.allSessions()[0]?.durationMs).toBe(3000);
  });
});
