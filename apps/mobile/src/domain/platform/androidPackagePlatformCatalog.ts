import { Platform } from './Platform';

/**
 * Exact Android package name → Lost Hours Platform identity.
 * No substring/heuristic matching. Unknown packages are not listed here.
 */
export const ANDROID_PACKAGE_PLATFORM_CATALOG: Readonly<
  Record<string, Platform>
> = Object.freeze({
  'com.instagram.android': Platform.INSTAGRAM,
  'com.google.android.youtube': Platform.YOUTUBE,
  'com.facebook.katana': Platform.FACEBOOK,
  'com.twitter.android': Platform.X,
  'com.reddit.frontpage': Platform.REDDIT,
  'com.linkedin.android': Platform.LINKEDIN,
});

/** Resolves platform from an exact package name, or OTHER when unmapped. */
export function resolvePlatformFromAndroidPackage(
  packageName: string,
): Platform {
  return ANDROID_PACKAGE_PLATFORM_CATALOG[packageName] ?? Platform.OTHER;
}
