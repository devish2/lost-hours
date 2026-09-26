import type { BaselineReadinessConfig } from '../../domain/baseline/baselineReadinessConfig';
import { computeBaselineProgress } from '../../domain/baseline/computeBaselineProgress';
import type { BaselineProgress } from '../../domain/baseline/BaselineProgress';
import type { UsageSessionRepository } from '../../domain/repositories/UsageSessionRepository';
import { BaselineProgressError } from '../baseline/BaselineProgressError';

export type GetBaselineProgressDeps = {
  usageSessionRepository: UsageSessionRepository;
};

/**
 * Baseline readiness from full persisted usage history (no sync, no classification).
 */
export class GetBaselineProgress {
  constructor(private readonly deps: GetBaselineProgressDeps) {}

  async execute(
    config?: BaselineReadinessConfig,
  ): Promise<BaselineProgress> {
    let sessions;
    try {
      sessions = await this.deps.usageSessionRepository.findAllChronological();
    } catch (error) {
      throw new BaselineProgressError(
        'SESSION_QUERY_FAILED',
        'Could not read persisted usage sessions for baseline progress',
        error,
      );
    }

    return computeBaselineProgress(sessions, config);
  }
}
