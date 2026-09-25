import { Platform } from './Platform';
import {
  ANDROID_PACKAGE_PLATFORM_CATALOG,
  resolvePlatformFromAndroidPackage,
} from './androidPackagePlatformCatalog';
import { PackageNamePlatformResolver } from './PackageNamePlatformResolver';

describe('ANDROID_PACKAGE_PLATFORM_CATALOG', () => {
  it('lists only exact approved package → platform mappings', () => {
    expect(ANDROID_PACKAGE_PLATFORM_CATALOG).toEqual({
      'com.instagram.android': Platform.INSTAGRAM,
      'com.google.android.youtube': Platform.YOUTUBE,
      'com.facebook.katana': Platform.FACEBOOK,
      'com.twitter.android': Platform.X,
      'com.reddit.frontpage': Platform.REDDIT,
      'com.linkedin.android': Platform.LINKEDIN,
    });
  });
});

describe('resolvePlatformFromAndroidPackage', () => {
  it.each([
    ['com.instagram.android', Platform.INSTAGRAM],
    ['com.google.android.youtube', Platform.YOUTUBE],
    ['com.facebook.katana', Platform.FACEBOOK],
    ['com.twitter.android', Platform.X],
    ['com.reddit.frontpage', Platform.REDDIT],
    ['com.linkedin.android', Platform.LINKEDIN],
  ] as const)('maps %s → %s', (packageName, platform) => {
    expect(resolvePlatformFromAndroidPackage(packageName)).toBe(platform);
  });

  it.each([
    'com.whatsapp',
    'com.snapchat.android',
    'com.android.chrome',
    'com.spotify.music',
    'com.example.unknown',
  ])('maps unlisted package %s → OTHER', packageName => {
    expect(resolvePlatformFromAndroidPackage(packageName)).toBe(Platform.OTHER);
  });

  it('does not map package-name substrings (Chrome safety contract)', () => {
    expect(resolvePlatformFromAndroidPackage('com.android.chrome')).toBe(
      Platform.OTHER,
    );
    expect(
      resolvePlatformFromAndroidPackage('com.instagram.android.evil'),
    ).toBe(Platform.OTHER);
    expect(resolvePlatformFromAndroidPackage('not.com.instagram.android')).toBe(
      Platform.OTHER,
    );
  });
});

describe('PackageNamePlatformResolver', () => {
  const resolver = new PackageNamePlatformResolver();

  it('delegates to exact package catalog via AppIdentity.packageName', () => {
    expect(
      resolver.resolvePlatform({ packageName: 'com.linkedin.android' }),
    ).toBe(Platform.LINKEDIN);
    expect(
      resolver.resolvePlatform({
        packageName: 'com.snapchat.android',
        displayName: 'Snapchat',
      }),
    ).toBe(Platform.OTHER);
  });
});
