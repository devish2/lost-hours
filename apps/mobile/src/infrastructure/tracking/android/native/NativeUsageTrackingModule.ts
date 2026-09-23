import type { NativeUsageEvent } from './NativeUsageEvent';

/** TypeScript contract for the future Android native usage-tracking module. */
export interface NativeUsageTrackingModule {
  getPermissionStatus(): Promise<string>;

  openUsageAccessSettings(): Promise<void>;

  getUsageEvents(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly NativeUsageEvent[]>;
}
