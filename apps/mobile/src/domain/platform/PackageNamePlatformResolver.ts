import type { AppIdentity } from '../usage/AppIdentity';
import { Platform } from './Platform';
import type { PlatformResolver } from './PlatformResolver';

/** Known Android package → product platform mappings (factual app identity, not content). */
const PACKAGE_TO_PLATFORM: Readonly<Record<string, Platform>> = {
  'com.instagram.android': Platform.INSTAGRAM,
  'com.google.android.youtube': Platform.YOUTUBE,
  'com.facebook.katana': Platform.FACEBOOK,
  'com.twitter.android': Platform.X,
  'com.reddit.frontpage': Platform.REDDIT,
  'com.linkedin.android': Platform.LINKEDIN,
};

export class PackageNamePlatformResolver implements PlatformResolver {
  resolvePlatform(app: AppIdentity): Platform {
    return PACKAGE_TO_PLATFORM[app.packageName] ?? Platform.OTHER;
  }
}
