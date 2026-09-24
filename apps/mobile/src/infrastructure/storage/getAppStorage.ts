import {
  createInitializedStorage,
  type InitializedStorage,
} from './createInitializedStorage';

let storagePromise: Promise<InitializedStorage> | null = null;

/**
 * Lazily opens SQLite once per app runtime (explicit; not on module import).
 * Failed initialization clears the in-flight memo so a later call can retry.
 */
export function getAppStorage(): Promise<InitializedStorage> {
  if (storagePromise == null) {
    storagePromise = createInitializedStorage().catch(error => {
      storagePromise = null;
      return Promise.reject(error);
    });
  }
  return storagePromise;
}

/** Test helper to reset memoized storage. */
export function resetAppStorageForTests(): void {
  storagePromise = null;
}
