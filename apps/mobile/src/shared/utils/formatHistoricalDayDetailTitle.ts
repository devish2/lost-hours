import {
  getLocalCalendarDateString,
  getLocalCalendarDayStart,
  getPreviousLocalCalendarDayStart,
} from '../time/localCalendarDay';

/** Screen title for an observed local calendar day (presentation only). */
export function formatHistoricalDayDetailTitle(
  dayStartTimestamp: number,
  nowTimestamp: number,
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

  const date = new Date(dayStartTimestamp);
  const month = date
    .toLocaleDateString(undefined, { month: 'short' })
    .toUpperCase();
  return `${month} ${date.getDate()}`;
}
