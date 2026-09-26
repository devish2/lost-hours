import type { BaselineProgress } from '../../domain/baseline/BaselineProgress';

export type HistoryDayItem = {
  dayStartTimestamp: number;
  dayEndTimestamp: number;
  trackedDurationMs: number;
  lostDurationMs: number;
  productiveDurationMs: number;
  neutralDurationMs: number;
  leisureDurationMs: number;
  unknownDurationMs: number;
};

export type HistoryModel = {
  fromTimestamp: number;
  toTimestamp: number;
  baseline: BaselineProgress;
  days: readonly HistoryDayItem[];
};
