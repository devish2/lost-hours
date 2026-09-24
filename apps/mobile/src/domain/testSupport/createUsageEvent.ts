import type { UsageEvent } from '../usage/UsageEvent';
import { TrackingSource } from '../usage/TrackingSource';

/** Test-only builder for deterministic UsageEvent fixtures. */
export function createUsageEvent(
  overrides: Partial<UsageEvent> &
    Pick<UsageEvent, 'timestamp' | 'eventType'>,
): UsageEvent {
  return {
    app: { packageName: 'com.example.app' },
    trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    ...overrides,
  };
}
