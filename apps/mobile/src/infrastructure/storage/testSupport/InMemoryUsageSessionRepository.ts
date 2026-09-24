import type { UsageSessionRepository } from '../../../domain/repositories/UsageSessionRepository';
import type { UsageSession } from '../../../domain/session/UsageSession';
import { compareUsageSessionsForReadOrder } from '../../../domain/session/compareUsageSessionsForReadOrder';
import { usageSessionOverlapsWindow } from '../../../domain/session/usageSessionOverlapsWindow';
import { matchesUsageSessionOpeningIdentity } from '../../../domain/session/usageSessionOpeningIdentity';

/** In-memory UsageSessionRepository for unit tests (mirrors reconciliation semantics). */
export class InMemoryUsageSessionRepository implements UsageSessionRepository {
  private readonly sessions = new Map<string, UsageSession>();

  async save(session: UsageSession): Promise<void> {
    await this.reconcileAndUpsert(session);
  }

  async saveMany(sessions: readonly UsageSession[]): Promise<void> {
    for (const session of sessions) {
      await this.reconcileAndUpsert(session);
    }
  }

  async saveManyWithOpeningReconciliation(
    sessions: readonly UsageSession[],
  ): Promise<void> {
    for (const session of sessions) {
      await this.reconcileAndUpsert(session);
    }
  }

  private async reconcileAndUpsert(session: UsageSession): Promise<void> {
    for (const [id, existing] of this.sessions.entries()) {
      if (
        id !== session.id &&
        matchesUsageSessionOpeningIdentity(existing, session)
      ) {
        this.sessions.delete(id);
      }
    }
    this.sessions.set(session.id, { ...session, app: { ...session.app } });
  }

  async findById(id: string): Promise<UsageSession | null> {
    const session = this.sessions.get(id);
    return session ? { ...session, app: { ...session.app } } : null;
  }

  async findBetween(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]> {
    return [...this.sessions.values()]
      .filter(
        session =>
          session.startTime >= fromTimestamp && session.startTime < toTimestamp,
      )
      .sort((a, b) => a.startTime - b.startTime);
  }

  async findOverlapping(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<UsageSession[]> {
    return [...this.sessions.values()]
      .filter(session =>
        usageSessionOverlapsWindow(session, fromTimestamp, toTimestamp),
      )
      .sort(compareUsageSessionsForReadOrder)
      .map(session => ({ ...session, app: { ...session.app } }));
  }

  async deleteById(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  /** Test helper — snapshot of stored sessions. */
  allSessions(): UsageSession[] {
    return [...this.sessions.values()];
  }
}
