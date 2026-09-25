import { RefreshTodayDashboard } from './RefreshTodayDashboard';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';

describe('RefreshTodayDashboard clock (D3.11)', () => {
  it('uses a single captured now per execute for the local day window', async () => {
    const nowMs = new Date(2024, 5, 15, 12, 0, 0).getTime();
    const clock = { now: jest.fn(() => nowMs) };
    const sessionRepository = new InMemoryUsageSessionRepository();
    const syncExecute = jest.fn(async () => ({
      fromTimestamp: 0,
      toTimestamp: nowMs,
      collectedSessionCount: 0,
      persistedSessionCount: 0,
    }));

    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions: { execute: syncExecute } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessionRepository),
    });

    await refresh.execute();
    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(syncExecute).toHaveBeenCalledWith(
      expect.any(Number),
      nowMs,
    );
  });
});
