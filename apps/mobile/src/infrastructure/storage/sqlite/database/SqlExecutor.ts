import type { QueryResult, Scalar } from '@op-engineering/op-sqlite';

export interface SqlTransaction {
  execute(query: string, params?: Scalar[]): Promise<QueryResult>;
}

/** Thin async SQL boundary for repositories and migrations. */
export interface SqlExecutor {
  execute(query: string, params?: Scalar[]): Promise<QueryResult>;
  executeSync?(query: string, params?: Scalar[]): QueryResult;
  transaction(fn: (tx: SqlTransaction) => Promise<void>): Promise<void>;
}
