import { AndroidAppMetadataProvider } from './AndroidAppMetadataProvider';
import type { NativeUsageTrackingModule } from './native/NativeUsageTrackingModule';

function createNativeModuleStub(
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

describe('AndroidAppMetadataProvider', () => {
  it('deduplicates package names before calling native getAppMetadata', async () => {
    const getAppMetadata = jest.fn(async () => [
      { packageName: 'com.whatsapp', displayName: 'WhatsApp' },
    ]);
    const provider = new AndroidAppMetadataProvider(
      createNativeModuleStub({ getAppMetadata }),
    );

    await provider.getAppMetadata([
      'com.whatsapp',
      ' com.whatsapp ',
      'com.whatsapp',
    ]);

    expect(getAppMetadata).toHaveBeenCalledWith(['com.whatsapp']);
  });

  it('maps native metadata and omits blank display names', async () => {
    const provider = new AndroidAppMetadataProvider(
      createNativeModuleStub({
        getAppMetadata: async () => [
          { packageName: 'com.linkedin.android', displayName: ' LinkedIn ' },
          { packageName: 'com.example.missing', displayName: '  ' },
        ],
      }),
    );

    const metadata = await provider.getAppMetadata(['com.linkedin.android']);
    expect(metadata).toEqual([
      { packageName: 'com.linkedin.android', displayName: 'LinkedIn' },
      { packageName: 'com.example.missing' },
    ]);
  });

  it('returns empty list for empty input without native call', async () => {
    const getAppMetadata = jest.fn(async () => []);
    const provider = new AndroidAppMetadataProvider(
      createNativeModuleStub({ getAppMetadata }),
    );
    await expect(provider.getAppMetadata([])).resolves.toEqual([]);
    expect(getAppMetadata).not.toHaveBeenCalled();
  });
});
