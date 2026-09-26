/** Default observed local calendar days before baseline is READY for first Time Receipt. */
export const DEFAULT_BASELINE_TARGET_CALENDAR_DAYS = 7;

export type BaselineReadinessConfig = {
  targetCalendarDays: number;
};

export const defaultBaselineReadinessConfig: BaselineReadinessConfig = {
  targetCalendarDays: DEFAULT_BASELINE_TARGET_CALENDAR_DAYS,
};

export function validateBaselineReadinessConfig(
  config: BaselineReadinessConfig,
): void {
  if (
    !Number.isInteger(config.targetCalendarDays) ||
    config.targetCalendarDays < 1
  ) {
    throw new Error(
      `Invalid baseline config: targetCalendarDays must be a positive integer (got ${config.targetCalendarDays})`,
    );
  }
}
