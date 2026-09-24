import { TrackingSource } from '../usage/TrackingSource';

/** Deterministic session id from stable facts (no randomness). */
export function deriveUsageSessionId(input: {
  packageName: string;
  startTime: number;
  endTime: number;
  trackingSource: TrackingSource;
}): string {
  return `${input.trackingSource}|${input.packageName}|${input.startTime}|${input.endTime}`;
}
