import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
  getPreviousLocalCalendarDayStart,
} from '../time/localCalendarDay';
import { formatHistoryDayLabel } from './formatHistoryDayLabel';

describe('formatHistoryDayLabel', () => {
  const now = new Date(2026, 8, 25, 18, 0, 0).getTime();
  const todayStart = getLocalCalendarDayStart(now);

  it('labels today', () => {
    expect(formatHistoryDayLabel(now, todayStart)).toBe('Today');
  });

  it('labels yesterday by local calendar date', () => {
    const yesterdayStart = getPreviousLocalCalendarDayStart(todayStart);
    expect(formatHistoryDayLabel(now, yesterdayStart)).toBe('Yesterday');
  });

  it('labels older days with a short local date', () => {
    const older = getPreviousLocalCalendarDayStart(
      getPreviousLocalCalendarDayStart(todayStart),
    );
    const label = formatHistoryDayLabel(now, older);
    expect(label).not.toBe('Today');
    expect(label).not.toBe('Yesterday');
    expect(label.length).toBeGreaterThan(0);
  });

  it('treats next calendar day after now as neither Today nor Yesterday', () => {
    const tomorrow = getNextLocalCalendarDayStart(todayStart);
    expect(formatHistoryDayLabel(now, tomorrow)).not.toBe('Today');
    expect(formatHistoryDayLabel(now, tomorrow)).not.toBe('Yesterday');
  });
});
