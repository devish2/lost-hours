import type { DB, QueryResult, Scalar } from '@op-engineering/op-sqlite';
import { open } from '@op-engineering/op-sqlite';

import { DATABASE_FILE_NAME } from './databaseConfig';
import type { SqlExecutor, SqlTransaction } from './SqlExecutor';

export class SqliteDatabase implements SqlExecutor {
  constructor(private readonly db: DB) {}

  static open(): SqliteDatabase {
    return new SqliteDatabase(open({ name: DATABASE_FILE_NAME }));
  }

  get native(): DB {
    return this.db;
  }

  execute(query: string, params?: Scalar[]): Promise<QueryResult> {
    return this.db.execute(query, params);
  }

  executeSync(query: string, params?: Scalar[]): QueryResult {
    return this.db.executeSync(query, params);
  }

  transaction(fn: (tx: SqlTransaction) => Promise<void>): Promise<void> {
    return this.db.transaction(fn);
  }

  close(): void {
    this.db.close();
  }
}
