import type { UsageSession } from './UsageSession';

/** Deterministic read-side ordering for usage session lists. */
export function compareUsageSessionsForReadOrder(
  left: UsageSession,
  right: UsageSession,
): number {
  if (left.startTime !== right.startTime) {
    return left.startTime - right.startTime;
  }
  if (left.endTime !== right.endTime) {
    return left.endTime - right.endTime;
  }
  const packageCompare = left.app.packageName.localeCompare(
    right.app.packageName,
  );
  if (packageCompare !== 0) {
    return packageCompare;
  }
  return left.id.localeCompare(right.id);
}
