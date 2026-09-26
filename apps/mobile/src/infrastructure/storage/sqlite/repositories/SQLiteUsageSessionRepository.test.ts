import type { QueryResult, Scalar } from '@op-engineering/op-sqlite';

import { TrackingSource } from '../../../../domain/usage/TrackingSource';
import { createUsageSession } from '../../../../domain/testSupport/createUsageSession';
import type { SqlExecutor, SqlTransaction } from '../database/SqlExecutor';
import {
  USAGE_SESSION_DELETE_DERIVED_VARIANTS_SQL,
  USAGE_SESSION_UPSERT_SQL,
  usageSessionToInsertParams,
} from '../mappers/UsageSessionMapper';
import type { UsageSessionRow } from '../mappers/rows';
import { GetBaselineProgress } from '../../../../application/queries/GetBaselineProgress';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../../../shared/time/localCalendarDay';
import { SQLiteUsageSessionRepository } from './SQLiteUsageSessionRepository';

function queryResult(rows: Record<string, Scalar>[]): QueryResult {
  return { rows, rowsAffected: rows.length };
}

function rowFromParams(params: (string | number | null)[]): UsageSessionRow {
  return {
    id: params[0] as string,
    package_name: params[1] as string,
    app_display_name: params[2] as string | null,
    platform: params[3] as string,
    start_time: params[4] as number,
    end_time: params[5] as number,
    duration_ms: params[6] as number,
    content_type: params[7] as string,
    classification: params[8] as string,
    classification_source: params[9] as string,
    classification_confidence: params[10] as number | null,
    tracking_source: params[11] as string,
    created_at: params[12] as number,
  };
}

function createMockExecutor() {
  const rows = new Map<string, UsageSessionRow>();
  const state = { transactionFailed: false };

  const executeUpsert = async (params: (string | number | null)[]) => {
    const row = rowFromParams(params);
    rows.set(row.id, row);
    return queryResult([row as unknown as Record<string, Scalar>]);
  };

  const executeDeleteVariants = async (params: Scalar[]) => {
    const [trackingSource, packageName, startTime, exceptId] = params as [
      string,
      string,
      number,
      string,
    ];
    for (const [id, row] of rows.entries()) {
      if (
        id !== exceptId &&
        row.tracking_source === trackingSource &&
        row.package_name === packageName &&
        row.start_time === startTime
      ) {
        rows.delete(id);
      }
    }
    return queryResult([]);
  };

  const executor: SqlExecutor = {
    execute: async (query: string, params?: Scalar[]) => {
      const normalized = query.trim();
      if (normalized === USAGE_SESSION_UPSERT_SQL.trim()) {
        return executeUpsert(params as (string | number | null)[]);
      }
      if (normalized === USAGE_SESSION_DELETE_DERIVED_VARIANTS_SQL.trim()) {
        return executeDeleteVariants(params ?? []);
      }
      if (normalized.startsWith('SELECT * FROM usage_sessions WHERE id =')) {
        const id = params?.[0] as string;
        const row = id ? rows.get(id) : undefined;
        return queryResult(
          row ? [row as unknown as Record<string, Scalar>] : [],
        );
      }
      if (
        normalized.includes('start_time < ?') &&
        normalized.includes('end_time > ?')
      ) {
        const to = params?.[0] as number;
        const from = params?.[1] as number;
        const matched = [...rows.values()]
          .filter(row => row.start_time < to && row.end_time > from)
          .sort((a, b) => {
            if (a.start_time !== b.start_time) {
              return a.start_time - b.start_time;
            }
            if (a.end_time !== b.end_time) {
              return a.end_time - b.end_time;
            }
            const packageCompare = a.package_name.localeCompare(b.package_name);
            if (packageCompare !== 0) {
              return packageCompare;
            }
            return a.id.localeCompare(b.id);
          });
        return queryResult(
          matched as unknown as Record<string, Scalar>[],
        );
      }
      if (
        normalized.includes('FROM usage_sessions') &&
        normalized.includes('ORDER BY start_time ASC') &&
        !normalized.includes('WHERE')
      ) {
        const matched = [...rows.values()].sort((a, b) => {
          if (a.start_time !== b.start_time) {
            return a.start_time - b.start_time;
          }
          if (a.end_time !== b.end_time) {
            return a.end_time - b.end_time;
          }
          const packageCompare = a.package_name.localeCompare(b.package_name);
          if (packageCompare !== 0) {
            return packageCompare;
          }
          return a.id.localeCompare(b.id);
        });
        return queryResult(matched as unknown as Record<string, Scalar>[]);
      }
      if (normalized.startsWith('SELECT * FROM usage_sessions')) {
        const from = params?.[0] as number;
        const to = params?.[1] as number;
        const matched = [...rows.values()]
          .filter(row => row.start_time >= from && row.start_time < to)
          .sort((a, b) => a.start_time - b.start_time);
        return queryResult(
          matched as unknown as Record<string, Scalar>[],
        );
      }
      if (normalized.startsWith('DELETE FROM usage_sessions WHERE id =')) {
        rows.delete(params?.[0] as string);
        return queryResult([]);
      }
      throw new Error(`Unexpected SQL in test executor: ${normalized}`);
    },
    transaction: async (fn: (tx: SqlTransaction) => Promise<void>) => {
      if (state.transactionFailed) {
        throw new Error('transaction failed');
      }
      await fn({
        execute: (query, params) => executor.execute!(query, params),
      });
    },
  };

  return {
    executor,
    rows,
    failNextTransaction: () => {
      state.transactionFailed = true;
    },
  };
}

describe('SQLiteUsageSessionRepository', () => {
  it('saveManyWithOpeningReconciliation deletes derived variants then upserts atomically in one transaction', async () => {
    const { executor, rows } = createMockExecutor();
    const repo = new SQLiteUsageSessionRepository(executor);
    const truncated = createUsageSession({
      id: 'truncated',
      startTime: 1000,
      endTime: 2000,
      durationMs: 1000,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });
    const extended = createUsageSession({
      id: 'extended',
      startTime: 1000,
      endTime: 3000,
      durationMs: 2000,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });

    await repo.save(truncated);
    expect(rows.size).toBe(1);

    await repo.saveManyWithOpeningReconciliation([extended]);
    expect(rows.size).toBe(1);
    expect(rows.has('truncated')).toBe(false);
    expect((await repo.findById('extended'))?.endTime).toBe(3000);
  });

  it('uses ON CONFLICT upsert SQL for identical ids', async () => {
    const { executor } = createMockExecutor();
    const repo = new SQLiteUsageSessionRepository(executor);
    const session = createUsageSession({ id: 'dup', endTime: 2000, durationMs: 1000 });
    await repo.save(session);
    await repo.save(
      createUsageSession({ id: 'dup', endTime: 5000, durationMs: 4000 }),
    );
    expect((await repo.findById('dup'))?.endTime).toBe(5000);
  });

  it('propagates transaction failures without partial reconciliation', async () => {
    const { executor, failNextTransaction } = createMockExecutor();
    failNextTransaction();
    const repo = new SQLiteUsageSessionRepository(executor);
    await expect(
      repo.saveManyWithOpeningReconciliation([
        createUsageSession({ id: 'x', startTime: 1, endTime: 2, durationMs: 1 }),
      ]),
    ).rejects.toThrow(/transaction failed/);
  });

  it('findOverlapping returns sessions crossing window start without mutating bounds', async () => {
    const { executor } = createMockExecutor();
    const repo = new SQLiteUsageSessionRepository(executor);
    await repo.save(
      createUsageSession({
        id: 'cross',
        startTime: 9_000,
        endTime: 12_000,
        durationMs: 3_000,
      }),
    );
    const overlapping = await repo.findOverlapping(10_000, 20_000);
    expect(overlapping).toHaveLength(1);
    expect(overlapping[0]?.startTime).toBe(9_000);
    expect(overlapping[0]?.endTime).toBe(12_000);
    expect(await repo.findBetween(10_000, 20_000)).toEqual([]);
  });

  it('maps insert params through upsert statement contract', () => {
    const session = createUsageSession({ id: 'mapper-check' });
    const params = usageSessionToInsertParams(session, 123);
    expect(params[0]).toBe('mapper-check');
    expect(params[11]).toBe(session.trackingSource);
  });

  it('findAllChronological supports baseline progress across repository recreation', async () => {
    const { executor } = createMockExecutor();
    const anchor = getLocalCalendarDayStart(
      new Date(2026, 3, 1, 0, 0, 0).getTime(),
    );
    let dayStart = anchor;
    const writer = new SQLiteUsageSessionRepository(executor);
    for (let i = 0; i < 4; i += 1) {
      await writer.save(
        createUsageSession({
          id: `baseline-${i}`,
          startTime: dayStart + 1_000,
          endTime: dayStart + 5_000,
          durationMs: 4_000,
        }),
      );
      dayStart = getNextLocalCalendarDayStart(dayStart);
    }
    const first = await new GetBaselineProgress({
      usageSessionRepository: writer,
    }).execute();
    const recreated = await new GetBaselineProgress({
      usageSessionRepository: new SQLiteUsageSessionRepository(executor),
    }).execute();
    expect(recreated).toEqual(first);
    expect(recreated.observedCalendarDays).toBe(4);
  });
});
