import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { aggregateUsageByApp } from '../../domain/analytics/aggregateUsageByApp';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { GetHistoricalDayDetail } from './GetHistoricalDayDetail';
import { GetHistoricalUsageAnalyticsForRange } from './GetHistoricalUsageAnalyticsForRange';
import { GetTodayDashboard } from './GetTodayDashboard';
import { GetUsageSessionsForRange } from './GetUsageSessionsForRange';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';

const SNAPCHAT = 'com.snapchat.android';
const MIN_MS = 60 * 1000;

function createGetHistoricalDayDetail(deps: {
  sessions: InMemoryUsageSessionRepository;
  rules?: InMemoryClassificationRuleRepository;
}) {
  const rules = deps.rules ?? new InMemoryClassificationRuleRepository();
  return new GetHistoricalDayDetail({
    getHistoricalUsageAnalyticsForRange: new GetHistoricalUsageAnalyticsForRange(
      {
        getUsageSessionsForRange: new GetUsageSessionsForRange(deps.sessions),
        classificationRuleRepository: rules,
      },
    ),
  });
}

describe('GetHistoricalDayDetail (D4.6)', () => {
  const dayStart = getLocalCalendarDayStart(
    new Date(2026, 8, 25, 12, 0, 0).getTime(),
  );

  it('returns empty success for a day with no usage', async () => {
    const detail = await createGetHistoricalDayDetail({
      sessions: new InMemoryUsageSessionRepository(),
    }).execute({ dayStartTimestamp: dayStart });

    expect(detail.dayStartTimestamp).toBe(dayStart);
    expect(detail.dayEndTimestamp).toBe(getNextLocalCalendarDayStart(dayStart));
    expect(detail.trackedDurationMs).toBe(0);
    expect(detail.lostDurationMs).toBe(0);
    expect(detail.apps).toEqual([]);
  });

  it('reconciles app totals with day totals for canonical usage', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        startTime: dayStart + 1_000,
        endTime: dayStart + 31 * MIN_MS,
        durationMs: 30 * MIN_MS - 1_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    );
    const rules = new InMemoryClassificationRuleRepository();
    await createAppUserClassification(rules).setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );

    const detail = await createGetHistoricalDayDetail({
      sessions,
      rules,
    }).execute({ dayStartTimestamp: dayStart });

    const appTracked = detail.apps.reduce(
      (sum, row) => sum + row.trackedDurationMs,
      0,
    );
    const appLost = detail.apps.reduce((sum, row) => sum + row.lostDurationMs, 0);
    expect(appTracked).toBe(detail.trackedDurationMs);
    expect(appLost).toBe(detail.lostDurationMs);
    expect(
      detail.productiveDurationMs +
        detail.neutralDurationMs +
        detail.leisureDurationMs +
        detail.unknownDurationMs +
        detail.lostDurationMs,
    ).toBe(detail.trackedDurationMs);
  });

  it('clips midnight-crossing WASTE into each local day', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await createAppUserClassification(rules).setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    const day2Start = getNextLocalCalendarDayStart(dayStart);
    const crossStart = dayStart + 23 * 60 * MIN_MS + 45 * MIN_MS;
    const crossEnd = day2Start + 15 * MIN_MS;
    await sessions.save(
      createUsageSession({
        id: 'cross',
        app: { packageName: SNAPCHAT },
        startTime: crossStart,
        endTime: crossEnd,
        durationMs: crossEnd - crossStart,
        classification: ActivityClassification.UNKNOWN,
      }),
    );

    const day1 = await createGetHistoricalDayDetail({ sessions, rules }).execute(
      { dayStartTimestamp: dayStart },
    );
    const day2 = await createGetHistoricalDayDetail({ sessions, rules }).execute(
      { dayStartTimestamp: day2Start },
    );

    expect(day1.trackedDurationMs).toBe(15 * MIN_MS);
    expect(day1.lostDurationMs).toBe(15 * MIN_MS);
    expect(day2.trackedDurationMs).toBe(15 * MIN_MS);
    expect(day2.lostDurationMs).toBe(15 * MIN_MS);
  });

  it('reflects current-effective reclassification without mutating stored sessions', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    const appClassification = createAppUserClassification(rules);
    const stored = createUsageSession({
      id: 'snap',
      app: { packageName: SNAPCHAT },
      startTime: dayStart + 1_000,
      endTime: dayStart + 60 * MIN_MS,
      durationMs: 60 * MIN_MS - 1_000,
      classification: ActivityClassification.UNKNOWN,
    });
    await sessions.save(stored);
    const storedSnapshot = JSON.stringify(stored);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let detail = await createGetHistoricalDayDetail({ sessions, rules }).execute(
      { dayStartTimestamp: dayStart },
    );
    expect(detail.apps[0]?.lostDurationMs).toBe(60 * MIN_MS - 1_000);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    detail = await createGetHistoricalDayDetail({ sessions, rules }).execute({
      dayStartTimestamp: dayStart,
    });
    expect(detail.apps[0]?.lostDurationMs).toBe(0);
    expect(detail.apps[0]?.classification).toBe(ActivityClassification.PRODUCTIVE);

    await appClassification.clearClassification(SNAPCHAT);
    detail = await createGetHistoricalDayDetail({ sessions, rules }).execute({
      dayStartTimestamp: dayStart,
    });
    expect(detail.apps[0]?.classification).toBe(ActivityClassification.UNKNOWN);

    const persisted = await sessions.findAllChronological();
    expect(JSON.stringify(persisted[0])).toBe(storedSnapshot);
  });

  it('reconciles Today per-app breakdown with Day Detail for the same window', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await createAppUserClassification(rules).setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    await sessions.save(
      createUsageSession({
        id: 'a',
        app: { packageName: SNAPCHAT, displayName: 'Snapchat' },
        startTime: dayStart + 2 * MIN_MS,
        endTime: dayStart + 32 * MIN_MS,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    );

    const window = {
      fromTimestamp: dayStart,
      toTimestamp: getNextLocalCalendarDayStart(dayStart),
    };
    const range = await new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
      classificationRuleRepository: rules,
    }).execute(window);

    const todayApps = aggregateUsageByApp(range.effectiveSessions);
    const detail = await createGetHistoricalDayDetail({ sessions, rules }).execute(
      { dayStartTimestamp: dayStart },
    );

    expect(detail.apps).toEqual(todayApps);
    const dashboard = new GetTodayDashboard().execute(
      '2026-09-25',
      range.effectiveSessions,
    );
    expect(dashboard.apps).toEqual(detail.apps);
  });

  it('maps session query failure to HistoricalDayDetailError', async () => {
    const query = new GetHistoricalDayDetail({
      getHistoricalUsageAnalyticsForRange: {
        execute: jest.fn(async () => {
          throw new HistoricalUsageAnalyticsError(
            'SESSION_QUERY_FAILED',
            'fail',
          );
        }),
      } as unknown as GetHistoricalUsageAnalyticsForRange,
    });
    await expect(query.execute({ dayStartTimestamp: dayStart })).rejects.toMatchObject(
      { code: 'SESSION_QUERY_FAILED' },
    );
  });

  it('maps rule query failure to HistoricalDayDetailError', async () => {
    const query = new GetHistoricalDayDetail({
      getHistoricalUsageAnalyticsForRange: {
        execute: jest.fn(async () => {
          throw new HistoricalUsageAnalyticsError('RULE_QUERY_FAILED', 'fail');
        }),
      } as unknown as GetHistoricalUsageAnalyticsForRange,
    });
    await expect(query.execute({ dayStartTimestamp: dayStart })).rejects.toMatchObject(
      { code: 'RULE_QUERY_FAILED' },
    );
  });
});
