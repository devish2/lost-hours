import type { UsageSession } from './UsageSession';

/** Stable opening identity for reconciling derived session variants (excludes endTime/id). */
export type UsageSessionOpeningIdentity = {
  trackingSource: UsageSession['trackingSource'];
  packageName: string;
  startTime: number;
};

export function getUsageSessionOpeningIdentity(
  session: UsageSession,
): UsageSessionOpeningIdentity {
  return {
    trackingSource: session.trackingSource,
    packageName: session.app.packageName,
    startTime: session.startTime,
  };
}

export function matchesUsageSessionOpeningIdentity(
  left: UsageSession,
  right: UsageSession,
): boolean {
  return (
    left.trackingSource === right.trackingSource &&
    left.app.packageName === right.app.packageName &&
    left.startTime === right.startTime
  );
}
