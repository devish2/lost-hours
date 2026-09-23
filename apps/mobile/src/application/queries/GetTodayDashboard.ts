import { DefaultDailyUsageAggregator } from '../../domain/usage/DefaultDailyUsageAggregator';
import { DefaultLostTimeCalculator } from '../../domain/lost-time/DefaultLostTimeCalculator';
import type { DailyUsageAggregator } from '../../domain/usage/DailyUsageAggregator';
import type { LostTimeCalculator } from '../../domain/lost-time/LostTimeCalculator';
import type { UsageSession } from '../../domain/session/UsageSession';
import { Platform } from '../../domain/platform/Platform';
import type {
  PlatformLostTimeEntry,
  TodayDashboardModel,
} from '../models/TodayDashboardModel';

export type GetTodayDashboardDeps = {
  dailyUsageAggregator?: DailyUsageAggregator;
  lostTimeCalculator?: LostTimeCalculator;
};

function sortLostByPlatform(
  byPlatform: Partial<Record<Platform, number>>,
): PlatformLostTimeEntry[] {
  const entries: PlatformLostTimeEntry[] = [];
  for (const platform of Object.values(Platform)) {
    const lostMs = byPlatform[platform];
    if (lostMs != null && lostMs > 0) {
      entries.push({ platform, lostMs });
    }
  }
  entries.sort((a, b) => b.lostMs - a.lostMs);
  return entries;
}

export class GetTodayDashboard {
  private readonly dailyUsageAggregator: DailyUsageAggregator;
  private readonly lostTimeCalculator: LostTimeCalculator;

  constructor(deps: GetTodayDashboardDeps = {}) {
    this.dailyUsageAggregator =
      deps.dailyUsageAggregator ?? new DefaultDailyUsageAggregator();
    this.lostTimeCalculator =
      deps.lostTimeCalculator ?? new DefaultLostTimeCalculator();
  }

  execute(
    date: string,
    sessions: readonly UsageSession[],
  ): TodayDashboardModel {
    const daily = this.dailyUsageAggregator.aggregate(date, sessions);
    const lost = this.lostTimeCalculator.calculate(sessions);

    return {
      date: daily.date,
      totalTrackedMs: daily.totalTrackedMs,
      totalLostMs: lost.totalLostMs,
      productiveMs: daily.productiveMs,
      neutralMs: daily.neutralMs,
      leisureMs: daily.leisureMs,
      wasteMs: daily.wasteMs,
      unknownMs: daily.unknownMs,
      lostSessionCount: lost.sessionCount,
      lostByPlatform: sortLostByPlatform(lost.byPlatform),
    };
  }
}
