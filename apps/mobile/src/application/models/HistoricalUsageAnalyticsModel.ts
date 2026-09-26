import type { EffectiveUsageSessionForAnalytics } from '../classification/effectiveUsageSessionForAnalytics';

/** Read-only analytics for a half-open historical window `[fromTimestamp, toTimestamp)`. */
export type HistoricalUsageAnalyticsModel = {
  fromTimestamp: number;
  toTimestamp: number;
  trackedDurationMs: number;
  lostDurationMs: number;
  productiveDurationMs: number;
  neutralDurationMs: number;
  leisureDurationMs: number;
  unknownDurationMs: number;
  effectiveSessions: readonly EffectiveUsageSessionForAnalytics[];
};
