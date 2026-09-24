import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import { createUsageEvent } from '../../domain/testSupport/createUsageEvent';
import { UsageEventType } from '../../domain/usage/UsageEventType';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { GetTodayDashboard } from '../queries/GetTodayDashboard';
import { CollectUsageSessions } from '../use-cases/CollectUsageSessions';
import { SyncUsageSessions } from '../use-cases/SyncUsageSessions';
import { clipUsageSessionsToWindow } from '../../domain/session/clipUsageSessionsToWindow';

describe('sync idempotency', () => {
  it('does not duplicate logical sessions or double dashboard totals', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1_000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
      createUsageEvent({
        timestamp: 4_000,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: 'com.example.app' },
      }),
    ];
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => events),
    };
    const repository = new InMemoryUsageSessionRepository();
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
    );

    await sync.execute(0, 5_000);
    await sync.execute(0, 5_000);

    expect(repository.allSessions()).toHaveLength(1);
    expect(port.getUsageEvents).toHaveBeenCalledTimes(2);

    const stored = await new GetUsageSessionsForRange(repository).execute({
      fromTimestamp: 0,
      toTimestamp: 5_000,
    });
    const clipped = clipUsageSessionsToWindow(stored, 0, 5_000);
    const dashboard = new GetTodayDashboard().execute('2024-01-01', clipped);
    expect(dashboard.totalTrackedMs).toBe(3_000);
  });
});
