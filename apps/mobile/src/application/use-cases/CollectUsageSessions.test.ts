import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import { createUsageEvent } from '../../domain/testSupport/createUsageEvent';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { UsageEventType } from '../../domain/usage/UsageEventType';
import { CollectUsageSessions } from './CollectUsageSessions';

describe('CollectUsageSessions', () => {
  it('fetches events from the port and builds sessions without persisting', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1_000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
      createUsageEvent({
        timestamp: 5_000,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: 'com.example.app' },
      }),
    ];

    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => events),
    };
    const useCase = new CollectUsageSessions(
      port,
      new DefaultUsageSessionBuilder(),
    );

    const sessions = await useCase.execute(0, 10_000);

    expect(port.getUsageEvents).toHaveBeenCalledWith(0, 10_000);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.durationMs).toBe(4_000);
  });
});
