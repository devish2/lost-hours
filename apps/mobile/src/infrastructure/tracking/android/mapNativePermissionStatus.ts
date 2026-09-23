import { UsageTrackingPermissionStatus } from '../UsageTrackingPermissionStatus';

export function mapNativePermissionStatus(
  nativeStatus: string,
): UsageTrackingPermissionStatus {
  switch (nativeStatus) {
    case UsageTrackingPermissionStatus.GRANTED:
      return UsageTrackingPermissionStatus.GRANTED;
    case UsageTrackingPermissionStatus.DENIED:
      return UsageTrackingPermissionStatus.DENIED;
    default:
      return UsageTrackingPermissionStatus.UNKNOWN;
  }
}
