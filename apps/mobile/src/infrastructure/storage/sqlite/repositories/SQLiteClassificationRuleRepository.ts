import type { ClassificationRuleRepository } from '../../../../domain/repositories/ClassificationRuleRepository';
import type { ClassificationRule } from '../../../../domain/classification/ClassificationRule';
import type { SqlExecutor } from '../database/SqlExecutor';
import {
  CLASSIFICATION_RULE_UPSERT_SQL,
  classificationRuleRowToDomain,
  classificationRuleToInsertParams,
} from '../mappers/ClassificationRuleMapper';
import { rowToClassificationRuleRow } from '../mappers/rows';

export class SQLiteClassificationRuleRepository
  implements ClassificationRuleRepository
{
  constructor(private readonly db: SqlExecutor) {}

  async save(rule: ClassificationRule): Promise<void> {
    const now = Date.now();
    const createdAt = (await this.getCreatedAt(rule.id)) ?? now;
    await this.db.execute(
      CLASSIFICATION_RULE_UPSERT_SQL,
      classificationRuleToInsertParams(rule, createdAt, now),
    );
  }

  async saveMany(rules: readonly ClassificationRule[]): Promise<void> {
    if (rules.length === 0) {
      return;
    }
    await this.db.transaction(async tx => {
      for (const rule of rules) {
        const now = Date.now();
        const createdAt =
          (await this.getCreatedAtWithExecutor(tx, rule.id)) ?? now;
        await tx.execute(
          CLASSIFICATION_RULE_UPSERT_SQL,
          classificationRuleToInsertParams(rule, createdAt, now),
        );
      }
    });
  }

  async findById(id: string): Promise<ClassificationRule | null> {
    const result = await this.db.execute(
      'SELECT * FROM classification_rules WHERE id = ? LIMIT 1',
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return classificationRuleRowToDomain(rowToClassificationRuleRow(row));
  }

  async findAll(): Promise<ClassificationRule[]> {
    const result = await this.db.execute(
      'SELECT * FROM classification_rules ORDER BY id ASC',
    );
    return result.rows.map(row =>
      classificationRuleRowToDomain(rowToClassificationRuleRow(row)),
    );
  }

  async findEnabled(): Promise<ClassificationRule[]> {
    const result = await this.db.execute(
      'SELECT * FROM classification_rules WHERE enabled = 1 ORDER BY priority DESC, id ASC',
    );
    return result.rows.map(row =>
      classificationRuleRowToDomain(rowToClassificationRuleRow(row)),
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.db.execute('DELETE FROM classification_rules WHERE id = ?', [id]);
  }

  private async getCreatedAt(id: string): Promise<number | null> {
    return this.getCreatedAtWithExecutor(this.db, id);
  }

  private async getCreatedAtWithExecutor(
    executor: SqlExecutor | { execute: SqlExecutor['execute'] },
    id: string,
  ): Promise<number | null> {
    const result = await executor.execute(
      'SELECT created_at FROM classification_rules WHERE id = ? LIMIT 1',
      [id],
    );
    const value = result.rows[0]?.created_at;
    return typeof value === 'number' ? value : null;
  }
}
