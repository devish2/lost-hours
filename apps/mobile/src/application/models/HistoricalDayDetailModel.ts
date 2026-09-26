import type { AppUsageBreakdownItem } from './AppUsageBreakdownItem';

export type HistoricalDayAppItem = AppUsageBreakdownItem;

export interface HistoricalDayDetailModel {
  dayStartTimestamp: number;
  dayEndTimestamp: number;

  trackedDurationMs: number;
  lostDurationMs: number;

  productiveDurationMs: number;
  neutralDurationMs: number;
  leisureDurationMs: number;
  unknownDurationMs: number;

  apps: readonly HistoricalDayAppItem[];
}
