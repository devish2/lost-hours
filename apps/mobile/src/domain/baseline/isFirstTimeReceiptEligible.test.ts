import { isFirstTimeReceiptEligible } from './isFirstTimeReceiptEligible';
import type { BaselineProgress } from './BaselineProgress';

function progress(
  overrides: Partial<BaselineProgress>,
): BaselineProgress {
  return {
    status: 'COLLECTING',
    observedCalendarDays: 0,
    targetCalendarDays: 7,
    trackedDurationMs: 0,
    ...overrides,
  };
}

describe('isFirstTimeReceiptEligible', () => {
  it('returns false while COLLECTING', () => {
    expect(
      isFirstTimeReceiptEligible(
        progress({ status: 'COLLECTING', observedCalendarDays: 6 }),
      ),
    ).toBe(false);
  });

  it('returns true when baseline status is READY', () => {
    expect(
      isFirstTimeReceiptEligible(
        progress({ status: 'READY', observedCalendarDays: 7 }),
      ),
    ).toBe(true);
  });
});
