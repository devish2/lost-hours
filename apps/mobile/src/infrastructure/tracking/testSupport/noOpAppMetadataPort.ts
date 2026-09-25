import type { AppMetadataPort } from '../../../domain/usage/AppMetadataPort';

/** Test double that skips native PackageManager lookups. */
export const noOpAppMetadataPort: AppMetadataPort = {
  getAppMetadata: async () => [],
};
