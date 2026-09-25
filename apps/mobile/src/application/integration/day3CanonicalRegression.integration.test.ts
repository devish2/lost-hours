import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
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

const MIN_MS = 60 * 1000;
const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';
const CHROME = 'com.android.chrome';
const WHATSAPP = 'com.whatsapp';

const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
const tenAm = dayStart + 10 * 60 * 60 * 1000;
const now = new Date(2024, 5, 15, 18, 0, 0).getTime();
const clock = { now: () => now };

function snapshotSessions(sessions: readonly UsageSession[]): UsageSession[] {
  return JSON.parse(JSON.stringify(sessions)) as UsageSession[];
}

describe('Day 3 canonical regression (D3.11)', () => {
  it('classifies four apps, reconciles Lost Time, survives service recreation, raw sessions stay UNKNOWN', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    let ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    let appClassification = createAppUserClassification(ruleRepository);

    const sessions = [
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT, displayName: 'Snapchat' },
        platform: Platform.OTHER,
        durationMs: 30 * MIN_MS,
        startTime: tenAm,
        endTime: tenAm + 30 * MIN_MS,
      }),
      createUsageSession({
        id: 'li',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        platform: Platform.LINKEDIN,
        durationMs: 20 * MIN_MS,
        startTime: tenAm,
        endTime: tenAm + 20 * MIN_MS,
      }),
      createUsageSession({
        id: 'chrome',
        app: { packageName: CHROME, displayName: 'Chrome' },
        platform: Platform.OTHER,
        durationMs: 40 * MIN_MS,
        startTime: tenAm,
        endTime: tenAm + 40 * MIN_MS,
      }),
      createUsageSession({
        id: 'wa',
        app: { packageName: WHATSAPP, displayName: 'WhatsApp' },
        platform: Platform.OTHER,
        durationMs: 15 * MIN_MS,
        startTime: tenAm,
        endTime: tenAm + 15 * MIN_MS,
      }),
    ];
    for (const session of sessions) {
      await sessionRepository.save({
        ...session,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
        contentType: ContentType.UNKNOWN,
        trackingSource: TrackingSource.ANDROID_USAGE_STATS,
      });
    }
    const rawSnapshot = snapshotSessions(sessionRepository.allSessions());

    const buildRefresh = () =>
      new RefreshTodayDashboard({
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

    let refresh = buildRefresh();
    let result = await refresh.execute();
    expect(result.dashboard.totalTrackedMs).toBe(105 * MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(0);
    expect(result.dashboard.apps).toHaveLength(4);

    await runTodayAppClassificationMutation({
      persist: () =>
        appClassification.setClassification(SNAPCHAT, ActivityClassification.WASTE),
      refreshToday: () => refresh.execute(),
    });
    await runTodayAppClassificationMutation({
      persist: () =>
        appClassification.setClassification(
          LINKEDIN,
          ActivityClassification.PRODUCTIVE,
        ),
      refreshToday: () => refresh.execute(),
    });
    await runTodayAppClassificationMutation({
      persist: () =>
        appClassification.setClassification(WHATSAPP, ActivityClassification.NEUTRAL),
      refreshToday: () => refresh.execute(),
    });

    result = await refresh.execute();
    expect(result.dashboard.totalLostMs).toBe(30 * MIN_MS);
    expect(result.dashboard.totalTrackedMs).toBe(105 * MIN_MS);
    const byPackage = new Map(
      result.dashboard.apps.map(row => [row.packageName, row]),
    );
    expect(byPackage.get(SNAPCHAT)?.classification).toBe(ActivityClassification.WASTE);
    expect(byPackage.get(SNAPCHAT)?.lostDurationMs).toBe(30 * MIN_MS);
    expect(byPackage.get(LINKEDIN)?.classification).toBe(
      ActivityClassification.PRODUCTIVE,
    );
    expect(byPackage.get(CHROME)?.classification).toBe(ActivityClassification.UNKNOWN);
    expect(byPackage.get(WHATSAPP)?.classification).toBe(ActivityClassification.NEUTRAL);
    expect(sessionRepository.allSessions()).toEqual(rawSnapshot);

    ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    appClassification = createAppUserClassification(ruleRepository);
    refresh = buildRefresh();
    result = await refresh.execute();
    expect(result.dashboard.totalLostMs).toBe(30 * MIN_MS);

    await runTodayAppClassificationMutation({
      persist: () =>
        appClassification.setClassification(
          SNAPCHAT,
          ActivityClassification.PRODUCTIVE,
        ),
      refreshToday: () => refresh.execute(),
    });
    result = await refresh.execute();
    expect(result.dashboard.totalLostMs).toBe(0);

    await runTodayAppClassificationMutation({
      persist: () => appClassification.clearClassification(LINKEDIN),
      refreshToday: () => refresh.execute(),
    });
    result = await refresh.execute();
    expect(
      result.dashboard.apps.find(row => row.packageName === LINKEDIN)?.classification,
    ).toBe(ActivityClassification.UNKNOWN);

    expect(sessionRepository.allSessions()).toEqual(rawSnapshot);
    expect(sessionRepository.allSessions()).toHaveLength(4);
  });
});
