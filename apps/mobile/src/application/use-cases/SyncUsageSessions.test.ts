import { Platform } from '../../domain/platform/Platform';
import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import type { SessionBuilder } from '../../domain/session/SessionBuilder';
import { createUsageEvent } from '../../domain/testSupport/createUsageEvent';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { UsageEventType } from '../../domain/usage/UsageEventType';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { CollectUsageSessions } from './CollectUsageSessions';
import { SyncUsageSessions } from './SyncUsageSessions';

describe('SyncUsageSessions', () => {
  it('collects with exact window, builds sessions, and persists with reconciliation', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
      createUsageEvent({
        timestamp: 4000,
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

    const result = await sync.execute(0, 5000);

    expect(port.getUsageEvents).toHaveBeenCalledWith(0, 5000);
    expect(result).toEqual({
      fromTimestamp: 0,
      toTimestamp: 5000,
      collectedSessionCount: 1,
      persistedSessionCount: 1,
    });
    expect(repository.allSessions()).toHaveLength(1);
  });

  it('handles empty session output without failing', async () => {
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => []),
    };
    const repository = new InMemoryUsageSessionRepository();
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
    );

    const result = await sync.execute(0, 1000);
    expect(result.collectedSessionCount).toBe(0);
    expect(repository.allSessions()).toHaveLength(0);
  });

  it('does not persist when event collection fails', async () => {
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => {
        throw new Error('native failure');
      }),
    };
    const repository = new InMemoryUsageSessionRepository();
    const saveSpy = jest.spyOn(repository, 'saveManyWithOpeningReconciliation');
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
    );

    await expect(sync.execute(0, 1000)).rejects.toThrow(/native failure/);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('does not persist when session builder fails', async () => {
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => []),
    };
    const builder: SessionBuilder = {
      buildSessions: jest.fn(() => {
        throw new Error('builder failure');
      }),
    };
    const repository = new InMemoryUsageSessionRepository();
    const saveSpy = jest.spyOn(repository, 'saveManyWithOpeningReconciliation');
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, builder),
      repository,
    );

    await expect(sync.execute(0, 1000)).rejects.toThrow(/builder failure/);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => [
        createUsageEvent({
          timestamp: 1,
          eventType: UsageEventType.FOREGROUND,
        }),
        createUsageEvent({
          timestamp: 2,
          eventType: UsageEventType.BACKGROUND,
        }),
      ]),
    };
    const repository = new InMemoryUsageSessionRepository();
    jest
      .spyOn(repository, 'saveManyWithOpeningReconciliation')
      .mockRejectedValue(new Error('sqlite failure'));
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
    );

    await expect(sync.execute(0, 1000)).rejects.toThrow(/sqlite failure/);
  });

  it('persists displayName from app metadata without failing when metadata throws', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.linkedin.android' },
      }),
      createUsageEvent({
        timestamp: 4000,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: 'com.linkedin.android' },
      }),
    ];
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => events),
    };
    const repository = new InMemoryUsageSessionRepository();
    const getAppMetadata = jest.fn(async () => [
      { packageName: 'com.linkedin.android', displayName: 'LinkedIn' },
    ]);
    const metadataPort: AppMetadataPort = { getAppMetadata };
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
      metadataPort,
    );

    await sync.execute(0, 5000);

    expect(getAppMetadata).toHaveBeenCalledWith(['com.linkedin.android']);
    const stored = repository.allSessions();
    expect(stored).toHaveLength(1);
    expect(stored[0].app.displayName).toBe('LinkedIn');
    expect(stored[0].app.packageName).toBe('com.linkedin.android');
    expect(stored[0].platform).toBe(Platform.LINKEDIN);
  });

  it('still persists sessions when app metadata lookup fails', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.whatsapp' },
      }),
      createUsageEvent({
        timestamp: 2,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: 'com.whatsapp' },
      }),
    ];
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => events),
    };
    const metadataPort: AppMetadataPort = {
      getAppMetadata: jest.fn(async () => {
        throw new Error('metadata unavailable');
      }),
    };
    const repository = new InMemoryUsageSessionRepository();
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      repository,
      metadataPort,
    );

    await sync.execute(0, 1000);
    const stored = repository.allSessions();
    expect(stored).toHaveLength(1);
    expect(stored[0].app.packageName).toBe('com.whatsapp');
    expect(stored[0].app.displayName).toBeUndefined();
  });
});
