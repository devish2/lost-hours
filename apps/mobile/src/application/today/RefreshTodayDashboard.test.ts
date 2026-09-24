import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ContentType } from '../../domain/classification/ContentType';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { GetTodayDashboard } from '../queries/GetTodayDashboard';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import type { Clock } from '../../shared/time/Clock';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';
import { getLocalCalendarDayStart } from '../../shared/time/localCalendarDay';
import { RefreshTodayDashboard } from './RefreshTodayDashboard';

describe('RefreshTodayDashboard', () => {
  const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
  const now = new Date(2024, 5, 15, 10, 0, 0).getTime();
  const clock: Clock = { now: () => now };

  it('syncs before querying SQLite and clips before analytics', async () => {
    const repository = new InMemoryUsageSessionRepository();
    const syncExecute = jest.fn(async () => ({
      fromTimestamp: dayStart,
      toTimestamp: now,
      collectedSessionCount: 1,
      persistedSessionCount: 1,
    }));
    const syncUsageSessions = {
      execute: syncExecute,
    } as unknown as SyncUsageSessions;

    await repository.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'cross-start',
        startTime: dayStart - 60_000,
        endTime: dayStart + 120_000,
        durationMs: 180_000,
        contentType: ContentType.UNKNOWN,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);

    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(repository),
    });

    const result = await refresh.execute();
    expect(syncExecute).toHaveBeenCalledWith(dayStart, now);
    expect(result.kind).toBe('success');
    expect(result.dashboard.totalTrackedMs).toBe(120_000);
    expect(result.dashboard.totalLostMs).toBe(0);
    expect(result.dashboard.unknownMs).toBe(120_000);
    expect(repository.allSessions()[0]?.id).toBe('cross-start');
  });

  it('returns empty dashboard without sync when window is zero-length', async () => {
    const syncExecute = jest.fn();
    const refresh = new RefreshTodayDashboard({
      clock: { now: () => dayStart },
      syncUsageSessions: { execute: syncExecute } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        new InMemoryUsageSessionRepository(),
      ),
    });

    const result = await refresh.execute();
    expect(result.kind).toBe('zero_window');
    expect(syncExecute).not.toHaveBeenCalled();
    expect(result.dashboard.totalTrackedMs).toBe(0);
  });

  it('does not persist clipped session ids', async () => {
    const repository = new InMemoryUsageSessionRepository();
    const saveSpy = jest.spyOn(repository, 'saveManyWithOpeningReconciliation');
    await repository.save(
      createUsageSession({
        id: 'stored',
        startTime: dayStart - 30_000,
        endTime: dayStart + 60_000,
        durationMs: 90_000,
      }),
    );

    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions: {
        execute: jest.fn(async () => ({
          fromTimestamp: dayStart,
          toTimestamp: now,
          collectedSessionCount: 0,
          persistedSessionCount: 0,
        })),
      } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(repository),
    });

    await refresh.execute();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(repository.allSessions()[0]?.id).toBe('stored');
  });

  it('propagates sync failures', async () => {
    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions: {
        execute: jest.fn(async () => {
          throw new Error('sync failed');
        }),
      } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        new InMemoryUsageSessionRepository(),
      ),
    });

    await expect(refresh.execute()).rejects.toMatchObject({
      name: 'TodayDashboardRefreshError',
      code: 'SYNC_FAILED',
    });
  });

  it('maps query failures to QUERY_FAILED', async () => {
    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions: {
        execute: jest.fn(async () => ({
          fromTimestamp: dayStart,
          toTimestamp: now,
          collectedSessionCount: 0,
          persistedSessionCount: 0,
        })),
      } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: {
        execute: jest.fn(async () => {
          throw new Error('read failed');
        }),
      } as unknown as GetUsageSessionsForRange,
    });

    await expect(refresh.execute()).rejects.toMatchObject({
      code: 'QUERY_FAILED',
    });
  });

  it('maps analytics failures to ANALYTICS_FAILED', async () => {
    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions: {
        execute: jest.fn(async () => ({
          fromTimestamp: dayStart,
          toTimestamp: now,
          collectedSessionCount: 0,
          persistedSessionCount: 0,
        })),
      } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        new InMemoryUsageSessionRepository(),
      ),
      getTodayDashboard: {
        execute: () => {
          throw new Error('analytics failed');
        },
      } as unknown as GetTodayDashboard,
    });

    await expect(refresh.execute()).rejects.toMatchObject({
      code: 'ANALYTICS_FAILED',
    });
  });

  it('recomputes window from clock on each execute (no stale day boundary)', async () => {
    let nowMs = new Date(2024, 5, 15, 23, 59, 0).getTime();
    const mutableClock: Clock = { now: () => nowMs };
    const syncExecute = jest.fn(
      async (_fromTimestamp: number, _toTimestamp: number) => ({
        fromTimestamp: getLocalCalendarDayStart(nowMs),
        toTimestamp: nowMs,
        collectedSessionCount: 0,
        persistedSessionCount: 0,
      }),
    );

    const refresh = new RefreshTodayDashboard({
      clock: mutableClock,
      syncUsageSessions: { execute: syncExecute } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        new InMemoryUsageSessionRepository(),
      ),
    });

    await refresh.execute();
    const firstFrom = syncExecute.mock.calls[0]![0] as number;

    nowMs = new Date(2024, 5, 16, 0, 5, 0).getTime();
    await refresh.execute();
    const secondFrom = syncExecute.mock.calls[1]![0] as number;

    expect(secondFrom).toBeGreaterThan(firstFrom);
  });
});
