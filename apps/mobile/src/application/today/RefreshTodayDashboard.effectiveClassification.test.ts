import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import {
  buildAppUserClassificationRule,
  deriveAppUserClassificationRuleId,
} from '../../domain/classification/appUserClassificationRule';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import type { ClassificationRule } from '../../domain/classification/ClassificationRule';
import { ContentType } from '../../domain/classification/ContentType';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import type { ActivityClassifier } from '../../domain/classification/ActivityClassifier';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import type { Clock } from '../../shared/time/Clock';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';
import { RefreshTodayDashboard } from './RefreshTodayDashboard';

const SNAPCHAT = 'com.snapchat.android';
const THIRTY_MIN_MS = 30 * 60 * 1000;
const TWENTY_MIN_MS = 20 * 60 * 1000;

describe('RefreshTodayDashboard effective classification (D3.6)', () => {
  const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
  const tenAm = dayStart + 10 * 60 * 60 * 1000;
  const tenThirty = tenAm + THIRTY_MIN_MS;
  const now = new Date(2024, 5, 15, 12, 0, 0).getTime();
  const clock: Clock = { now: () => now };

  const noOpSync = {
    execute: jest.fn(async () => ({
      fromTimestamp: dayStart,
      toTimestamp: now,
      collectedSessionCount: 0,
      persistedSessionCount: 0,
    })),
  } as unknown as SyncUsageSessions;

  function createRefresh(
    sessionRepository: InMemoryUsageSessionRepository,
    ruleRepository: InMemoryClassificationRuleRepository,
    overrides: {
      activityClassifier?: ActivityClassifier;
    } = {},
  ) {
    return new RefreshTodayDashboard({
      clock,
      syncUsageSessions: noOpSync,
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessionRepository),
      classificationRuleRepository: ruleRepository,
      ...overrides,
    });
  }

  async function seedSnapchatSession(
    repository: InMemoryUsageSessionRepository,
  ) {
    await repository.save(
      createUsageSession({
        id: 'snap-session',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        startTime: tenAm,
        endTime: tenThirty,
        durationMs: THIRTY_MIN_MS,
        contentType: ContentType.UNKNOWN,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
    );
  }

  it('reclassifies analytics without rewriting persisted sessions', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await seedSnapchatSession(sessions);
    const refresh = createRefresh(sessions, rules);

    let result = await refresh.execute();
    expect(result.dashboard.totalLostMs).toBe(0);
    expect(result.dashboard.unknownMs).toBe(THIRTY_MIN_MS);

    await rules.save(
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.WASTE),
    );
    result = await refresh.execute();
    expect(result.dashboard.wasteMs).toBe(THIRTY_MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(THIRTY_MIN_MS);

    await rules.save(
      buildAppUserClassificationRule(
        SNAPCHAT,
        ActivityClassification.PRODUCTIVE,
      ),
    );
    result = await refresh.execute();
    expect(result.dashboard.productiveMs).toBe(THIRTY_MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(0);

    await rules.deleteById(deriveAppUserClassificationRuleId(SNAPCHAT));
    result = await refresh.execute();
    expect(result.dashboard.unknownMs).toBe(THIRTY_MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(0);

    const stored = sessions.allSessions()[0];
    expect(stored?.classification).toBe(ActivityClassification.UNKNOWN);
    expect(stored?.classificationSource).toBe(ClassificationSource.UNKNOWN);
    expect(stored?.startTime).toBe(tenAm);
    expect(stored?.endTime).toBe(tenThirty);
  });

  it('aggregates NEUTRAL and LEISURE without Lost Time', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await seedSnapchatSession(sessions);
    const refresh = createRefresh(sessions, rules);

    await rules.save(
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.NEUTRAL),
    );
    let result = await refresh.execute();
    expect(result.dashboard.neutralMs).toBe(THIRTY_MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(0);

    await rules.save(
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.LEISURE),
    );
    result = await refresh.execute();
    expect(result.dashboard.leisureMs).toBe(THIRTY_MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(0);
  });

  it('classifies clipped duration after midnight overlap', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await sessions.save(
      createUsageSession({
        id: 'midnight',
        app: { packageName: SNAPCHAT },
        startTime: dayStart - 10 * 60 * 1000,
        endTime: dayStart + TWENTY_MIN_MS,
        durationMs: THIRTY_MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    );
    await rules.save(
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.WASTE),
    );

    const result = await createRefresh(sessions, rules).execute();
    expect(result.dashboard.totalTrackedMs).toBe(TWENTY_MIN_MS);
    expect(result.dashboard.totalLostMs).toBe(TWENTY_MIN_MS);
    expect(sessions.allSessions()[0]?.durationMs).toBe(THIRTY_MIN_MS);
  });

  it('sums overlapping WASTE sessions without cross-app deduplication', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await sessions.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'app-a',
        app: { packageName: 'com.app.a' },
        startTime: tenAm,
        endTime: tenThirty,
        durationMs: THIRTY_MIN_MS,
      }),
      createUsageSession({
        id: 'app-b',
        app: { packageName: 'com.app.b' },
        startTime: tenAm + 10 * 60 * 1000,
        endTime: tenAm + 20 * 60 * 1000,
        durationMs: 10 * 60 * 1000,
      }),
    ]);
    await rules.save(
      buildAppUserClassificationRule('com.app.a', ActivityClassification.WASTE),
    );
    await rules.save(
      buildAppUserClassificationRule('com.app.b', ActivityClassification.WASTE),
    );

    const result = await createRefresh(sessions, rules).execute();
    expect(result.dashboard.totalLostMs).toBe(40 * 60 * 1000);
  });

  it('maps classification rule query failure to QUERY_FAILED', async () => {
    const refresh = new RefreshTodayDashboard({
      clock,
      syncUsageSessions: noOpSync,
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        new InMemoryUsageSessionRepository(),
      ),
      classificationRuleRepository: {
        save: async () => {},
        saveMany: async () => {},
        findById: async () => null,
        findAll: async () => [],
        findEnabled: async () => {
          throw new Error('rules db failed');
        },
        deleteById: async () => {},
      },
    });

    await expect(refresh.execute()).rejects.toMatchObject({
      code: 'QUERY_FAILED',
      message: /Could not load classification rules/,
    });
  });

  it('maps classifier failure to ANALYTICS_FAILED', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await seedSnapchatSession(sessions);
    const refresh = createRefresh(sessions, new InMemoryClassificationRuleRepository(), {
      activityClassifier: {
        classify: () => {
          throw new Error('classifier exploded');
        },
      },
    });

    await expect(refresh.execute()).rejects.toMatchObject({
      code: 'ANALYTICS_FAILED',
      message: /Could not apply classification rules/,
    });
  });

  it('applies USER_OVERRIDE precedence in the Today pipeline', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await seedSnapchatSession(sessions);
    const overrideRule: ClassificationRule = {
      id: 'override-snap',
      packageName: SNAPCHAT,
      classification: ActivityClassification.PRODUCTIVE,
      source: ClassificationSource.USER_OVERRIDE,
      priority: 0,
      enabled: true,
    };
    await rules.save(
      buildAppUserClassificationRule(SNAPCHAT, ActivityClassification.WASTE),
    );
    await rules.save(overrideRule);

    const result = await createRefresh(sessions, rules).execute();
    expect(result.dashboard.productiveMs).toBe(THIRTY_MIN_MS);
    expect(result.dashboard.wasteMs).toBe(0);
    expect(result.dashboard.totalLostMs).toBe(0);
  });
});
