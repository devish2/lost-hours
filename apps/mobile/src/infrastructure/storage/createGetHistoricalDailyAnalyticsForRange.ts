import { GetHistoricalDailyAnalyticsForRange } from '../../application/queries/GetHistoricalDailyAnalyticsForRange';
import type { SqliteRepositories } from './sqlite/createSqliteRepositories';
import { createGetHistoricalUsageAnalyticsForRange } from './createGetHistoricalUsageAnalyticsForRange';

/** Wires persisted-session historical daily analytics (read-only; no sync). */
export function createGetHistoricalDailyAnalyticsForRange(
  repositories: Pick<SqliteRepositories, 'usageSessions' | 'classificationRules'>,
): GetHistoricalDailyAnalyticsForRange {
  return new GetHistoricalDailyAnalyticsForRange({
    getHistoricalUsageAnalyticsForRange:
      createGetHistoricalUsageAnalyticsForRange(repositories),
  });
}
