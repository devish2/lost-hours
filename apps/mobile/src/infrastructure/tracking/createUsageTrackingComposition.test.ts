import { UsageTrackingPermissionStatus } from './UsageTrackingPermissionStatus';
import { UsageTrackingCompositionKind } from './UsageTrackingComposition';
import { createUsageTrackingComposition } from './createUsageTrackingComposition';
import { AndroidUsageTrackingProvider } from './android/AndroidUsageTrackingProvider';
import type { NativeUsageTrackingModule } from './android/native/NativeUsageTrackingModule';

function createNativeModuleStub(
  overrides: Partial<NativeUsageTrackingModule> = {},
): NativeUsageTrackingModule {
  return {
    getPermissionStatus: async () => 'GRANTED',
    openUsageAccessSettings: async () => {},
    getUsageEvents: async () => [],
    ...overrides,
  };
}

describe('createUsageTrackingComposition', () => {
  it('composes AndroidUsageTrackingProvider when native module is registered', () => {
    const nativeModule = createNativeModuleStub();
    const composition = createUsageTrackingComposition({
      platformOs: 'android',
      getNativeModule: () => nativeModule,
    });

    expect(composition.kind).toBe(UsageTrackingCompositionKind.ANDROID_NATIVE);
    expect(composition.provider).toBeInstanceOf(AndroidUsageTrackingProvider);
  });

  it('marks Android native module unavailable without mock fallback', () => {
    const composition = createUsageTrackingComposition({
      platformOs: 'android',
      getNativeModule: () => null,
    });

    expect(composition.kind).toBe(
      UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE,
    );
    expect(composition.provider).toBeNull();
  });

  it('marks non-Android platforms as unsupported', () => {
    const composition = createUsageTrackingComposition({
      platformOs: 'ios',
      getNativeModule: () => createNativeModuleStub(),
    });

    expect(composition.kind).toBe(
      UsageTrackingCompositionKind.UNSUPPORTED_PLATFORM,
    );
    expect(composition.provider).toBeNull();
  });

  it('exposes getUsageEvents through the composed Android provider', async () => {
    const getUsageEvents = jest.fn(async () => [
      {
        packageName: 'com.example.app',
        timestamp: 100,
        eventType: 'FOREGROUND' as const,
      },
    ]);
    const composition = createUsageTrackingComposition({
      platformOs: 'android',
      getNativeModule: () => createNativeModuleStub({ getUsageEvents }),
    });

    if (composition.provider == null) {
      throw new Error('expected provider');
    }

    const events = await composition.provider.getUsageEvents(0, 500);
    expect(getUsageEvents).toHaveBeenCalledWith(0, 500);
    expect(events).toHaveLength(1);
    expect(await composition.provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.GRANTED,
    );
  });
});
