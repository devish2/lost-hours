import type { DailyUsageSummary } from '../../../../domain/usage/DailyUsageSummary';
import type { DailyUsageSummaryRow } from './rows';

export function dailyUsageSummaryToInsertParams(
  summary: DailyUsageSummary,
  updatedAt: number,
): (string | number)[] {
  return [
    summary.date,
    summary.totalTrackedMs,
    summary.productiveMs,
    summary.neutralMs,
    summary.leisureMs,
    summary.wasteMs,
    summary.unknownMs,
    summary.sessionCount,
    summary.longestSessionMs,
    updatedAt,
  ];
}

export function dailyUsageSummaryRowToDomain(
  row: DailyUsageSummaryRow,
): DailyUsageSummary {
  return {
    date: row.date,
    totalTrackedMs: row.total_tracked_ms,
    productiveMs: row.productive_ms,
    neutralMs: row.neutral_ms,
    leisureMs: row.leisure_ms,
    wasteMs: row.waste_ms,
    unknownMs: row.unknown_ms,
    sessionCount: row.session_count,
    longestSessionMs: row.longest_session_ms,
  };
}

export const DAILY_USAGE_SUMMARY_UPSERT_SQL = `
INSERT INTO daily_usage_summaries (
  date,
  total_tracked_ms,
  productive_ms,
  neutral_ms,
  leisure_ms,
  waste_ms,
  unknown_ms,
  session_count,
  longest_session_ms,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(date) DO UPDATE SET
  total_tracked_ms = excluded.total_tracked_ms,
  productive_ms = excluded.productive_ms,
  neutral_ms = excluded.neutral_ms,
  leisure_ms = excluded.leisure_ms,
  waste_ms = excluded.waste_ms,
  unknown_ms = excluded.unknown_ms,
  session_count = excluded.session_count,
  longest_session_ms = excluded.longest_session_ms,
  updated_at = excluded.updated_at
`;
