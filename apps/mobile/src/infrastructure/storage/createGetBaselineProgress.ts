import { GetBaselineProgress } from '../../application/queries/GetBaselineProgress';
import type { SqliteRepositories } from './sqlite/createSqliteRepositories';

/** Wires baseline readiness from persisted usage history (read-only; no sync). */
export function createGetBaselineProgress(
  repositories: Pick<SqliteRepositories, 'usageSessions'>,
): GetBaselineProgress {
  return new GetBaselineProgress({
    usageSessionRepository: repositories.usageSessions,
  });
}
