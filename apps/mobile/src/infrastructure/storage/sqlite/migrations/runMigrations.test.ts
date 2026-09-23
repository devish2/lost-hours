import type { QueryResult, Scalar } from '@op-engineering/op-sqlite';

import type { SqlExecutor, SqlTransaction } from '../database/SqlExecutor';
import { runMigrations } from './runMigrations';

function queryResult(rows: Record<string, Scalar>[]): QueryResult {
  return { rows, rowsAffected: 0 };
}

describe('runMigrations', () => {
  it('runs pending migrations in order and sets user_version', async () => {
    let userVersion = 0;
    const executed: string[] = [];

    const executor: SqlExecutor = {
      executeSync: (query: string) => {
        if (query === 'PRAGMA user_version') {
          return queryResult([{ user_version: userVersion }]);
        }
        return queryResult([]);
      },
      execute: async (query: string) => {
        executed.push(query.trim());
        if (query.startsWith('PRAGMA user_version =')) {
          userVersion = Number(query.split('=')[1].trim());
        }
        return queryResult([]);
      },
      transaction: async (fn: (tx: SqlTransaction) => Promise<void>) => {
        const tx: SqlTransaction = {
          execute: async (query: string) => {
            executed.push(`tx:${query.trim()}`);
            if (query.startsWith('PRAGMA user_version =')) {
              userVersion = Number(query.split('=')[1].trim());
            }
            return queryResult([]);
          },
        };
        await fn(tx);
      },
    };

    await runMigrations(executor);

    expect(userVersion).toBe(1);
    expect(executed.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS usage_sessions'))).toBe(
      true,
    );
    expect(executed.some(sql => sql.includes('PRAGMA user_version = 1'))).toBe(true);
  });

  it('skips migrations when schema is current', async () => {
    let transactionCount = 0;
    const executor: SqlExecutor = {
      executeSync: () => queryResult([{ user_version: 1 }]),
      execute: async () => queryResult([]),
      transaction: async fn => {
        transactionCount += 1;
        await fn({ execute: async () => queryResult([]) });
      },
    };

    await runMigrations(executor);
    expect(transactionCount).toBe(0);
  });
});
