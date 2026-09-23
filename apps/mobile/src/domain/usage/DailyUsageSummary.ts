/** Aggregated activity for one local calendar day. */
export interface DailyUsageSummary {
  /** Local calendar date in `YYYY-MM-DD` (user's local timezone context). */
  date: string;
  totalTrackedMs: number;
  productiveMs: number;
  neutralMs: number;
  leisureMs: number;
  wasteMs: number;
  unknownMs: number;
  sessionCount: number;
  longestSessionMs: number;
}
