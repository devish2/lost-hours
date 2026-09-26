import {
  getLocalCalendarDayStart,
  getPreviousLocalCalendarDayStart,
} from '../time/localCalendarDay';
import { formatHistoricalDayDetailTitle } from './formatHistoricalDayDetailTitle';

describe('formatHistoricalDayDetailTitle', () => {
  const now = new Date(2026, 8, 25, 15, 0, 0).getTime();
  const todayStart = getLocalCalendarDayStart(now);

  it('labels today', () => {
    expect(formatHistoricalDayDetailTitle(todayStart, now)).toBe('Today');
  });

  it('labels yesterday', () => {
    const yesterday = getPreviousLocalCalendarDayStart(todayStart);
    expect(formatHistoricalDayDetailTitle(yesterday, now)).toBe('Yesterday');
  });

  it('uses short uppercase month for older dates', () => {
    const older = getPreviousLocalCalendarDayStart(
      getPreviousLocalCalendarDayStart(todayStart),
    );
    expect(formatHistoricalDayDetailTitle(older, now)).toMatch(/^[A-Z]{3} \d+$/);
  });
});
