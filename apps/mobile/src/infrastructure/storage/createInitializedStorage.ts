import { createSqliteRepositories, type SqliteRepositories } from './sqlite/createSqliteRepositories';
import { initializeDatabase } from './sqlite/database/initializeDatabase';
import type { SqliteDatabase } from './sqlite/database/SqliteDatabase';

export type InitializedStorage = {
  db: SqliteDatabase;
  repositories: SqliteRepositories;
};

/**
 * Opens SQLite, runs migrations, and constructs repositories.
 * Not invoked from App startup in D2.6 — call explicitly before sync/persistence.
 */
export async function createInitializedStorage(): Promise<InitializedStorage> {
  const db = await initializeDatabase();
  return {
    db,
    repositories: createSqliteRepositories(db),
  };
}
