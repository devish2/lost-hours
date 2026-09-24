import { Platform } from 'react-native';

import { AndroidUsageTrackingProvider } from './android/AndroidUsageTrackingProvider';
import { getNativeUsageTrackingModule } from './android/native/getNativeUsageTrackingModule';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from './UsageTrackingComposition';

export type CreateUsageTrackingCompositionDeps = {
  platformOs: typeof Platform.OS;
  getNativeModule: typeof getNativeUsageTrackingModule;
};

const defaultDeps: CreateUsageTrackingCompositionDeps = {
  platformOs: Platform.OS,
  getNativeModule: getNativeUsageTrackingModule,
};

/**
 * Single composition entry for {@link UsageTrackingProvider}.
 * Does not fall back to mock/demo tracking when the Android native module is missing.
 */
export function createUsageTrackingComposition(
  deps: CreateUsageTrackingCompositionDeps = defaultDeps,
): UsageTrackingComposition {
  if (deps.platformOs !== 'android') {
    return {
      kind: UsageTrackingCompositionKind.UNSUPPORTED_PLATFORM,
      provider: null,
    };
  }

  const nativeModule = deps.getNativeModule();
  if (nativeModule == null) {
    return {
      kind: UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE,
      provider: null,
    };
  }

  return {
    kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
    provider: new AndroidUsageTrackingProvider(nativeModule),
  };
}
