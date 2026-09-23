import { UsageEventType } from '../../../domain/usage/UsageEventType';

export function mapNativeUsageEventType(
  nativeEventType: string,
): UsageEventType {
  switch (nativeEventType) {
    case UsageEventType.FOREGROUND:
      return UsageEventType.FOREGROUND;
    case UsageEventType.BACKGROUND:
      return UsageEventType.BACKGROUND;
    default:
      return UsageEventType.UNKNOWN;
  }
}
