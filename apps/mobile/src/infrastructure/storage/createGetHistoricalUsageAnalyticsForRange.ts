import { GetHistoricalUsageAnalyticsForRange } from '../../application/queries/GetHistoricalUsageAnalyticsForRange';
import { GetUsageSessionsForRange } from '../../application/queries/GetUsageSessionsForRange';
import type { SqliteRepositories } from './sqlite/createSqliteRepositories';

/** Wires persisted-session historical analytics (read-only; no sync). */
export function createGetHistoricalUsageAnalyticsForRange(
  repositories: Pick<SqliteRepositories, 'usageSessions' | 'classificationRules'>,
): GetHistoricalUsageAnalyticsForRange {
  return new GetHistoricalUsageAnalyticsForRange({
    getUsageSessionsForRange: new GetUsageSessionsForRange(
      repositories.usageSessions,
    ),
    classificationRuleRepository: repositories.classificationRules,
  });
}
