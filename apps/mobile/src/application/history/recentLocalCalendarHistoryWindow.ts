import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
  getPreviousLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';

export const DEFAULT_HISTORY_LOCAL_CALENDAR_DAYS = 30;

export type RecentLocalCalendarHistoryWindow = {
  fromTimestamp: number;
  toTimestamp: number;
};

export function getRecentLocalCalendarHistoryWindow(
  nowTimestamp: number,
  numberOfLocalCalendarDays: number = DEFAULT_HISTORY_LOCAL_CALENDAR_DAYS,
): RecentLocalCalendarHistoryWindow {
  if (!Number.isFinite(nowTimestamp)) {
    throw new Error(
      `Invalid history window: nowTimestamp must be finite (got ${nowTimestamp})`,
    );
  }
  if (
    !Number.isInteger(numberOfLocalCalendarDays) ||
    numberOfLocalCalendarDays < 1
  ) {
    throw new Error(
      `Invalid history window: numberOfLocalCalendarDays must be a positive integer (got ${numberOfLocalCalendarDays})`,
    );
  }

  const todayStart = getLocalCalendarDayStart(nowTimestamp);
  const toTimestamp = getNextLocalCalendarDayStart(todayStart);

  let fromTimestamp = todayStart;
  for (let index = 1; index < numberOfLocalCalendarDays; index += 1) {
    fromTimestamp = getPreviousLocalCalendarDayStart(fromTimestamp);
  }

  return { fromTimestamp, toTimestamp };
}
