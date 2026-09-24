import type { NativeUsageEvent } from './NativeUsageEvent';

/** TypeScript contract for the Android native usage-tracking module (RN name: LostHoursUsageTracking). */
export interface NativeUsageTrackingModule {
  getPermissionStatus(): Promise<string>;

  openUsageAccessSettings(): Promise<void>;

  getUsageEvents(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly NativeUsageEvent[]>;
}
