export type BaselineStatus = 'COLLECTING' | 'READY';

export type BaselineProgress = {
  status: BaselineStatus;
  observedCalendarDays: number;
  targetCalendarDays: number;
  firstObservedAt?: number;
  lastObservedAt?: number;
  trackedDurationMs: number;
};
