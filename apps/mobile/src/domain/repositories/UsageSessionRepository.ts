import type { UsageSession } from '../session/UsageSession';

export interface UsageSessionRepository {
  save(session: UsageSession): Promise<void>;
  saveMany(sessions: readonly UsageSession[]): Promise<void>;
  findById(id: string): Promise<UsageSession | null>;
  /**
   * Returns sessions whose `startTime` falls in **[fromTimestamp, toTimestamp)** —
   * inclusive lower bound, exclusive upper bound.
   */
  findBetween(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]>;
  deleteById(id: string): Promise<void>;
}
