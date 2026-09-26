import { GetHistory } from '../../application/queries/GetHistory';
import type { SqliteRepositories } from './sqlite/createSqliteRepositories';
import { createGetBaselineProgress } from './createGetBaselineProgress';
import { createGetHistoricalDailyAnalyticsForRange } from './createGetHistoricalDailyAnalyticsForRange';

/** Wires History read model (recent window + baseline; no sync). */
export function createGetHistory(
  repositories: Pick<SqliteRepositories, 'usageSessions' | 'classificationRules'>,
): GetHistory {
  return new GetHistory({
    getHistoricalDailyAnalyticsForRange:
      createGetHistoricalDailyAnalyticsForRange(repositories),
    getBaselineProgress: createGetBaselineProgress(repositories),
  });
}
