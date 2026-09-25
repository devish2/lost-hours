import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { ContentType } from '../../domain/classification/ContentType';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { RefreshTodayDashboard } from '../today/RefreshTodayDashboard';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { SQLiteClassificationRuleRepository } from '../../infrastructure/storage/sqlite/repositories/SQLiteClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { createMockClassificationRuleSqlExecutor } from '../../infrastructure/storage/testSupport/createMockClassificationRuleSqlExecutor';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';

const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';
const CHROME = 'com.android.chrome';
const MIN_MS = 60 * 1000;
const THIRTY_MIN_MS = 30 * MIN_MS;

describe('Lost Time Today analytics integration (D3.8)', () => {
  const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
  const tenAm = dayStart + 10 * 60 * 60 * 1000;
  const now = new Date(2024, 5, 15, 18, 0, 0).getTime();
  const clock = { now: () => now };

  it('canonical real Lost Hours: effective WASTE only; raw sessions stay UNKNOWN', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const appClassification = createAppUserClassification(ruleRepository);
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
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessionRepository),
      classificationRuleRepository: ruleRepository,
    });

    await sessionRepository.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        startTime: tenAm,
        endTime: tenAm + 30 * MIN_MS,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
      createUsageSession({
        id: 'li',
        app: { packageName: LINKEDIN },
        platform: Platform.LINKEDIN,
        startTime: tenAm,
        endTime: tenAm + 20 * MIN_MS,
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
      createUsageSession({
        id: 'chrome',
        app: { packageName: CHROME },
        platform: Platform.OTHER,
        startTime: tenAm,
        endTime: tenAm + 40 * MIN_MS,
        durationMs: 40 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
    ]);
    const rawSnapshots = sessionRepository.allSessions().map(s => ({ ...s, app: { ...s.app } }));

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    await appClassification.setClassification(
      LINKEDIN,
      ActivityClassification.PRODUCTIVE,
    );

    const result = await refresh.execute();
    expect(result.dashboard.totalTrackedMs).toBe(90 * MIN_MS);
    expect(result.dashboard.wasteMs).toBe(30 * MIN_MS);
    expect(result.dashboard.productiveMs).toBe(20 * MIN_MS);
    expect(result.dashboard.unknownMs).toBe(40 * MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(30 * MIN_MS);
    expect(result.dashboard.lostByPlatform).toEqual([
      { platform: Platform.OTHER, lostMs: 30 * MIN_MS },
    ]);

    sessionRepository.allSessions().forEach((stored, index) => {
      expect(stored.classification).toBe(ActivityClassification.UNKNOWN);
      expect(stored.classificationSource).toBe(ClassificationSource.UNKNOWN);
      expect(stored.id).toBe(rawSnapshots[index]!.id);
    });
  });

  it('midnight clip + reclassification affects Lost Time without mutating raw session', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const appClassification = createAppUserClassification(ruleRepository);
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
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessionRepository),
      classificationRuleRepository: ruleRepository,
    });

    await sessionRepository.save(
      createUsageSession({
        id: 'midnight',
        app: { packageName: SNAPCHAT },
        contentType: ContentType.UNKNOWN,
        startTime: dayStart - 10 * MIN_MS,
        endTime: dayStart + 20 * MIN_MS,
        durationMs: THIRTY_MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    );
    const rawSnapshot = JSON.stringify(sessionRepository.allSessions()[0]);

    let dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(0);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(20 * MIN_MS);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(0);

    await appClassification.clearClassification(SNAPCHAT);
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(0);

    expect(JSON.stringify(sessionRepository.allSessions()[0])).toBe(rawSnapshot);
  });
});
