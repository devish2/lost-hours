import type { UsageEvent } from '../../../domain/usage/UsageEvent';
import { TrackingSource } from '../../../domain/usage/TrackingSource';
import type { NativeUsageEvent } from './native/NativeUsageEvent';
import { mapNativeUsageEventType } from './mapNativeUsageEventType';

export function mapNativeUsageEventToDomain(
  nativeEvent: NativeUsageEvent,
): UsageEvent {
  return {
    timestamp: nativeEvent.timestamp,
    app: {
      packageName: nativeEvent.packageName,
      ...(nativeEvent.displayName !== undefined
        ? { displayName: nativeEvent.displayName }
        : {}),
    },
    eventType: mapNativeUsageEventType(nativeEvent.eventType),
    trackingSource: TrackingSource.ANDROID_USAGE_STATS,
  };
}
