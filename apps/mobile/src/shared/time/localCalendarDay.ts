/** Local calendar date string `YYYY-MM-DD` for epoch ms in the device timezone. */
export function getLocalCalendarDateString(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local start of calendar day containing `timestampMs` (epoch ms). */
export function getLocalCalendarDayStart(timestampMs: number): number {
  const date = new Date(timestampMs);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Local start of the next calendar day after `timestampMs`. */
export function getNextLocalCalendarDayStart(timestampMs: number): number {
  const date = new Date(timestampMs);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  ).getTime();
}

export type ElapsedLocalDayWindow = {
  date: string;
  fromTimestamp: number;
  toTimestamp: number;
};

/**
 * Elapsed portion of the local calendar day **[todayStart, now)**.
 * Returns null when `now <= todayStart` (zero-length window at local midnight).
 */
export function getElapsedLocalDayWindow(
  nowMs: number,
): ElapsedLocalDayWindow | null {
  const fromTimestamp = getLocalCalendarDayStart(nowMs);
  if (nowMs <= fromTimestamp) {
    return null;
  }
  return {
    date: getLocalCalendarDateString(nowMs),
    fromTimestamp,
    toTimestamp: nowMs,
  };
}
