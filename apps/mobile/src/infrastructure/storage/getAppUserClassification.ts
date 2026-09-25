import type { AppUserClassification } from '../../application/use-cases/AppUserClassification';
import { createAppUserClassification } from './createAppUserClassification';
import { getAppStorage } from './getAppStorage';

export class AppClassificationStorageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AppClassificationStorageError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

/**
 * Returns AppUserClassification backed by the memoized app SQLite storage.
 * Uses the same database lifecycle as session persistence (no second connection).
 */
export async function getAppUserClassification(): Promise<AppUserClassification> {
  try {
    const storage = await getAppStorage();
    return createAppUserClassification(
      storage.repositories.classificationRules,
    );
  } catch (error) {
    throw new AppClassificationStorageError(
      'Classification storage is unavailable',
      error,
    );
  }
}
