import { computePaceProjection, type PaceProjectionInput } from './paceProjection';

const FOUR_H_THIRTY_SEVEN_M_MS = 4 * 3_600_000 + 37 * 60_000;

describe('computePaceProjection', () => {
  it('returns zero equivalents when observed Lost is zero', () => {
    expect(
      computePaceProjection({
        observedLostDurationMs: 0,
        observedCalendarDays: 7,
      }),
    ).toEqual({
      dailyLostAverageMs: 0,
      thirtyDayEquivalentMs: 0,
      threeHundredSixtyFiveDayEquivalentMs: 0,
    });
  });

  it('returns zero equivalents when observed calendar days is zero', () => {
    expect(
      computePaceProjection({
        observedLostDurationMs: FOUR_H_THIRTY_SEVEN_M_MS,
        observedCalendarDays: 0,
      }),
    ).toEqual({
      dailyLostAverageMs: 0,
      thirtyDayEquivalentMs: 0,
      threeHundredSixtyFiveDayEquivalentMs: 0,
    });
  });

  it('computes daily average and equivalents for a 7-day observation', () => {
    const result = computePaceProjection({
      observedLostDurationMs: FOUR_H_THIRTY_SEVEN_M_MS,
      observedCalendarDays: 7,
    });
    const days = 7;
    const lost = FOUR_H_THIRTY_SEVEN_M_MS;
    expect(result.dailyLostAverageMs).toBe(Math.floor(lost / days));
    expect(result.thirtyDayEquivalentMs).toBe(Math.floor((lost * 30) / days));
    expect(result.threeHundredSixtyFiveDayEquivalentMs).toBe(
      Math.floor((lost * 365) / days),
    );
  });

  it('does not truncate daily average before scaling equivalents', () => {
    const result = computePaceProjection({
      observedLostDurationMs: 10_000,
      observedCalendarDays: 3,
    });
    expect(result.dailyLostAverageMs).toBe(3_333);
    expect(result.thirtyDayEquivalentMs).toBe(100_000);
    expect(result.threeHundredSixtyFiveDayEquivalentMs).toBe(
      Math.floor((10_000 * 365) / 3),
    );
    expect(result.thirtyDayEquivalentMs).not.toBe(result.dailyLostAverageMs * 30);
  });

  it('rejects negative observed Lost duration', () => {
    expect(() =>
      computePaceProjection({
        observedLostDurationMs: -1,
        observedCalendarDays: 7,
      }),
    ).toThrow(/observedLostDurationMs must be >= 0/);
  });

  it('rejects non-integer observed calendar days', () => {
    expect(() =>
      computePaceProjection({
        observedLostDurationMs: 1_000,
        observedCalendarDays: 1.5,
      }),
    ).toThrow(/observedCalendarDays must be a non-negative integer/);
  });

  it('does not mutate structured input', () => {
    const input: PaceProjectionInput = {
      observedLostDurationMs: 70_000,
      observedCalendarDays: 7,
    };
    const snapshot = { ...input };
    computePaceProjection(input);
    expect(input).toEqual(snapshot);
  });
});
