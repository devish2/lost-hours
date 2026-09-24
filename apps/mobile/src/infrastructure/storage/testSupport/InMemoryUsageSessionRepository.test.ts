import { ActivityClassification } from '../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../domain/classification/ClassificationSource';
import { ContentType } from '../../../domain/classification/ContentType';
import { Platform } from '../../../domain/platform/Platform';
import { deriveUsageSessionId } from '../../../domain/session/deriveUsageSessionId';
import { TrackingSource } from '../../../domain/usage/TrackingSource';
import { createUsageSession } from '../../../domain/testSupport/createUsageSession';
import { InMemoryUsageSessionRepository } from './InMemoryUsageSessionRepository';

describe('InMemoryUsageSessionRepository persistence semantics', () => {
  let repo: InMemoryUsageSessionRepository;

  beforeEach(() => {
    repo = new InMemoryUsageSessionRepository();
  });

  it('saves and reads back one session', async () => {
    const session = createUsageSession({
      id: 's1',
      startTime: 1000,
      endTime: 2000,
      durationMs: 1000,
    });
    await repo.save(session);
    expect(await repo.findById('s1')).toEqual(session);
  });

  it('saveMany persists multiple sessions', async () => {
    const a = createUsageSession({ id: 'a', startTime: 1000, endTime: 2000, durationMs: 1000 });
    const b = createUsageSession({ id: 'b', startTime: 3000, endTime: 4000, durationMs: 1000 });
    await repo.saveMany([a, b]);
    expect(await repo.findBetween(0, 5000)).toHaveLength(2);
  });

  it('upserts the same deterministic id without duplicate rows', async () => {
    const session = createUsageSession({
      id: 'same-id',
      endTime: 2000,
      durationMs: 1000,
    });
    await repo.save(session);
    await repo.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'same-id',
        endTime: 3000,
        durationMs: 2000,
      }),
    ]);
    expect(repo.allSessions()).toHaveLength(1);
    expect((await repo.findById('same-id'))?.endTime).toBe(3000);
  });

  it('reconciles truncated then extended variant for same opening', async () => {
    const truncatedId = deriveUsageSessionId({
      packageName: 'com.example.app',
      startTime: 10_000,
      endTime: 20_000,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });
    const extendedId = deriveUsageSessionId({
      packageName: 'com.example.app',
      startTime: 10_000,
      endTime: 25_000,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });

    await repo.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: truncatedId,
        startTime: 10_000,
        endTime: 20_000,
        durationMs: 10_000,
      }),
    ]);
    await repo.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: extendedId,
        startTime: 10_000,
        endTime: 25_000,
        durationMs: 15_000,
      }),
    ]);

    expect(repo.allSessions()).toHaveLength(1);
    expect(await repo.findById(truncatedId)).toBeNull();
    expect((await repo.findById(extendedId))?.endTime).toBe(25_000);
  });

  it('preserves unrelated overlapping sessions', async () => {
    await repo.saveManyWithOpeningReconciliation([
      createUsageSession({
        id: 'app-a',
        app: { packageName: 'com.app.a' },
        startTime: 1000,
        endTime: 5000,
        durationMs: 4000,
      }),
      createUsageSession({
        id: 'app-b',
        app: { packageName: 'com.app.b' },
        startTime: 2000,
        endTime: 6000,
        durationMs: 4000,
      }),
    ]);
    expect(repo.allSessions()).toHaveLength(2);
  });

  it('preserves different package with same start timestamp', async () => {
    await repo.saveMany([
      createUsageSession({
        id: 'pkg-a',
        app: { packageName: 'com.one' },
        startTime: 5000,
        endTime: 6000,
        durationMs: 1000,
      }),
      createUsageSession({
        id: 'pkg-b',
        app: { packageName: 'com.two' },
        startTime: 5000,
        endTime: 7000,
        durationMs: 2000,
      }),
    ]);
    expect(repo.allSessions()).toHaveLength(2);
  });

  it('preserves same package/start with different tracking source', async () => {
    await repo.saveMany([
      createUsageSession({
        id: 'stats',
        startTime: 1000,
        endTime: 2000,
        durationMs: 1000,
        trackingSource: TrackingSource.ANDROID_USAGE_STATS,
      }),
      createUsageSession({
        id: 'other-source',
        startTime: 1000,
        endTime: 2000,
        durationMs: 1000,
        trackingSource: TrackingSource.CHROME_EXTENSION,
      }),
    ]);
    expect(repo.allSessions()).toHaveLength(2);
  });

  it('round-trips UNKNOWN enum fields', async () => {
    const session = createUsageSession({
      id: 'unknown-fields',
      platform: Platform.OTHER,
      contentType: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      classificationSource: ClassificationSource.UNKNOWN,
    });
    await repo.save(session);
    expect(await repo.findById('unknown-fields')).toMatchObject({
      contentType: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      classificationSource: ClassificationSource.UNKNOWN,
    });
  });

  it('findBetween uses [from, to) on startTime', async () => {
    await repo.save(
      createUsageSession({ id: 'in', startTime: 1000, endTime: 2000, durationMs: 1000 }),
    );
    await repo.save(
      createUsageSession({ id: 'edge', startTime: 3000, endTime: 4000, durationMs: 1000 }),
    );
    const found = await repo.findBetween(1000, 3000);
    expect(found.map(session => session.id)).toEqual(['in']);
  });
});
