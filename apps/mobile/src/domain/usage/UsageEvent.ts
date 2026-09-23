import type { AppIdentity } from './AppIdentity';
import { TrackingSource } from './TrackingSource';
import { UsageEventType } from './UsageEventType';

/** Low-level observation from a tracking provider (epoch milliseconds). */
export interface UsageEvent {
  timestamp: number;
  app: AppIdentity;
  eventType: UsageEventType;
  trackingSource: TrackingSource;
}
