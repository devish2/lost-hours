import { ActivityClassification } from '../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../domain/classification/ClassificationSource';
import { ContentType } from '../../../domain/classification/ContentType';
import { createUsageSession } from '../../../domain/testSupport/createUsageSession';
import { InMemoryUsageSessionRepository } from './InMemoryUsageSessionRepository';

const FROM = 10_000;
const TO = 20_000;

describe('InMemoryUsageSessionRepository.findOverlapping', () => {
  let repo: InMemoryUsageSessionRepository;

  beforeEach(() => {
    repo = new InMemoryUsageSessionRepository();
  });

  async function saveSession(
    id: string,
    startTime: number,
    endTime: number,
    packageName = 'com.example.app',
  ) {
    await repo.save(
      createUsageSession({
        id,
        app: { packageName },
        startTime,
        endTime,
        durationMs: endTime - startTime,
      }),
    );
  }

  it('includes a session completely inside the query window', async () => {
    await saveSession('inside', 12_000, 15_000);
    const found = await repo.findOverlapping(FROM, TO);
    expect(found.map(session => session.id)).toEqual(['inside']);
    expect(found[0]?.startTime).toBe(12_000);
    expect(found[0]?.endTime).toBe(15_000);
  });

  it('includes a session starting before and ending inside the window', async () => {
    await saveSession('cross-start', 9_000, 12_000);
    expect(await repo.findOverlapping(FROM, TO)).toHaveLength(1);
  });

  it('includes a session starting inside and ending after the window', async () => {
    await saveSession('cross-end', 15_000, 25_000);
    expect(await repo.findOverlapping(FROM, TO)).toHaveLength(1);
  });

  it('includes a session that fully contains the query window', async () => {
    await saveSession('contains', 5_000, 30_000);
    expect(await repo.findOverlapping(FROM, TO)).toHaveLength(1);
  });

  it('excludes a session ending exactly at query start', async () => {
    await saveSession('ends-at-start', 5_000, FROM);
    expect(await repo.findOverlapping(FROM, TO)).toEqual([]);
  });

  it('excludes a session starting exactly at query end', async () => {
    await saveSession('starts-at-end', TO, TO + 1000);
    expect(await repo.findOverlapping(FROM, TO)).toEqual([]);
  });

  it('excludes sessions entirely before or after the window', async () => {
    await saveSession('before', 1_000, 2_000);
    await saveSession('after', 30_000, 40_000);
    expect(await repo.findOverlapping(FROM, TO)).toEqual([]);
  });

  it('returns multiple overlapping sessions in deterministic order', async () => {
    await saveSession('b', 12_000, 14_000, 'com.b.app');
    await saveSession('a', 11_000, 13_000, 'com.a.app');
    const ids = (await repo.findOverlapping(FROM, TO)).map(session => session.id);
    expect(ids).toEqual(['a', 'b']);
  });

  it('distinguishes findBetween start semantics from findOverlapping', async () => {
    await saveSession('cross-start', 9_000, 12_000);
    expect(await repo.findBetween(FROM, TO)).toEqual([]);
    expect(await repo.findOverlapping(FROM, TO)).toHaveLength(1);
  });

  it('preserves UNKNOWN enum fields on read', async () => {
    await repo.save(
      createUsageSession({
        id: 'unknown',
        startTime: 12_000,
        endTime: 14_000,
        durationMs: 2_000,
        contentType: ContentType.UNKNOWN,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
    );
    expect(await repo.findOverlapping(FROM, TO)).toMatchObject([
      {
        contentType: ContentType.UNKNOWN,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      },
    ]);
  });
});
