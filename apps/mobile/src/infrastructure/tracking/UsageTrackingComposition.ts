import type { UsageTrackingProvider } from './UsageTrackingProvider';

/** How usage tracking is wired at app composition time (not raw permission state). */
export enum UsageTrackingCompositionKind {
  /** Android with registered LostHoursUsageTracking native module. */
  ANDROID_NATIVE = 'ANDROID_NATIVE',
  /** Android build/runtime without the native module (not mock/demo data). */
  ANDROID_NATIVE_UNAVAILABLE = 'ANDROID_NATIVE_UNAVAILABLE',
  /** iOS and other non-Android platforms (no Usage Access APIs). */
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM',
}

export type UsageTrackingComposition =
  | {
      kind: UsageTrackingCompositionKind.ANDROID_NATIVE;
      provider: UsageTrackingProvider;
    }
  | {
      kind: UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE;
      provider: null;
    }
  | {
      kind: UsageTrackingCompositionKind.UNSUPPORTED_PLATFORM;
      provider: null;
    };
