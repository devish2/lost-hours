import type { SqlExecutor } from '../database/SqlExecutor';
import { migrations } from './migrations';

async function getUserVersion(executor: SqlExecutor): Promise<number> {
  const result = executor.executeSync
    ? executor.executeSync('PRAGMA user_version')
    : await executor.execute('PRAGMA user_version');
  const row = result.rows[0];
  const version = row?.user_version;
  return typeof version === 'number' ? version : Number(version ?? 0);
}

/**
 * Applies pending migrations in order inside transactions.
 * Throws on failure; does not continue after a failed migration.
 */
export async function runMigrations(executor: SqlExecutor): Promise<void> {
  const currentVersion = await getUserVersion(executor);
  const pending = migrations
    .filter(m => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await executor.transaction(async tx => {
      await migration.up(tx);
      await tx.execute(`PRAGMA user_version = ${migration.version}`);
    });
  }

  const finalVersion = await getUserVersion(executor);
  if (pending.length > 0 && finalVersion !== pending[pending.length - 1].version) {
    throw new Error(
      `Migration completed but user_version is ${finalVersion}, expected ${pending[pending.length - 1].version}`,
    );
  }
}
