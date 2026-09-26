import type { UsageSession } from '../session/UsageSession';

export interface UsageSessionRepository {
  save(session: UsageSession): Promise<void>;
  saveMany(sessions: readonly UsageSession[]): Promise<void>;
  /**
   * Upserts by session id and removes prior rows that share the same opening
   * identity (trackingSource, packageName, startTime) but a different id.
   */
  saveManyWithOpeningReconciliation(
    sessions: readonly UsageSession[],
  ): Promise<void>;
  findById(id: string): Promise<UsageSession | null>;
  /**
   * Returns sessions whose `startTime` falls in **[fromTimestamp, toTimestamp)** —
   * inclusive lower bound, exclusive upper bound.
   */
  findBetween(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]>;
  /**
   * Returns sessions whose interval overlaps **[fromTimestamp, toTimestamp)**:
   * `startTime < toTimestamp` and `endTime > fromTimestamp`.
   */
  findOverlapping(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]>;
  /** All persisted sessions in stable read order (baseline / full-history reads). */
  findAllChronological(): Promise<UsageSession[]>;
  deleteById(id: string): Promise<void>;
}
