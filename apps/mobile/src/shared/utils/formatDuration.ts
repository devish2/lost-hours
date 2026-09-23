/**
 * Formats a duration for dashboard display.
 * Floors to whole minutes (no seconds). Values below one minute show as "0m".
 * Negative values display as "0m" (presentation only; domain values are unchanged).
 */
export function formatDuration(durationMs: number): string {
  if (durationMs <= 0) {
    return '0m';
  }

  const totalMinutes = Math.floor(durationMs / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
