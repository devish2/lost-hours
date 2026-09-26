import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { getLocalCalendarDayAnalyticsWindow } from './localCalendarDayWindow';

describe('getLocalCalendarDayAnalyticsWindow', () => {
  it('returns half-open local day window without fixed 24h math', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 2, 8, 15, 0, 0).getTime(),
    );
    const window = getLocalCalendarDayAnalyticsWindow(dayStart);
    expect(window.fromTimestamp).toBe(dayStart);
    expect(window.toTimestamp).toBe(getNextLocalCalendarDayStart(dayStart));
    expect(window.toTimestamp).toBeGreaterThan(window.fromTimestamp);
  });

  it('normalizes non-midnight dayStartTimestamp to local day start', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 25, 18, 30, 0).getTime(),
    );
    const noon = dayStart + 12 * 60 * 60 * 1000;
    const window = getLocalCalendarDayAnalyticsWindow(noon);
    expect(window.fromTimestamp).toBe(dayStart);
  });
});
