import { Platform } from './Platform';
import { PackageNamePlatformResolver } from './PackageNamePlatformResolver';

describe('PackageNamePlatformResolver', () => {
  const resolver = new PackageNamePlatformResolver();

  it('maps known Android packages to product platforms', () => {
    expect(
      resolver.resolvePlatform({ packageName: 'com.instagram.android' }),
    ).toBe(Platform.INSTAGRAM);
    expect(
      resolver.resolvePlatform({ packageName: 'com.google.android.youtube' }),
    ).toBe(Platform.YOUTUBE);
  });

  it('falls back to OTHER for unknown packages', () => {
    expect(
      resolver.resolvePlatform({ packageName: 'com.example.unknown' }),
    ).toBe(Platform.OTHER);
  });
});
