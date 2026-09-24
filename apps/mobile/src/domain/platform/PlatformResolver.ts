import type { AppIdentity } from '../usage/AppIdentity';
import { Platform } from './Platform';

/** Maps application identity to a known {@link Platform} (identity only, not content). */
export interface PlatformResolver {
  resolvePlatform(app: AppIdentity): Platform;
}
