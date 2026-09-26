import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { isFirstTimeReceiptEligible } from '../../domain/baseline/isFirstTimeReceiptEligible';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { GetBaselineProgress } from './GetBaselineProgress';

const SNAPCHAT = 'com.snapchat.android';

function sessionOnLocalDay(
  anchorDayStart: number,
  dayOffset: number,
  id: string,
  durationMs = 60_000,
) {
  let dayStart = anchorDayStart;
  for (let i = 0; i < dayOffset; i += 1) {
    dayStart = getNextLocalCalendarDayStart(dayStart);
  }
  return createUsageSession({
    id,
    startTime: dayStart + 1_000,
    endTime: dayStart + 1_000 + durationMs,
    durationMs,
  });
}

describe('GetBaselineProgress (D4.4)', () => {
  const anchor = getLocalCalendarDayStart(
    new Date(2026, 0, 1, 0, 0, 0).getTime(),
  );

  function queryFor(repo: InMemoryUsageSessionRepository) {
    return new GetBaselineProgress({ usageSessionRepository: repo });
  }

  it('returns COLLECTING 0/7 with no persisted sessions', async () => {
    const result = await queryFor(new InMemoryUsageSessionRepository()).execute();
    expect(result).toMatchObject({
      status: 'COLLECTING',
      observedCalendarDays: 0,
      targetCalendarDays: 7,
      trackedDurationMs: 0,
    });
    expect(isFirstTimeReceiptEligible(result)).toBe(false);
  });

  it('returns COLLECTING 1/7 for one observed day', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.save(sessionOnLocalDay(anchor, 0, 'd0'));
    const result = await queryFor(repo).execute();
    expect(result.status).toBe('COLLECTING');
    expect(result.observedCalendarDays).toBe(1);
  });

  it('counts multiple sessions on the same day as one observed day', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.saveMany([
      sessionOnLocalDay(anchor, 0, 'a'),
      sessionOnLocalDay(anchor, 0, 'b'),
    ]);
    expect((await queryFor(repo).execute()).observedCalendarDays).toBe(1);
  });

  it('returns COLLECTING 6/7 for six distinct observed days', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.saveMany(
      [0, 1, 2, 3, 4, 5].map(i => sessionOnLocalDay(anchor, i, `d${i}`)),
    );
    const result = await queryFor(repo).execute();
    expect(result).toMatchObject({
      status: 'COLLECTING',
      observedCalendarDays: 6,
      targetCalendarDays: 7,
    });
  });

  it('returns READY 7/7 for seven distinct observed days', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.saveMany(
      [0, 1, 2, 3, 4, 5, 6].map(i => sessionOnLocalDay(anchor, i, `d${i}`)),
    );
    const result = await queryFor(repo).execute();
    expect(result.status).toBe('READY');
    expect(result.observedCalendarDays).toBe(7);
    expect(isFirstTimeReceiptEligible(result)).toBe(true);
  });

  it('retains observed count above target when eight or more days exist', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.saveMany(
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => sessionOnLocalDay(anchor, i, `d${i}`)),
    );
    const result = await queryFor(repo).execute();
    expect(result.status).toBe('READY');
    expect(result.observedCalendarDays).toBe(9);
  });

  it('is READY for seven sparse observed days across a wider calendar span', async () => {
    const repo = new InMemoryUsageSessionRepository();
    const sparseOffsets = [0, 1, 4, 8, 14, 19, 29];
    await repo.saveMany(
      sparseOffsets.map((offset, index) =>
        sessionOnLocalDay(anchor, offset, `sparse-${index}`),
      ),
    );
    const result = await queryFor(repo).execute();
    expect(result.status).toBe('READY');
    expect(result.observedCalendarDays).toBe(7);
  });

  it('counts midnight-crossing session on both local days', async () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 5, 10, 0, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const repo = new InMemoryUsageSessionRepository();
    await repo.save(
      createUsageSession({
        id: 'cross',
        startTime: nextDay - 30 * 60_000,
        endTime: nextDay + 30 * 60_000,
        durationMs: 60 * 60_000,
      }),
    );
    expect((await queryFor(repo).execute()).observedCalendarDays).toBe(2);
  });

  it('ignores invalid non-positive-duration sessions', async () => {
    const repo = new InMemoryUsageSessionRepository();
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 5, 11, 0, 0, 0).getTime(),
    );
    await repo.save(
      createUsageSession({
        id: 'zero',
        startTime: dayStart,
        endTime: dayStart,
        durationMs: 0,
      }),
    );
    expect((await queryFor(repo).execute()).observedCalendarDays).toBe(0);
  });

  it('reports exact trackedDurationMs and first/last observed timestamps', async () => {
    const repo = new InMemoryUsageSessionRepository();
    const s1 = sessionOnLocalDay(anchor, 0, 'first', 5_000);
    const s2 = sessionOnLocalDay(anchor, 2, 'last', 7_000);
    await repo.saveMany([s1, s2]);
    const result = await queryFor(repo).execute();
    expect(result.trackedDurationMs).toBe(12_000);
    expect(result.firstObservedAt).toBe(s1.startTime);
    expect(result.lastObservedAt).toBe(s2.endTime);
  });

  it('is independent of persisted session order', async () => {
    const sessions = [0, 1, 2].map(i => sessionOnLocalDay(anchor, i, `d${i}`));
    const repoA = new InMemoryUsageSessionRepository();
    const repoB = new InMemoryUsageSessionRepository();
    await repoA.saveMany(sessions);
    await repoB.saveMany([...sessions].reverse());
    expect(await queryFor(repoA).execute()).toEqual(await queryFor(repoB).execute());
  });

  it('respects custom target calendar days', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.saveMany(
      [0, 1, 2].map(i => sessionOnLocalDay(anchor, i, `d${i}`)),
    );
    const result = await queryFor(repo).execute({ targetCalendarDays: 3 });
    expect(result.status).toBe('READY');
    expect(result.targetCalendarDays).toBe(3);
  });

  it('is unchanged by app classification rules (classification-independent)', async () => {
    const repo = new InMemoryUsageSessionRepository();
    const rules = new InMemoryClassificationRuleRepository();
    const appClassification = createAppUserClassification(rules);
    await repo.save(
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        startTime: anchor + 1_000,
        endTime: anchor + 60_000,
        durationMs: 59_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    );
    const before = await queryFor(repo).execute();
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    const afterRule = await queryFor(repo).execute();
    await repo.save(
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT },
        startTime: anchor + 1_000,
        endTime: anchor + 60_000,
        durationMs: 59_000,
        classification: ActivityClassification.PRODUCTIVE,
        classificationSource: ClassificationSource.USER_RULE,
      }),
    );
    const afterStoredClassification = await queryFor(repo).execute();
    expect(before).toEqual(afterRule);
    expect(before).toEqual(afterStoredClassification);
  });

  it('progresses naturally as persisted days accumulate', async () => {
    const repo = new InMemoryUsageSessionRepository();
    const getBaseline = queryFor(repo);
    expect((await getBaseline.execute()).observedCalendarDays).toBe(0);
    await repo.save(sessionOnLocalDay(anchor, 0, 'p0a'));
    expect((await getBaseline.execute()).observedCalendarDays).toBe(1);
    await repo.save(sessionOnLocalDay(anchor, 0, 'p0b'));
    expect((await getBaseline.execute()).observedCalendarDays).toBe(1);
    for (let day = 1; day < 7; day += 1) {
      await repo.save(sessionOnLocalDay(anchor, day, `p${day}`));
      expect((await getBaseline.execute()).observedCalendarDays).toBe(day + 1);
    }
    expect((await getBaseline.execute()).status).toBe('READY');
  });

  it('returns SESSION_QUERY_FAILED when storage read fails', async () => {
    const failingRepo = {
      findAllChronological: jest.fn(async () => {
        throw new Error('db locked');
      }),
    };
    await expect(
      new GetBaselineProgress({ usageSessionRepository: failingRepo as never }).execute(),
    ).rejects.toMatchObject({ code: 'SESSION_QUERY_FAILED' });
  });

  it('handles 1,000 persisted sessions deterministically', async () => {
    const repo = new InMemoryUsageSessionRepository();
    const sessions = [];
    for (let day = 0; day < 100; day += 1) {
      let dayStart = anchor;
      for (let i = 0; i < day; i += 1) {
        dayStart = getNextLocalCalendarDayStart(dayStart);
      }
      for (let n = 0; n < 10; n += 1) {
        const startTime = dayStart + 1_000 + n * 100;
        sessions.push(
          createUsageSession({
            id: `d${day}-s${n}`,
            startTime,
            endTime: startTime + 1_000,
            durationMs: 1_000,
          }),
        );
      }
    }
    await repo.saveMany(sessions);
    const result = await queryFor(repo).execute();
    expect(result.observedCalendarDays).toBe(100);
    expect(result.status).toBe('READY');
    expect(result.trackedDurationMs).toBe(1_000_000);
    const again = await queryFor(repo).execute();
    expect(again).toEqual(result);
  });

  it('returns the same progress from a second query instance on the same store', async () => {
    const repo = new InMemoryUsageSessionRepository();
    await repo.saveMany(
      [0, 1, 2, 3].map(i => sessionOnLocalDay(anchor, i, `persist-${i}`)),
    );
    const first = await new GetBaselineProgress({
      usageSessionRepository: repo,
    }).execute();
    const second = await new GetBaselineProgress({
      usageSessionRepository: repo,
    }).execute();
    expect(second).toEqual(first);
    expect(second.observedCalendarDays).toBe(4);
  });
});
