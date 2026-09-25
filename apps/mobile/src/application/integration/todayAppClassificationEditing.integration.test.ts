import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { deriveAppUserClassificationRuleId } from '../../domain/classification/appUserClassificationRule';
import { ContentType } from '../../domain/classification/ContentType';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import type { UsageSession } from '../../domain/session/UsageSession';
import { TrackingSource } from '../../domain/usage/TrackingSource';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { runTodayAppClassificationMutation } from '../today/runTodayAppClassificationMutation';
import { RefreshTodayDashboard } from '../today/RefreshTodayDashboard';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { SQLiteClassificationRuleRepository } from '../../infrastructure/storage/sqlite/repositories/SQLiteClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { createMockClassificationRuleSqlExecutor } from '../../infrastructure/storage/testSupport/createMockClassificationRuleSqlExecutor';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';

const SNAPCHAT = 'com.snapchat.android';
const THIRTY_MIN_MS = 30 * 60 * 1000;
const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
const tenAm = dayStart + 10 * 60 * 60 * 1000;
const tenThirty = tenAm + THIRTY_MIN_MS;
const now = new Date(2024, 5, 15, 18, 0, 0).getTime();
const clock = { now: () => now };

function snapshotSession(session: UsageSession): UsageSession {
  return JSON.parse(JSON.stringify(session)) as UsageSession;
}

describe('Today app classification editing (D3.10)', () => {
  it('persists USER_RULE, refreshes analytics, and never rewrites raw sessions', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const appClassification = createAppUserClassification(ruleRepository);

    await sessionRepository.save(
      createUsageSession({
        id: 'snap-30',
        app: { packageName: SNAPCHAT, displayName: 'Snapchat' },
        platform: Platform.OTHER,
        contentType: ContentType.UNKNOWN,
        startTime: tenAm,
        endTime: tenThirty,
        durationMs: THIRTY_MIN_MS,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
        trackingSource: TrackingSource.ANDROID_USAGE_STATS,
      }),
    );
    const rawSnapshot = snapshotSession(sessionRepository.allSessions()[0]!);

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

    const refreshToday = () => refresh.execute();

    let result = await refreshToday();
    expect(result.dashboard.apps[0]?.classification).toBe(
      ActivityClassification.UNKNOWN,
    );
    expect(result.dashboard.totalLostMs).toBe(0);

    await runTodayAppClassificationMutation({
      persist: () =>
        appClassification.setClassification(SNAPCHAT, ActivityClassification.WASTE),
      refreshToday,
    });
    result = await refreshToday();
    expect(result.dashboard.apps[0]?.classification).toBe(ActivityClassification.WASTE);
    expect(result.dashboard.totalLostMs).toBe(THIRTY_MIN_MS);
    expect(ruleMock.rowCount()).toBe(1);

    const recreatedRules = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const recreatedAppClassification = createAppUserClassification(recreatedRules);
    expect(
      await recreatedAppClassification.getExplicitAppClassification(SNAPCHAT),
    ).toBe(ActivityClassification.WASTE);

    await runTodayAppClassificationMutation({
      persist: () =>
        recreatedAppClassification.setClassification(
          SNAPCHAT,
          ActivityClassification.PRODUCTIVE,
        ),
      refreshToday,
    });
    result = await refreshToday();
    expect(result.dashboard.apps[0]?.classification).toBe(
      ActivityClassification.PRODUCTIVE,
    );
    expect(result.dashboard.totalLostMs).toBe(0);
    expect(ruleMock.rowCount()).toBe(1);
    expect(
      ruleMock.getRow(deriveAppUserClassificationRuleId(SNAPCHAT))?.classification,
    ).toBe(ActivityClassification.PRODUCTIVE);

    await runTodayAppClassificationMutation({
      persist: () => recreatedAppClassification.clearClassification(SNAPCHAT),
      refreshToday,
    });
    result = await refreshToday();
    expect(result.dashboard.apps[0]?.classification).toBe(
      ActivityClassification.UNKNOWN,
    );
    expect(result.dashboard.totalLostMs).toBe(0);
    expect(ruleMock.getRow(deriveAppUserClassificationRuleId(SNAPCHAT))).toBeUndefined();

    expect(sessionRepository.allSessions()[0]).toEqual(rawSnapshot);
  });
});
