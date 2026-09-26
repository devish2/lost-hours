import type { UsageSessionRepository } from '../../../../domain/repositories/UsageSessionRepository';
import type { UsageSession } from '../../../../domain/session/UsageSession';
import type { SqlExecutor } from '../database/SqlExecutor';
import {
  USAGE_SESSION_DELETE_DERIVED_VARIANTS_SQL,
  USAGE_SESSION_UPSERT_SQL,
  usageSessionRowToDomain,
  usageSessionToInsertParams,
} from '../mappers/UsageSessionMapper';
import { rowToUsageSessionRow } from '../mappers/rows';

export class SQLiteUsageSessionRepository implements UsageSessionRepository {
  constructor(private readonly db: SqlExecutor) {}

  async save(session: UsageSession): Promise<void> {
    const createdAt = Date.now();
    await this.db.execute(
      USAGE_SESSION_UPSERT_SQL,
      usageSessionToInsertParams(session, createdAt),
    );
  }

  async saveMany(sessions: readonly UsageSession[]): Promise<void> {
    if (sessions.length === 0) {
      return;
    }
    await this.db.transaction(async tx => {
      for (const session of sessions) {
        const createdAt = Date.now();
        await tx.execute(
          USAGE_SESSION_UPSERT_SQL,
          usageSessionToInsertParams(session, createdAt),
        );
      }
    });
  }

  async saveManyWithOpeningReconciliation(
    sessions: readonly UsageSession[],
  ): Promise<void> {
    if (sessions.length === 0) {
      return;
    }
    await this.db.transaction(async tx => {
      for (const session of sessions) {
        await tx.execute(USAGE_SESSION_DELETE_DERIVED_VARIANTS_SQL, [
          session.trackingSource,
          session.app.packageName,
          session.startTime,
          session.id,
        ]);
        const createdAt = Date.now();
        await tx.execute(
          USAGE_SESSION_UPSERT_SQL,
          usageSessionToInsertParams(session, createdAt),
        );
      }
    });
  }

  async findById(id: string): Promise<UsageSession | null> {
    const result = await this.db.execute(
      'SELECT * FROM usage_sessions WHERE id = ? LIMIT 1',
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return usageSessionRowToDomain(rowToUsageSessionRow(row));
  }

  async findBetween(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]> {
    const result = await this.db.execute(
      `SELECT * FROM usage_sessions
       WHERE start_time >= ? AND start_time < ?
       ORDER BY start_time ASC`,
      [fromTimestamp, toTimestamp],
    );
    return result.rows.map(row =>
      usageSessionRowToDomain(rowToUsageSessionRow(row)),
    );
  }

  async findOverlapping(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]> {
    const result = await this.db.execute(
      `SELECT * FROM usage_sessions
       WHERE start_time < ? AND end_time > ?
       ORDER BY start_time ASC, end_time ASC, package_name ASC, id ASC`,
      [toTimestamp, fromTimestamp],
    );
    return result.rows.map(row =>
      usageSessionRowToDomain(rowToUsageSessionRow(row)),
    );
  }

  async findAllChronological(): Promise<UsageSession[]> {
    const result = await this.db.execute(
      `SELECT * FROM usage_sessions
       ORDER BY start_time ASC, end_time ASC, package_name ASC, id ASC`,
    );
    return result.rows.map(row =>
      usageSessionRowToDomain(rowToUsageSessionRow(row)),
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.db.execute('DELETE FROM usage_sessions WHERE id = ?', [id]);
  }
}
