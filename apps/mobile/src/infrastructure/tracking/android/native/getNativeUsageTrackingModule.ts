import { NativeModules, Platform } from 'react-native';

import type { NativeUsageTrackingModule } from './NativeUsageTrackingModule';

/** Must match {@link LostHoursUsageTrackingModule.NAME} on Android. */
export const LOST_HOURS_USAGE_TRACKING_MODULE_NAME = 'LostHoursUsageTracking';

/**
 * Returns the Android native usage-tracking module when registered.
 * Used by {@link createUsageTrackingComposition} at app startup (D2.4).
 */
export function getNativeUsageTrackingModule(): NativeUsageTrackingModule | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  const nativeModule = NativeModules[LOST_HOURS_USAGE_TRACKING_MODULE_NAME] as
    | NativeUsageTrackingModule
    | undefined;

  return nativeModule ?? null;
}
