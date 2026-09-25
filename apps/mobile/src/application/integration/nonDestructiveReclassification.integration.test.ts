import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import {
  deriveAppUserClassificationRuleId,
  isAppUserClassificationRule,
} from '../../domain/classification/appUserClassificationRule';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { ContentType } from '../../domain/classification/ContentType';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import type { UsageSession } from '../../domain/session/UsageSession';
import { TrackingSource } from '../../domain/usage/TrackingSource';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { AppUserClassification } from '../use-cases/AppUserClassification';
import { RefreshTodayDashboard } from '../today/RefreshTodayDashboard';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { SQLiteClassificationRuleRepository } from '../../infrastructure/storage/sqlite/repositories/SQLiteClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { createMockClassificationRuleSqlExecutor } from '../../infrastructure/storage/testSupport/createMockClassificationRuleSqlExecutor';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';

const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';
const THIRTY_MIN_MS = 30 * 60 * 1000;
const TWENTY_MIN_MS = 20 * 60 * 1000;
const MIN_MS = 60 * 1000;

const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
const tenAm = dayStart + 10 * 60 * 60 * 1000;
const tenThirty = tenAm + THIRTY_MIN_MS;
const now = new Date(2024, 5, 15, 18, 0, 0).getTime();
const clock = { now: () => now };

function snapshotSession(session: UsageSession): UsageSession {
  return JSON.parse(JSON.stringify(session)) as UsageSession;
}

function expectRawSessionUnchanged(
  stored: UsageSession,
  snapshot: UsageSession,
): void {
  expect(stored).toEqual(snapshot);
  expect(stored.classification).toBe(ActivityClassification.UNKNOWN);
  expect(stored.classificationSource).toBe(
    ClassificationSource.UNKNOWN,
  );
}

function createRefreshStack(
  sessionRepository: InMemoryUsageSessionRepository,
  ruleRepository: SQLiteClassificationRuleRepository,
  syncExecute = jest.fn(async () => ({
    fromTimestamp: dayStart,
    toTimestamp: now,
    collectedSessionCount: 0,
    persistedSessionCount: 0,
  })),
) {
  return {
    syncExecute,
    refresh: new RefreshTodayDashboard({
      clock,
      syncUsageSessions: { execute: syncExecute } as unknown as SyncUsageSessions,
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessionRepository),
      classificationRuleRepository: ruleRepository,
    }),
    appClassification: createAppUserClassification(ruleRepository),
  };
}

describe('non-destructive reclassification (D3.7)', () => {
  it('authoritative lifecycle: rules change analytics only; raw session stays UNKNOWN', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const saveSpy = jest.spyOn(
      sessionRepository,
      'saveManyWithOpeningReconciliation',
    );
    let ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    let { refresh, appClassification, syncExecute } = createRefreshStack(
      sessionRepository,
      ruleRepository,
    );

    await sessionRepository.save(
      createUsageSession({
        id: 'snap-30',
        app: { packageName: SNAPCHAT },
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

    let dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalTrackedMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.unknownMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.wasteMs).toBe(0);
    expect(dashboard.totalLostMs).toBe(0);
    expect(dashboard.apps).toHaveLength(1);
    expect(dashboard.apps[0]?.packageName).toBe(SNAPCHAT);
    expect(dashboard.apps[0]?.classification).toBe(ActivityClassification.UNKNOWN);
    expect(dashboard.apps[0]?.lostDurationMs).toBe(0);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    expect(ruleMock.rowCount()).toBe(1);
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.wasteMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.unknownMs).toBe(0);
    expect(dashboard.totalLostMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.apps[0]?.classification).toBe(ActivityClassification.WASTE);
    expect(dashboard.apps[0]?.lostDurationMs).toBe(THIRTY_MIN_MS);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);
    expect(syncExecute).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();

    ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    appClassification = createAppUserClassification(ruleRepository);
    refresh = createRefreshStack(sessionRepository, ruleRepository).refresh;
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(THIRTY_MIN_MS);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    expect(ruleMock.getRow(deriveAppUserClassificationRuleId(SNAPCHAT))?.classification).toBe(
      ActivityClassification.PRODUCTIVE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.productiveMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.totalLostMs).toBe(0);
    expect(dashboard.apps[0]?.classification).toBe(
      ActivityClassification.PRODUCTIVE,
    );
    expect(dashboard.apps[0]?.lostDurationMs).toBe(0);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.NEUTRAL,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.neutralMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.totalLostMs).toBe(0);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.LEISURE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.leisureMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.totalLostMs).toBe(0);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);

    await appClassification.clearClassification(SNAPCHAT);
    expect(ruleMock.getRow(deriveAppUserClassificationRuleId(SNAPCHAT))).toBeUndefined();
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.unknownMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.totalLostMs).toBe(0);
    expect(dashboard.apps[0]?.classification).toBe(ActivityClassification.UNKNOWN);
    expect(dashboard.apps[0]?.lostDurationMs).toBe(0);
    expectRawSessionUnchanged(sessionRepository.allSessions()[0]!, rawSnapshot);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('applies new rules to previously persisted sessions without resync', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const { refresh, appClassification } = createRefreshStack(
      sessionRepository,
      ruleRepository,
    );

    await sessionRepository.save(
      createUsageSession({
        id: 'historical',
        app: { packageName: SNAPCHAT },
        startTime: tenAm,
        endTime: tenThirty,
        durationMs: THIRTY_MIN_MS,
      }),
    );

    await refresh.execute();
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    const dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(THIRTY_MIN_MS);
    expect(sessionRepository.allSessions()[0]?.classification).toBe(
      ActivityClassification.UNKNOWN,
    );
  });

  it('classifies all sessions for a package; raw rows stay UNKNOWN', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const { refresh, appClassification } = createRefreshStack(
      sessionRepository,
      ruleRepository,
    );

    await sessionRepository.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 's10',
        app: { packageName: SNAPCHAT },
        startTime: tenAm,
        endTime: tenAm + 10 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
      createUsageSession({
        id: 's20',
        app: { packageName: SNAPCHAT },
        startTime: tenAm + 10 * MIN_MS,
        endTime: tenAm + 30 * MIN_MS,
        durationMs: 20 * MIN_MS,
      }),
      createUsageSession({
        id: 's15',
        app: { packageName: SNAPCHAT },
        startTime: tenAm + 30 * MIN_MS,
        endTime: tenAm + 45 * MIN_MS,
        durationMs: 15 * MIN_MS,
      }),
    ]);
    const snapshots = sessionRepository.allSessions().map(snapshotSession);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalTrackedMs).toBe(45 * MIN_MS);
    expect(dashboard.totalLostMs).toBe(45 * MIN_MS);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(0);

    sessionRepository.allSessions().forEach((stored, index) => {
      expectRawSessionUnchanged(stored, snapshots[index]!);
    });
  });

  it('isolates rules by packageName', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const appClassification = createAppUserClassification(ruleRepository);
    const { refresh } = createRefreshStack(sessionRepository, ruleRepository);

    await sessionRepository.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        startTime: tenAm,
        endTime: tenThirty,
        durationMs: THIRTY_MIN_MS,
      }),
      createUsageSession({
        id: 'li',
        app: { packageName: LINKEDIN },
        startTime: tenAm,
        endTime: tenAm + TWENTY_MIN_MS,
        durationMs: TWENTY_MIN_MS,
      }),
    ]);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.unknownMs).toBe(TWENTY_MIN_MS);

    await appClassification.setClassification(
      LINKEDIN,
      ActivityClassification.PRODUCTIVE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.totalLostMs).toBe(THIRTY_MIN_MS);
    expect(dashboard.productiveMs).toBe(TWENTY_MIN_MS);
    expect(dashboard.wasteMs).toBe(THIRTY_MIN_MS);
  });

  it('matches package rules regardless of displayName or Platform on sessions', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const appClassification = createAppUserClassification(ruleRepository);
    const { refresh } = createRefreshStack(sessionRepository, ruleRepository);

    await sessionRepository.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'li-old-label',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        platform: Platform.LINKEDIN,
        startTime: tenAm,
        endTime: tenAm + 10 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
      createUsageSession({
        id: 'li-new-label',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn New' },
        platform: Platform.LINKEDIN,
        startTime: tenAm + 10 * MIN_MS,
        endTime: tenAm + 20 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
      createUsageSession({
        id: 'ex-other',
        app: { packageName: 'com.example.app' },
        platform: Platform.OTHER,
        startTime: tenAm,
        endTime: tenAm + 10 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
      createUsageSession({
        id: 'ex-li-platform',
        app: { packageName: 'com.example.app' },
        platform: Platform.LINKEDIN,
        startTime: tenAm + 10 * MIN_MS,
        endTime: tenAm + 20 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
    ]);

    await appClassification.setClassification(
      LINKEDIN,
      ActivityClassification.PRODUCTIVE,
    );
    let dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.productiveMs).toBe(20 * MIN_MS);

    await appClassification.setClassification(
      'com.example.app',
      ActivityClassification.WASTE,
    );
    dashboard = (await refresh.execute()).dashboard;
    expect(dashboard.wasteMs).toBe(20 * MIN_MS);
    expect(dashboard.totalLostMs).toBe(20 * MIN_MS);
  });

  it('keeps one deterministic app USER_RULE row across reclassifications', async () => {
    const ruleMock = createMockClassificationRuleSqlExecutor();
    const ruleRepository = new SQLiteClassificationRuleRepository(ruleMock.executor);
    const appClassification = new AppUserClassification(ruleRepository);
    const ruleId = deriveAppUserClassificationRuleId(SNAPCHAT);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.NEUTRAL,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.LEISURE,
    );

    expect(ruleMock.rowCount()).toBe(1);
    expect(ruleMock.getRow(ruleId)?.id).toBe(ruleId);
    const allRules = await ruleRepository.findAll();
    expect(allRules.filter(isAppUserClassificationRule)).toHaveLength(1);

    await appClassification.clearClassification(SNAPCHAT);
    expect(await ruleRepository.findById(ruleId)).toBeNull();
  });
});
