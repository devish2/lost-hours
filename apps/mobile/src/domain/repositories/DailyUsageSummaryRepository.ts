import type { DailyUsageSummary } from '../usage/DailyUsageSummary';

export interface DailyUsageSummaryRepository {
  save(summary: DailyUsageSummary): Promise<void>;
  findByDate(date: string): Promise<DailyUsageSummary | null>;
  /**
   * Returns summaries where **fromDate <= date <= toDate** (lexicographic on `YYYY-MM-DD`).
   */
  findBetweenDates(fromDate: string, toDate: string): Promise<DailyUsageSummary[]>;
  deleteByDate(date: string): Promise<void>;
}
