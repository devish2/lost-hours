import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { getRecentLocalCalendarHistoryWindow } from './recentLocalCalendarHistoryWindow';

describe('getRecentLocalCalendarHistoryWindow', () => {
  const now = new Date(2026, 8, 25, 15, 30, 0).getTime();

  it('returns a 1-day window from today start through tomorrow start', () => {
    const todayStart = getLocalCalendarDayStart(now);
    const window = getRecentLocalCalendarHistoryWindow(now, 1);
    expect(window).toEqual({
      fromTimestamp: todayStart,
      toTimestamp: getNextLocalCalendarDayStart(todayStart),
    });
  });

  it('returns 7 local calendar dates including today', () => {
    const window = getRecentLocalCalendarHistoryWindow(now, 7);
    const todayStart = getLocalCalendarDayStart(now);
    expect(window.toTimestamp).toBe(getNextLocalCalendarDayStart(todayStart));
    expect(window.toTimestamp - window.fromTimestamp).toBeGreaterThan(0);
    expect(window.toTimestamp - window.fromTimestamp).not.toBe(6 * 86_400_000);
  });

  it('defaults to 30 local calendar dates', () => {
    const window = getRecentLocalCalendarHistoryWindow(now);
    expect(window.fromTimestamp).toBeLessThan(getLocalCalendarDayStart(now));
  });

  it('uses the supplied nowTimestamp deterministically', () => {
    const a = getRecentLocalCalendarHistoryWindow(now, 3);
    const b = getRecentLocalCalendarHistoryWindow(now, 3);
    expect(a).toEqual(b);
  });

  it('rejects zero day count', () => {
    expect(() => getRecentLocalCalendarHistoryWindow(now, 0)).toThrow(
      /positive integer/,
    );
  });

  it('rejects negative day count', () => {
    expect(() => getRecentLocalCalendarHistoryWindow(now, -1)).toThrow(
      /positive integer/,
    );
  });

  it('rejects non-integer day count', () => {
    expect(() => getRecentLocalCalendarHistoryWindow(now, 2.5)).toThrow(
      /positive integer/,
    );
  });

  it('rejects non-finite nowTimestamp', () => {
    expect(() => getRecentLocalCalendarHistoryWindow(Number.NaN, 7)).toThrow(
      /finite/,
    );
  });

  it('handles now at local midnight boundary', () => {
    const midnight = getLocalCalendarDayStart(now);
    const window = getRecentLocalCalendarHistoryWindow(midnight, 2);
    expect(window.fromTimestamp).toBeLessThanOrEqual(midnight);
    expect(window.toTimestamp).toBe(getNextLocalCalendarDayStart(midnight));
  });
});
