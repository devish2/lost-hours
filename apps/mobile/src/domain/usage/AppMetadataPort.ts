/** Optional human-readable label from native app metadata (not an identifier). */
export type AppMetadata = {
  packageName: string;
  displayName?: string;
};

/** Resolves display metadata for Android package names observed by tracking. */
export interface AppMetadataPort {
  getAppMetadata(
    packageNames: readonly string[],
  ): Promise<readonly AppMetadata[]>;
}
