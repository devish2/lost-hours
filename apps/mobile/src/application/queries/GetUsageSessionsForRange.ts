import type { UsageSessionRepository } from '../../domain/repositories/UsageSessionRepository';
import type { UsageSession } from '../../domain/session/UsageSession';
import { validateSessionProcessingWindow } from '../../domain/session/validateSessionProcessingWindow';

export type GetUsageSessionsForRangeInput = {
  fromTimestamp: number;
  toTimestamp: number;
};

/**
 * Reads stored sessions overlapping a half-open window.
 * Does not sync, classify, clip, or persist.
 */
export class GetUsageSessionsForRange {
  constructor(
    private readonly usageSessionRepository: UsageSessionRepository,
  ) {}

  async execute(
    input: GetUsageSessionsForRangeInput,
  ): Promise<readonly UsageSession[]> {
    validateSessionProcessingWindow(
      input.fromTimestamp,
      input.toTimestamp,
    );
    return this.usageSessionRepository.findOverlapping(
      input.fromTimestamp,
      input.toTimestamp,
    );
  }
}
