import type { DailyUsageSummaryRepository } from '../../../../domain/repositories/DailyUsageSummaryRepository';
import type { DailyUsageSummary } from '../../../../domain/usage/DailyUsageSummary';
import type { SqlExecutor } from '../database/SqlExecutor';
import {
  DAILY_USAGE_SUMMARY_UPSERT_SQL,
  dailyUsageSummaryRowToDomain,
  dailyUsageSummaryToInsertParams,
} from '../mappers/DailyUsageSummaryMapper';
import { rowToDailyUsageSummaryRow } from '../mappers/rows';

export class SQLiteDailyUsageSummaryRepository
  implements DailyUsageSummaryRepository
{
  constructor(private readonly db: SqlExecutor) {}

  async save(summary: DailyUsageSummary): Promise<void> {
    const updatedAt = Date.now();
    await this.db.execute(
      DAILY_USAGE_SUMMARY_UPSERT_SQL,
      dailyUsageSummaryToInsertParams(summary, updatedAt),
    );
  }

  async findByDate(date: string): Promise<DailyUsageSummary | null> {
    const result = await this.db.execute(
      'SELECT * FROM daily_usage_summaries WHERE date = ? LIMIT 1',
      [date],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return dailyUsageSummaryRowToDomain(rowToDailyUsageSummaryRow(row));
  }

  async findBetweenDates(
    fromDate: string,
    toDate: string,
  ): Promise<DailyUsageSummary[]> {
    const result = await this.db.execute(
      `SELECT * FROM daily_usage_summaries
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
      [fromDate, toDate],
    );
    return result.rows.map(row =>
      dailyUsageSummaryRowToDomain(rowToDailyUsageSummaryRow(row)),
    );
  }

  async deleteByDate(date: string): Promise<void> {
    await this.db.execute('DELETE FROM daily_usage_summaries WHERE date = ?', [
      date,
    ]);
  }
}
