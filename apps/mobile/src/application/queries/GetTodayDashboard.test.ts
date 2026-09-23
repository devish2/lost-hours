import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import type { UsageSession } from '../../domain/session/UsageSession';
import type { DailyUsageSummary } from '../../domain/usage/DailyUsageSummary';
import type { LostTimeSummary } from '../../domain/lost-time/LostTimeSummary';
import type { DailyUsageAggregator } from '../../domain/usage/DailyUsageAggregator';
import type { LostTimeCalculator } from '../../domain/lost-time/LostTimeCalculator';
import { createDemoUsageSessions } from '../../features/dashboard/demo/createDemoUsageSessions';
import { DEMO_DASHBOARD_DATE } from '../../features/dashboard/demo/demoConstants';
import { GetTodayDashboard } from './GetTodayDashboard';

describe('GetTodayDashboard', () => {
  it('composes demo sessions into expected dashboard totals', () => {
    const query = new GetTodayDashboard();
    const model = query.execute(
      DEMO_DASHBOARD_DATE,
      createDemoUsageSessions(),
    );

    expect(model.date).toBe(DEMO_DASHBOARD_DATE);
    expect(model.totalTrackedMs).toBe(5 * 3_600_000 + 12 * 60_000);
    expect(model.totalLostMs).toBe(2 * 3_600_000 + 41 * 60_000);
    expect(model.productiveMs).toBe(78 * 60_000);
    expect(model.neutralMs).toBe(34 * 60_000);
    expect(model.leisureMs).toBe(39 * 60_000);
    expect(model.wasteMs).toBe(model.totalLostMs);
    expect(model.unknownMs).toBe(0);
    expect(model.lostSessionCount).toBe(3);
    expect(model.lostByPlatform.map(entry => entry.platform)).toEqual([
      Platform.INSTAGRAM,
      Platform.YOUTUBE,
      Platform.REDDIT,
    ]);
    expect(model.lostByPlatform[0]?.lostMs).toBe(84 * 60_000);
  });

  it('returns zero dashboard for empty sessions', () => {
    const query = new GetTodayDashboard();
    const model = query.execute('2026-01-01', []);

    expect(model.totalTrackedMs).toBe(0);
    expect(model.totalLostMs).toBe(0);
    expect(model.lostSessionCount).toBe(0);
    expect(model.lostByPlatform).toEqual([]);
  });

  it('does not mutate input sessions', () => {
    const sessions = createDemoUsageSessions();
    const snapshot = JSON.stringify(sessions);
    const query = new GetTodayDashboard();
    query.execute(DEMO_DASHBOARD_DATE, sessions);
    expect(JSON.stringify(sessions)).toBe(snapshot);
  });

  it('uses injected aggregators', () => {
    const daily: DailyUsageSummary = {
      date: '2026-04-01',
      totalTrackedMs: 120_000,
      productiveMs: 120_000,
      neutralMs: 0,
      leisureMs: 0,
      wasteMs: 0,
      unknownMs: 0,
      sessionCount: 1,
      longestSessionMs: 120_000,
    };
    const lost: LostTimeSummary = {
      totalLostMs: 30_000,
      sessionCount: 1,
      byPlatform: { [Platform.REDDIT]: 30_000 },
      byContentType: {},
    };

    const dailyUsageAggregator: DailyUsageAggregator = {
      aggregate: jest.fn(() => daily),
    };
    const lostTimeCalculator: LostTimeCalculator = {
      calculate: jest.fn(() => lost),
    };

    const query = new GetTodayDashboard({
      dailyUsageAggregator,
      lostTimeCalculator,
    });

    const input: UsageSession[] = [
      createUsageSession({
        id: 'x',
        classification: ActivityClassification.WASTE,
        durationMs: 30_000,
        platform: Platform.REDDIT,
      }),
    ];

    const model = query.execute('2026-04-01', input);

    expect(dailyUsageAggregator.aggregate).toHaveBeenCalledWith(
      '2026-04-01',
      input,
    );
    expect(lostTimeCalculator.calculate).toHaveBeenCalledWith(input);
    expect(model.totalTrackedMs).toBe(120_000);
    expect(model.totalLostMs).toBe(30_000);
    expect(model.lostByPlatform).toEqual([
      { platform: Platform.REDDIT, lostMs: 30_000 },
    ]);
  });
});
