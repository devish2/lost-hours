/** Read-only per-local-calendar-day analytics (epoch boundaries only). */
export type HistoricalDailyAnalyticsItem = {
  dayStartTimestamp: number;
  dayEndTimestamp: number;
  trackedDurationMs: number;
  lostDurationMs: number;
  productiveDurationMs: number;
  neutralDurationMs: number;
  leisureDurationMs: number;
  unknownDurationMs: number;
};
