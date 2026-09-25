import { UsageEventType } from '../../../domain/usage/UsageEventType';
import { TrackingSource } from '../../../domain/usage/TrackingSource';
import { UsageTrackingPermissionStatus } from '../UsageTrackingPermissionStatus';
import { AndroidUsageTrackingProvider } from './AndroidUsageTrackingProvider';
import type { NativeUsageEvent } from './native/NativeUsageEvent';
import type { NativeUsageTrackingModule } from './native/NativeUsageTrackingModule';

function createNativeModule(
  overrides: Partial<NativeUsageTrackingModule> = {},
): NativeUsageTrackingModule {
  return {
    getPermissionStatus: async () => 'GRANTED',
    openUsageAccessSettings: async () => {},
    getUsageEvents: async () => [],
    getAppMetadata: async () => [],
    ...overrides,
  };
}

describe('AndroidUsageTrackingProvider', () => {
  it('maps native GRANTED to GRANTED', async () => {
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getPermissionStatus: async () => 'GRANTED' }),
    );
    expect(await provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.GRANTED,
    );
  });

  it('maps native DENIED to DENIED', async () => {
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getPermissionStatus: async () => 'DENIED' }),
    );
    expect(await provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.DENIED,
    );
  });

  it('maps unknown native permission values to UNKNOWN', async () => {
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getPermissionStatus: async () => 'FUTURE_STATUS' }),
    );
    expect(await provider.getPermissionStatus()).toBe(
      UsageTrackingPermissionStatus.UNKNOWN,
    );
  });

  it('maps foreground native events to UsageEventType.FOREGROUND', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.example.app', eventType: 'FOREGROUND' },
    ];
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    const events = await provider.getUsageEvents(0, 200);
    expect(events[0]?.eventType).toBe(UsageEventType.FOREGROUND);
  });

  it('maps background native events to UsageEventType.BACKGROUND', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.example.app', eventType: 'BACKGROUND' },
    ];
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    const events = await provider.getUsageEvents(0, 200);
    expect(events[0]?.eventType).toBe(UsageEventType.BACKGROUND);
  });

  it('maps unknown native event types to UsageEventType.UNKNOWN', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.example.app', eventType: 'SYSTEM_EVENT' },
    ];
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    const events = await provider.getUsageEvents(0, 200);
    expect(events[0]?.eventType).toBe(UsageEventType.UNKNOWN);
  });

  it('maps packageName to AppIdentity', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.instagram.android', eventType: 'FOREGROUND' },
    ];
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    const events = await provider.getUsageEvents(0, 200);
    expect(events[0]?.app.packageName).toBe('com.instagram.android');
  });

  it('maps displayName only when supplied by native', async () => {
    const withName: NativeUsageEvent[] = [
      {
        timestamp: 100,
        packageName: 'com.example.app',
        eventType: 'FOREGROUND',
        displayName: 'Example',
      },
    ];
    const withoutName: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.example.app', eventType: 'FOREGROUND' },
    ];
    const providerWith = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => withName }),
    );
    const providerWithout = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => withoutName }),
    );
    expect((await providerWith.getUsageEvents(0, 200))[0]?.app.displayName).toBe(
      'Example',
    );
    expect(
      (await providerWithout.getUsageEvents(0, 200))[0]?.app.displayName,
    ).toBeUndefined();
  });

  it('always sets trackingSource to ANDROID_USAGE_STATS', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.example.app', eventType: 'FOREGROUND' },
    ];
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    const events = await provider.getUsageEvents(0, 200);
    expect(events[0]?.trackingSource).toBe(TrackingSource.ANDROID_USAGE_STATS);
  });

  it('preserves timestamps from native events', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 1_234_567, packageName: 'com.example.app', eventType: 'FOREGROUND' },
    ];
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    const events = await provider.getUsageEvents(0, 2_000_000);
    expect(events[0]?.timestamp).toBe(1_234_567);
  });

  it('forwards from/to range to the native module', async () => {
    let capturedFrom = 0;
    let capturedTo = 0;
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({
        getUsageEvents: async (from, to) => {
          capturedFrom = from;
          capturedTo = to;
          return [];
        },
      }),
    );
    await provider.getUsageEvents(100, 500);
    expect(capturedFrom).toBe(100);
    expect(capturedTo).toBe(500);
  });

  it('rejects invalid ranges before calling native getUsageEvents', async () => {
    let called = false;
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({
        getUsageEvents: async () => {
          called = true;
          return [];
        },
      }),
    );
    await expect(provider.getUsageEvents(200, 200)).rejects.toThrow(
      /Invalid usage event time range/,
    );
    expect(called).toBe(false);
  });

  it('propagates native errors', async () => {
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({
        getUsageEvents: async () => {
          throw new Error('native bridge failure');
        },
      }),
    );
    await expect(provider.getUsageEvents(0, 100)).rejects.toThrow(
      'native bridge failure',
    );
  });

  it('does not mutate native results', async () => {
    const nativeEvents: NativeUsageEvent[] = [
      { timestamp: 100, packageName: 'com.example.app', eventType: 'FOREGROUND' },
    ];
    const snapshot = JSON.stringify(nativeEvents);
    const provider = new AndroidUsageTrackingProvider(
      createNativeModule({ getUsageEvents: async () => nativeEvents }),
    );
    await provider.getUsageEvents(0, 200);
    expect(JSON.stringify(nativeEvents)).toBe(snapshot);
  });
});
