import type { QueryResult, Scalar } from '@op-engineering/op-sqlite';

import type { SqlExecutor, SqlTransaction } from '../sqlite/database/SqlExecutor';
import {
  CLASSIFICATION_RULE_UPSERT_SQL,
  classificationRuleToInsertParams,
} from '../sqlite/mappers/ClassificationRuleMapper';
import type { ClassificationRuleRow } from '../sqlite/mappers/rows';

function queryResult(rows: Record<string, Scalar>[]): QueryResult {
  return { rows, rowsAffected: rows.length };
}

function rowFromParams(params: (string | number | null)[]): ClassificationRuleRow {
  return {
    id: params[0] as string,
    platform: params[1] as string | null,
    content_type: params[2] as string | null,
    package_name: params[3] as string | null,
    classification: params[4] as string,
    source: params[5] as string,
    priority: params[6] as number,
    enabled: params[7] as number,
    created_at: params[8] as number,
    updated_at: params[9] as number,
  };
}

export function createMockClassificationRuleSqlExecutor() {
  const rows = new Map<string, ClassificationRuleRow>();
  let upsertShouldFail = false;

  const executeUpsert = async (params: (string | number | null)[]) => {
    const row = rowFromParams(params);
    rows.set(row.id, row);
    return queryResult([row as unknown as Record<string, Scalar>]);
  };

  const executor: SqlExecutor = {
    execute: async (query: string, params?: Scalar[]) => {
      const normalized = query.trim();
      if (normalized === CLASSIFICATION_RULE_UPSERT_SQL.trim()) {
        if (upsertShouldFail) {
          upsertShouldFail = false;
          throw new Error('sqlite execute failed');
        }
        return executeUpsert(params as (string | number | null)[]);
      }
      if (normalized.startsWith('SELECT * FROM classification_rules WHERE id =')) {
        const id = params?.[0] as string;
        const row = id ? rows.get(id) : undefined;
        return queryResult(
          row ? [row as unknown as Record<string, Scalar>] : [],
        );
      }
      if (normalized.startsWith('SELECT created_at FROM classification_rules')) {
        const id = params?.[0] as string;
        const row = id ? rows.get(id) : undefined;
        return queryResult(
          row
            ? [{ created_at: row.created_at } as Record<string, Scalar>]
            : [],
        );
      }
      if (normalized.startsWith('SELECT * FROM classification_rules WHERE enabled = 1')) {
        const matched = [...rows.values()]
          .filter(row => row.enabled === 1)
          .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
        return queryResult(matched as unknown as Record<string, Scalar>[]);
      }
      if (normalized.startsWith('SELECT * FROM classification_rules')) {
        const matched = [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
        return queryResult(matched as unknown as Record<string, Scalar>[]);
      }
      if (normalized.startsWith('DELETE FROM classification_rules WHERE id =')) {
        rows.delete(params?.[0] as string);
        return queryResult([]);
      }
      throw new Error(`Unexpected SQL in classification mock executor: ${normalized}`);
    },
    transaction: async (fn: (tx: SqlTransaction) => Promise<void>) => {
      await fn({
        execute: (query, params) => executor.execute!(query, params),
      });
    },
  };

  return {
    executor,
    rows,
    failNextUpsert: () => {
      upsertShouldFail = true;
    },
    rowCount: () => rows.size,
    getRow: (id: string) => rows.get(id),
    insertRowDirect: (rule: Parameters<typeof classificationRuleToInsertParams>[0]) => {
      const params = classificationRuleToInsertParams(rule, 1, 2);
      rows.set(rule.id, rowFromParams(params));
    },
  };
}
