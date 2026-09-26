import {
  getLocalCalendarDateString,
  getLocalCalendarDayStart,
  getPreviousLocalCalendarDayStart,
} from '../time/localCalendarDay';

/** Presentation label for a History day row (device-local calendar). */
export function formatHistoryDayLabel(
  nowTimestamp: number,
  dayStartTimestamp: number,
): string {
  const todayKey = getLocalCalendarDateString(nowTimestamp);
  const dayKey = getLocalCalendarDateString(dayStartTimestamp);
  if (dayKey === todayKey) {
    return 'Today';
  }

  const yesterdayStart = getPreviousLocalCalendarDayStart(
    getLocalCalendarDayStart(nowTimestamp),
  );
  if (dayStartTimestamp === yesterdayStart) {
    return 'Yesterday';
  }

  return new Date(dayStartTimestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
