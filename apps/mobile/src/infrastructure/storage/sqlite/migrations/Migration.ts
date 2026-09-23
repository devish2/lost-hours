import type { SqlTransaction } from '../database/SqlExecutor';

export interface Migration {
  readonly version: number;
  up(executor: SqlTransaction): Promise<void>;
}
