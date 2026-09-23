import type { UsageEvent } from '../../../domain/usage/UsageEvent';
import type { UsageTrackingProvider } from '../UsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../UsageTrackingPermissionStatus';
import { validateUsageTimeRange } from '../validateUsageTimeRange';
import { mapNativePermissionStatus } from './mapNativePermissionStatus';
import { mapNativeUsageEventToDomain } from './mapNativeUsageEventToDomain';
import type { NativeUsageTrackingModule } from './native/NativeUsageTrackingModule';

export class AndroidUsageTrackingProvider implements UsageTrackingProvider {
  constructor(private readonly nativeModule: NativeUsageTrackingModule) {}

  async getPermissionStatus(): Promise<UsageTrackingPermissionStatus> {
    const nativeStatus = await this.nativeModule.getPermissionStatus();
    return mapNativePermissionStatus(nativeStatus);
  }

  async openPermissionSettings(): Promise<void> {
    await this.nativeModule.openUsageAccessSettings();
  }

  async getUsageEvents(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<readonly UsageEvent[]> {
    validateUsageTimeRange(fromTimestamp, toTimestamp);
    const nativeEvents = await this.nativeModule.getUsageEvents(
      fromTimestamp,
      toTimestamp,
    );
    return nativeEvents.map(mapNativeUsageEventToDomain);
  }
}
