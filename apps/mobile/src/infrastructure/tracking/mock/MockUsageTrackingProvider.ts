import type { UsageEvent } from '../../../domain/usage/UsageEvent';
import type { UsageTrackingProvider } from '../UsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../UsageTrackingPermissionStatus';
import { filterUsageEventsByTimeRange } from '../filterUsageEventsByTimeRange';
import { validateUsageTimeRange } from '../validateUsageTimeRange';

export interface MockUsageTrackingProviderOptions {
  permissionStatus?: UsageTrackingPermissionStatus;
  events?: readonly UsageEvent[];
  getUsageEventsError?: Error;
}

export class MockUsageTrackingProvider implements UsageTrackingProvider {
  private readonly permissionStatus: UsageTrackingPermissionStatus;
  private readonly events: readonly UsageEvent[];
  private readonly getUsageEventsError?: Error;
  private permissionSettingsOpened = false;

  constructor(options: MockUsageTrackingProviderOptions = {}) {
    this.permissionStatus =
      options.permissionStatus ?? UsageTrackingPermissionStatus.UNKNOWN;
    this.events = options.events ?? [];
    this.getUsageEventsError = options.getUsageEventsError;
  }

  getPermissionSettingsOpened(): boolean {
    return this.permissionSettingsOpened;
  }

  async getPermissionStatus(): Promise<UsageTrackingPermissionStatus> {
    return this.permissionStatus;
  }

  async openPermissionSettings(): Promise<void> {
    this.permissionSettingsOpened = true;
  }

  async getUsageEvents(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly UsageEvent[]> {
    validateUsageTimeRange(fromTimestamp, toTimestamp);
    if (this.getUsageEventsError) {
      throw this.getUsageEventsError;
    }
    return filterUsageEventsByTimeRange(
      this.events,
      fromTimestamp,
      toTimestamp,
    );
  }
}
