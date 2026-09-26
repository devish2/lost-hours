import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import { GetHistoricalDailyAnalyticsForRange } from './GetHistoricalDailyAnalyticsForRange';
import { GetHistoricalUsageAnalyticsForRange } from './GetHistoricalUsageAnalyticsForRange';
import { GetUsageSessionsForRange } from './GetUsageSessionsForRange';

const MIN_MS = 60 * 1000;
const SNAPCHAT = 'com.snapchat.android';
/** Epoch window large enough for local-calendar test fixtures (2026+). */
const WIDE_FROM = 0;
const WIDE_TO = 2_000_000_000_000;

function createDailyQuery(deps: {
  sessions: InMemoryUsageSessionRepository;
  rules?: InMemoryClassificationRuleRepository;
}) {
  const rules = deps.rules ?? new InMemoryClassificationRuleRepository();
  const rangeQuery = new GetHistoricalUsageAnalyticsForRange({
    getUsageSessionsForRange: new GetUsageSessionsForRange(deps.sessions),
    classificationRuleRepository: rules,
  });
  return new GetHistoricalDailyAnalyticsForRange({
    getHistoricalUsageAnalyticsForRange: rangeQuery,
  });
}

describe('GetHistoricalDailyAnalyticsForRange (D4.3)', () => {
  it('returns empty array for valid range with no sessions', async () => {
    const query = createDailyQuery({ sessions: new InMemoryUsageSessionRepository() });
    await expect(
      query.execute({ fromTimestamp: 10_000, toTimestamp: 20_000 }),
    ).resolves.toEqual([]);
  });

  it('reconciles sum of daily tracked and lost with outer range analytics', async () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 22, 0, 0, 0).getTime(),
    );
    const dayTwo = getNextLocalCalendarDayStart(dayStart);
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.saveMany([
      createUsageSession({
        id: 'd1',
        classification: ActivityClassification.WASTE,
        startTime: dayStart + 10 * MIN_MS,
        endTime: dayStart + 40 * MIN_MS,
        durationMs: 30 * MIN_MS,
      }),
      createUsageSession({
        id: 'cross',
        classification: ActivityClassification.WASTE,
        startTime: dayTwo - 15 * MIN_MS,
        endTime: dayTwo + 15 * MIN_MS,
        durationMs: 30 * MIN_MS,
      }),
    ]);
    const rangeQuery = new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
      classificationRuleRepository: new InMemoryClassificationRuleRepository(),
    });
    const dailyQuery = new GetHistoricalDailyAnalyticsForRange({
      getHistoricalUsageAnalyticsForRange: rangeQuery,
    });
    const range = await rangeQuery.execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    const daily = await dailyQuery.execute({
      fromTimestamp: WIDE_FROM,
      toTimestamp: WIDE_TO,
    });
    const trackedSum = daily.reduce((s, d) => s + d.trackedDurationMs, 0);
    const lostSum = daily.reduce((s, d) => s + d.lostDurationMs, 0);
    expect(trackedSum).toBe(range.trackedDurationMs);
    expect(lostSum).toBe(range.lostDurationMs);
    expect(daily).toHaveLength(2);
  });

  it('applies current-effective rules per day without resync', async () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 27, 0, 0, 0).getTime(),
    );
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    const appClassification = createAppUserClassification(rules);
    await sessions.save(
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        startTime: dayStart + 1_000,
        endTime: dayStart + 60 * MIN_MS,
        durationMs: 60 * MIN_MS - 1_000,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
    );
    const query = createDailyQuery({ sessions, rules });
    const window = { fromTimestamp: WIDE_FROM, toTimestamp: WIDE_TO };

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let daily = await query.execute(window);
    expect(daily[0]?.lostDurationMs).toBe(60 * MIN_MS - 1_000);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    daily = await query.execute(window);
    expect(daily[0]?.lostDurationMs).toBe(0);
    expect(daily[0]?.productiveDurationMs).toBe(60 * MIN_MS - 1_000);

    await appClassification.clearClassification(SNAPCHAT);
    daily = await query.execute(window);
    expect(daily[0]?.unknownDurationMs).toBe(60 * MIN_MS - 1_000);
    expect(sessions.allSessions()[0]?.classification).toBe(
      ActivityClassification.UNKNOWN,
    );
  });

  it('respects outer-window clipping from D4.2 before daily split', async () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 28, 0, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.save(
      createUsageSession({
        id: 'cross',
        startTime: nextDay - 20 * MIN_MS,
        endTime: nextDay + 20 * MIN_MS,
        durationMs: 40 * MIN_MS,
      }),
    );
    const query = createDailyQuery({ sessions });
    const range = await new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
      classificationRuleRepository: new InMemoryClassificationRuleRepository(),
    }).execute({
      fromTimestamp: nextDay - 10 * MIN_MS,
      toTimestamp: nextDay + 10 * MIN_MS,
    });
    const daily = await query.execute({
      fromTimestamp: nextDay - 10 * MIN_MS,
      toTimestamp: nextDay + 10 * MIN_MS,
    });
    expect(range.trackedDurationMs).toBe(20 * MIN_MS);
    expect(daily).toHaveLength(2);
    expect(daily.reduce((s, d) => s + d.trackedDurationMs, 0)).toBe(20 * MIN_MS);
  });

  it('propagates D4.2 SESSION_QUERY_FAILED instead of empty daily data', async () => {
    const failingRepo = {
      findOverlapping: jest.fn(async () => {
        throw new Error('db locked');
      }),
    };
    const rangeQuery = new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(
        failingRepo as never,
      ),
      classificationRuleRepository: new InMemoryClassificationRuleRepository(),
    });
    const dailyQuery = new GetHistoricalDailyAnalyticsForRange({
      getHistoricalUsageAnalyticsForRange: rangeQuery,
    });
    await expect(
      dailyQuery.execute({ fromTimestamp: 0, toTimestamp: 10_000 }),
    ).rejects.toMatchObject({ code: 'SESSION_QUERY_FAILED' });
  });

  it('propagates HistoricalUsageAnalyticsError from range query', async () => {
    const rangeQuery = {
      execute: jest.fn(async () => {
        throw new HistoricalUsageAnalyticsError(
          'RULE_QUERY_FAILED',
          'rules failed',
        );
      }),
    };
    const dailyQuery = new GetHistoricalDailyAnalyticsForRange({
      getHistoricalUsageAnalyticsForRange: rangeQuery as never,
    });
    await expect(
      dailyQuery.execute({ fromTimestamp: 0, toTimestamp: 10_000 }),
    ).rejects.toMatchObject({ code: 'RULE_QUERY_FAILED' });
  });
});
