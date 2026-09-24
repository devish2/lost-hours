import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import { UsageTrackingCompositionKind } from '../../infrastructure/tracking/UsageTrackingComposition';

/** Local UI phases for UsagePermissionScreen (not domain permission enums). */
export type UsagePermissionUiPhase =
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unknown'
  | 'error'
  | 'unavailable'
  | 'unsupported';

export function mapPermissionStatusToUiPhase(
  status: UsageTrackingPermissionStatus,
): UsagePermissionUiPhase {
  switch (status) {
    case UsageTrackingPermissionStatus.GRANTED:
      return 'granted';
    case UsageTrackingPermissionStatus.DENIED:
      return 'denied';
    case UsageTrackingPermissionStatus.UNKNOWN:
      return 'unknown';
    default:
      return 'unknown';
  }
}

export function uiPhaseFromCompositionKind(
  kind: UsageTrackingCompositionKind,
): UsagePermissionUiPhase {
  switch (kind) {
    case UsageTrackingCompositionKind.ANDROID_NATIVE:
      return 'loading';
    case UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE:
      return 'unavailable';
    case UsageTrackingCompositionKind.UNSUPPORTED_PLATFORM:
      return 'unsupported';
    default:
      return 'error';
  }
}

export function canContinueFromUiPhase(phase: UsagePermissionUiPhase): boolean {
  return phase === 'granted';
}

export const PERMISSION_CHECK_ERROR_MESSAGE =
  'Could not check Usage Access. Try again.';

export const SETTINGS_OPEN_ERROR_MESSAGE =
  'Could not open Usage Access settings. Try again.';

export const ONBOARDING_PERSIST_ERROR_MESSAGE =
  'Could not save onboarding progress. Retry Continue.';
