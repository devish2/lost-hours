import type { UsageEvent } from '../../domain/usage/UsageEvent';
import { UsageTrackingPermissionStatus } from './UsageTrackingPermissionStatus';

/**
 * Retrieves low-level usage observations from a platform source.
 * {@link getUsageEvents} uses **[fromTimestamp, toTimestamp)** on event timestamps (epoch ms).
 */
export interface UsageTrackingProvider {
  getPermissionStatus(): Promise<UsageTrackingPermissionStatus>;

  openPermissionSettings(): Promise<void>;

  getUsageEvents(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly UsageEvent[]>;
}
