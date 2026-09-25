import type { AppMetadata, AppMetadataPort } from '../../../domain/usage/AppMetadataPort';
import type { NativeAppMetadata } from './native/NativeAppMetadata';
import type { NativeUsageTrackingModule } from './native/NativeUsageTrackingModule';

function dedupePackageNames(packageNames: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of packageNames) {
    const packageName = raw.trim();
    if (packageName.length === 0 || seen.has(packageName)) {
      continue;
    }
    seen.add(packageName);
    ordered.push(packageName);
  }
  return ordered;
}

function mapNativeAppMetadata(entry: NativeAppMetadata): AppMetadata {
  const packageName = entry.packageName.trim();
  const displayName = entry.displayName?.trim();
  return {
    packageName,
    ...(displayName != null && displayName.length > 0
      ? { displayName }
      : {}),
  };
}

/** Android PackageManager labels via the LostHoursUsageTracking native module. */
export class AndroidAppMetadataProvider implements AppMetadataPort {
  constructor(private readonly nativeModule: NativeUsageTrackingModule) {}

  async getAppMetadata(
    packageNames: readonly string[],
  ): Promise<readonly AppMetadata[]> {
    const unique = dedupePackageNames(packageNames);
    if (unique.length === 0) {
      return [];
    }
    const nativeResults = await this.nativeModule.getAppMetadata(unique);
    return nativeResults.map(mapNativeAppMetadata);
  }
}
