import { GetHistoricalDayDetail } from '../../application/queries/GetHistoricalDayDetail';
import type { SqliteRepositories } from './sqlite/createSqliteRepositories';
import { createGetHistoricalUsageAnalyticsForRange } from './createGetHistoricalUsageAnalyticsForRange';

/** Wires persisted day-detail analytics (read-only; no sync). */
export function createGetHistoricalDayDetail(
  repositories: Pick<SqliteRepositories, 'usageSessions' | 'classificationRules'>,
): GetHistoricalDayDetail {
  return new GetHistoricalDayDetail({
    getHistoricalUsageAnalyticsForRange:
      createGetHistoricalUsageAnalyticsForRange(repositories),
  });
}
