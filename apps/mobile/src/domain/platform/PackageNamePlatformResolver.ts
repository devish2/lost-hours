import type { AppIdentity } from '../usage/AppIdentity';
import { resolvePlatformFromAndroidPackage } from './androidPackagePlatformCatalog';
import type { PlatformResolver } from './PlatformResolver';
import type { Platform } from './Platform';

/** Domain resolver: exact Android package → Platform (identity only, not classification). */
export class PackageNamePlatformResolver implements PlatformResolver {
  resolvePlatform(app: AppIdentity): Platform {
    return resolvePlatformFromAndroidPackage(app.packageName);
  }
}
