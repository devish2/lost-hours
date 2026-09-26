import type { GetUsageSessionsForRangeInput } from '../queries/GetUsageSessionsForRange';

/**
 * Half-open analytics window `[fromTimestamp, toTimestamp)` in epoch ms.
 * Caller supplies boundaries; no implicit timezone or "today" conversion here.
 */
export type HistoricalAnalyticsWindow = GetUsageSessionsForRangeInput;
