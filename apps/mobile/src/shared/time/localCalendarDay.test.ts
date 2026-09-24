import {
  getElapsedLocalDayWindow,
  getLocalCalendarDayStart,
  getLocalCalendarDateString,
  getNextLocalCalendarDayStart,
} from './localCalendarDay';

describe('localCalendarDay', () => {
  it('uses local calendar midnight boundaries', () => {
    const now = new Date(2024, 5, 15, 10, 30, 0).getTime();
    const start = getLocalCalendarDayStart(now);
    expect(start).toBe(new Date(2024, 5, 15, 0, 0, 0).getTime());
    expect(getLocalCalendarDateString(now)).toBe('2024-06-15');
    expect(getNextLocalCalendarDayStart(now)).toBe(
      new Date(2024, 5, 16, 0, 0, 0).getTime(),
    );
  });

  it('returns elapsed window [todayStart, now)', () => {
    const start = new Date(2024, 5, 15, 0, 0, 0).getTime();
    const now = new Date(2024, 5, 15, 10, 0, 0).getTime();
    const window = getElapsedLocalDayWindow(now);
    expect(window).toEqual({
      date: '2024-06-15',
      fromTimestamp: start,
      toTimestamp: now,
    });
  });

  it('returns null for zero-length window at local midnight', () => {
    const midnight = new Date(2024, 5, 15, 0, 0, 0).getTime();
    expect(getElapsedLocalDayWindow(midnight)).toBeNull();
  });

  it('uses a new elapsed window after local midnight on refresh boundaries', () => {
    const lateNight = new Date(2024, 5, 15, 23, 59, 0).getTime();
    const afterMidnight = new Date(2024, 5, 16, 0, 5, 0).getTime();

    const before = getElapsedLocalDayWindow(lateNight);
    const after = getElapsedLocalDayWindow(afterMidnight);

    expect(before?.date).toBe('2024-06-15');
    expect(after?.date).toBe('2024-06-16');
    expect(before?.fromTimestamp).not.toBe(after?.fromTimestamp);
    expect(after?.fromTimestamp).toBe(getLocalCalendarDayStart(afterMidnight));
  });

  it('computes next day via calendar semantics', () => {
    const jan31 = new Date(2024, 0, 31, 12, 0, 0).getTime();
    expect(getNextLocalCalendarDayStart(jan31)).toBe(
      new Date(2024, 1, 1, 0, 0, 0).getTime(),
    );
  });
});
