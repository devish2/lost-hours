import { GetUsageSessionsForRange } from '../../application/queries/GetUsageSessionsForRange';
import type { UsageSessionRepository } from '../../domain/repositories/UsageSessionRepository';

export type UsageSessionQueries = {
  getUsageSessionsForRange: GetUsageSessionsForRange;
};

/** Read-side query composition (explicit; not imported at module load). */
export function createUsageSessionQueries(deps: {
  usageSessionRepository: UsageSessionRepository;
}): UsageSessionQueries {
  return {
    getUsageSessionsForRange: new GetUsageSessionsForRange(
      deps.usageSessionRepository,
    ),
  };
}
