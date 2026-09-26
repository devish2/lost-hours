export type PaceProjectionInput = {
  /** Sum of Lost (WASTE) duration in the observation period (ms). */
  observedLostDurationMs: number;
  /** Distinct local calendar days in the observation period (>= 1 when computing pace). */
  observedCalendarDays: number;
};

export type PaceProjection = {
  dailyLostAverageMs: number;
  thirtyDayEquivalentMs: number;
  threeHundredSixtyFiveDayEquivalentMs: number;
};

function validatePaceProjectionInput(input: PaceProjectionInput): void {
  if (!Number.isFinite(input.observedLostDurationMs)) {
    throw new Error(
      'Invalid pace projection input: observedLostDurationMs must be finite',
    );
  }
  if (input.observedLostDurationMs < 0) {
    throw new Error(
      'Invalid pace projection input: observedLostDurationMs must be >= 0',
    );
  }
  if (
    !Number.isInteger(input.observedCalendarDays) ||
    input.observedCalendarDays < 0
  ) {
    throw new Error(
      'Invalid pace projection input: observedCalendarDays must be a non-negative integer',
    );
  }
}

/**
 * Linear pace equivalents from observed Lost duration — contextualization, not prediction.
 *
 * dailyLostAverageMs = floor(observedLostDurationMs / observedCalendarDays)
 * thirtyDayEquivalentMs = floor((observedLostDurationMs * 30) / observedCalendarDays)
 * threeHundredSixtyFiveDayEquivalentMs =
 *   floor((observedLostDurationMs * 365) / observedCalendarDays)
 *
 * Equivalents scale before the final floor so the daily average is not truncated early.
 *
 * When observedCalendarDays is 0, all outputs are 0 (no division).
 */
export function computePaceProjection(
  input: PaceProjectionInput,
): PaceProjection {
  validatePaceProjectionInput(input);

  if (input.observedCalendarDays === 0) {
    return {
      dailyLostAverageMs: 0,
      thirtyDayEquivalentMs: 0,
      threeHundredSixtyFiveDayEquivalentMs: 0,
    };
  }

  const { observedLostDurationMs, observedCalendarDays } = input;
  const dailyLostAverageMs = Math.floor(
    observedLostDurationMs / observedCalendarDays,
  );

  return {
    dailyLostAverageMs,
    thirtyDayEquivalentMs: Math.floor(
      (observedLostDurationMs * 30) / observedCalendarDays,
    ),
    threeHundredSixtyFiveDayEquivalentMs: Math.floor(
      (observedLostDurationMs * 365) / observedCalendarDays,
    ),
  };
}
