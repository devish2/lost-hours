import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { GetTodayDashboard } from './GetTodayDashboard';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import {
  getElapsedLocalDayWindow,
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { GetBaselineProgress } from './GetBaselineProgress';
import { GetHistoricalDailyAnalyticsForRange } from './GetHistoricalDailyAnalyticsForRange';
import { GetHistoricalUsageAnalyticsForRange } from './GetHistoricalUsageAnalyticsForRange';
import { GetUsageSessionsForRange } from './GetUsageSessionsForRange';
import { BaselineProgressError } from '../baseline/BaselineProgressError';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import { GetHistory } from './GetHistory';
import { getRecentLocalCalendarHistoryWindow } from '../history/recentLocalCalendarHistoryWindow';

const SNAPCHAT = 'com.snapchat.android';
const MIN_MS = 60 * 1000;

function sessionOnLocalDay(
  anchorDayStart: number,
  dayOffset: number,
  id: string,
  durationMs = 60_000,
) {
  let dayStart = anchorDayStart;
  for (let i = 0; i < dayOffset; i += 1) {
    dayStart = getNextLocalCalendarDayStart(dayStart);
  }
  return createUsageSession({
    id,
    startTime: dayStart + 1_000,
    endTime: dayStart + 1_000 + durationMs,
    durationMs,
  });
}

function createGetHistory(deps: {
  sessions: InMemoryUsageSessionRepository;
  rules?: InMemoryClassificationRuleRepository;
}) {
  const rules = deps.rules ?? new InMemoryClassificationRuleRepository();
  const rangeQuery = new GetHistoricalUsageAnalyticsForRange({
    getUsageSessionsForRange: new GetUsageSessionsForRange(deps.sessions),
    classificationRuleRepository: rules,
  });
  return new GetHistory({
    getHistoricalDailyAnalyticsForRange: new GetHistoricalDailyAnalyticsForRange(
      { getHistoricalUsageAnalyticsForRange: rangeQuery },
    ),
    getBaselineProgress: new GetBaselineProgress({
      usageSessionRepository: deps.sessions,
    }),
  });
}

describe('GetHistory (D4.5)', () => {
  const anchor = getLocalCalendarDayStart(
    new Date(2026, 8, 25, 12, 0, 0).getTime(),
  );
  const now = anchor + 14 * 60 * MIN_MS;

  it('returns empty days with COLLECTING baseline when there is no usage', async () => {
    const result = await createGetHistory({
      sessions: new InMemoryUsageSessionRepository(),
    }).execute({ nowTimestamp: now });
    expect(result.days).toEqual([]);
    expect(result.baseline.status).toBe('COLLECTING');
    expect(result.baseline.observedCalendarDays).toBe(0);
  });

  it('orders days newest-first without mutating domain daily output', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    await sessions.saveMany([
      sessionOnLocalDay(anchor, 0, 'd0'),
      sessionOnLocalDay(anchor, 1, 'd1'),
      sessionOnLocalDay(anchor, 2, 'd2'),
    ]);
    const day2Now =
      getNextLocalCalendarDayStart(getNextLocalCalendarDayStart(anchor)) +
      12 * 60 * MIN_MS;
    const getHistory = createGetHistory({ sessions });
    const window = getRecentLocalCalendarHistoryWindow(day2Now, 30);
    const ascending = await new GetHistoricalDailyAnalyticsForRange({
      getHistoricalUsageAnalyticsForRange: new GetHistoricalUsageAnalyticsForRange(
        {
          getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
          classificationRuleRepository:
            new InMemoryClassificationRuleRepository(),
        },
      ),
    }).execute(window);
    const ascendingCopy = ascending.map(d => d.dayStartTimestamp);
    const history = await getHistory.execute({
      nowTimestamp: day2Now,
      numberOfLocalCalendarDays: 30,
    });
    expect(history.days.map(d => d.dayStartTimestamp)).toEqual([
      ...ascendingCopy,
    ].reverse());
  });

  it('excludes usage older than the recent History window but keeps it in baseline', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const oldDay = getLocalCalendarDayStart(anchor);
    let cursor = oldDay;
    for (let i = 0; i < 40; i += 1) {
      await sessions.save(
        createUsageSession({
          id: `old-${i}`,
          startTime: cursor + 1_000,
          endTime: cursor + 2_000,
          durationMs: 1_000,
        }),
      );
      cursor = getNextLocalCalendarDayStart(cursor);
    }
    const history = await createGetHistory({ sessions }).execute({
      nowTimestamp: now,
      numberOfLocalCalendarDays: 30,
    });
    expect(history.days.length).toBeLessThan(40);
    expect(history.baseline.observedCalendarDays).toBe(40);
    expect(history.baseline.status).toBe('READY');
  });

  it('reflects current-effective reclassification on History days', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    const appClassification = createAppUserClassification(rules);
    await sessions.save(
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        startTime: anchor + 1_000,
        endTime: anchor + 60 * MIN_MS,
        durationMs: 60 * MIN_MS - 1_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    );
    const getHistory = createGetHistory({ sessions, rules });
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let history = await getHistory.execute({ nowTimestamp: now, numberOfLocalCalendarDays: 7 });
    expect(history.days[0]?.lostDurationMs).toBe(60 * MIN_MS - 1_000);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    history = await getHistory.execute({ nowTimestamp: now, numberOfLocalCalendarDays: 7 });
    expect(history.days[0]?.lostDurationMs).toBe(0);
    expect(history.days[0]?.productiveDurationMs).toBe(60 * MIN_MS - 1_000);

    await appClassification.clearClassification(SNAPCHAT);
    history = await getHistory.execute({ nowTimestamp: now, numberOfLocalCalendarDays: 7 });
    expect(history.days[0]?.unknownDurationMs).toBe(60 * MIN_MS - 1_000);
  });

  it('reconciles Today elapsed window totals with the historical pipeline', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    await createAppUserClassification(rules).setClassification(
      'com.example.app',
      ActivityClassification.WASTE,
    );
    await sessions.save(
      createUsageSession({
        id: 'today',
        startTime: anchor + 2 * MIN_MS,
        endTime: anchor + 32 * MIN_MS,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    );
    const window = getElapsedLocalDayWindow(now)!;
    const range = await new GetHistoricalUsageAnalyticsForRange({
      getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
      classificationRuleRepository: rules,
    }).execute({
      fromTimestamp: window.fromTimestamp,
      toTimestamp: window.toTimestamp,
    });
    const dashboard = new GetTodayDashboard().execute(
      window.date,
      range.effectiveSessions,
    );
    expect(dashboard.totalTrackedMs).toBe(30 * MIN_MS);
    expect(dashboard.totalLostMs).toBe(30 * MIN_MS);
  });

  it('maps baseline query failure to HistoryError', async () => {
    const sessions = new InMemoryUsageSessionRepository();
    const getHistory = new GetHistory({
      getHistoricalDailyAnalyticsForRange: new GetHistoricalDailyAnalyticsForRange(
        {
          getHistoricalUsageAnalyticsForRange:
            new GetHistoricalUsageAnalyticsForRange({
              getUsageSessionsForRange: new GetUsageSessionsForRange(sessions),
              classificationRuleRepository:
                new InMemoryClassificationRuleRepository(),
            }),
        },
      ),
      getBaselineProgress: {
        execute: jest.fn(async () => {
          throw new BaselineProgressError('SESSION_QUERY_FAILED', 'fail');
        }),
      } as never,
    });
    await expect(getHistory.execute({ nowTimestamp: now })).rejects.toMatchObject({
      code: 'BASELINE_QUERY_FAILED',
    });
  });

  it('maps historical query failure to HistoryError', async () => {
    const getHistory = new GetHistory({
      getHistoricalDailyAnalyticsForRange: {
        execute: jest.fn(async () => {
          throw new HistoricalUsageAnalyticsError(
            'SESSION_QUERY_FAILED',
            'fail',
          );
        }),
      } as never,
      getBaselineProgress: {
        execute: jest.fn(async () => ({
          status: 'COLLECTING',
          observedCalendarDays: 0,
          targetCalendarDays: 7,
          trackedDurationMs: 0,
        })),
      } as never,
    });
    await expect(getHistory.execute({ nowTimestamp: now })).rejects.toMatchObject({
      code: 'HISTORICAL_QUERY_FAILED',
    });
  });

  it('rejects invalid window parameters', async () => {
    await expect(
      createGetHistory({ sessions: new InMemoryUsageSessionRepository() }).execute(
        { nowTimestamp: now, numberOfLocalCalendarDays: 0 },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_WINDOW' });
  });
});
