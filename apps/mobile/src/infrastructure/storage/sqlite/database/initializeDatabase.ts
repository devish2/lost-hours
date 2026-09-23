import { runMigrations } from '../migrations/runMigrations';
import { SqliteDatabase } from './SqliteDatabase';

const PRAGMA_FOREIGN_KEYS = 'PRAGMA foreign_keys = ON';

async function configureDatabase(db: SqliteDatabase): Promise<void> {
  await db.execute(PRAGMA_FOREIGN_KEYS);
}

/**
 * Opens SQLite, applies pragmas, and runs pending migrations.
 * Call once during app bootstrap (not from UI components directly).
 */
export async function initializeDatabase(): Promise<SqliteDatabase> {
  const db = SqliteDatabase.open();
  await configureDatabase(db);
  await runMigrations(db);
  return db;
}
