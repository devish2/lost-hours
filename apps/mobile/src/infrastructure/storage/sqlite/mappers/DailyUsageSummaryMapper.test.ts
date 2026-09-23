import {
  dailyUsageSummaryRowToDomain,
  dailyUsageSummaryToInsertParams,
} from './DailyUsageSummaryMapper';
import type { DailyUsageSummaryRow } from './rows';

describe('DailyUsageSummaryMapper', () => {
  it('round-trips daily summary', () => {
    const summary = {
      date: '2026-09-23',
      totalTrackedMs: 10_000,
      productiveMs: 1_000,
      neutralMs: 2_000,
      leisureMs: 3_000,
      wasteMs: 4_000,
      unknownMs: 0,
      sessionCount: 5,
      longestSessionMs: 4_000,
    };
    const updatedAt = 999;
    const params = dailyUsageSummaryToInsertParams(summary, updatedAt);
    const row: DailyUsageSummaryRow = {
      date: params[0] as string,
      total_tracked_ms: params[1] as number,
      productive_ms: params[2] as number,
      neutral_ms: params[3] as number,
      leisure_ms: params[4] as number,
      waste_ms: params[5] as number,
      unknown_ms: params[6] as number,
      session_count: params[7] as number,
      longest_session_ms: params[8] as number,
      updated_at: params[9] as number,
    };

    expect(dailyUsageSummaryRowToDomain(row)).toEqual(summary);
  });
});
