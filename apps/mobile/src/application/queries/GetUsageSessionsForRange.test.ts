import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { GetUsageSessionsForRange } from './GetUsageSessionsForRange';

describe('GetUsageSessionsForRange', () => {
  it('forwards overlap query for a valid half-open window', async () => {
    const repository = new InMemoryUsageSessionRepository();
    await repository.save(
      createUsageSession({
        id: 's1',
        startTime: 12_000,
        endTime: 15_000,
        durationMs: 3_000,
      }),
    );
    const query = new GetUsageSessionsForRange(repository);
    const sessions = await query.execute({
      fromTimestamp: 10_000,
      toTimestamp: 20_000,
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.id).toBe('s1');
  });

  it('returns empty array when repository has no overlapping sessions', async () => {
    const repository = new InMemoryUsageSessionRepository();
    const query = new GetUsageSessionsForRange(repository);
    const sessions = await query.execute({
      fromTimestamp: 0,
      toTimestamp: 1_000,
    });
    expect(sessions).toEqual([]);
  });

  it('rejects invalid windows', async () => {
    const repository = new InMemoryUsageSessionRepository();
    const query = new GetUsageSessionsForRange(repository);
    await expect(
      query.execute({ fromTimestamp: -1, toTimestamp: 1000 }),
    ).rejects.toThrow(/>= 0/);
    await expect(
      query.execute({ fromTimestamp: 0, toTimestamp: -1 }),
    ).rejects.toThrow(/>= 0/);
    await expect(
      query.execute({ fromTimestamp: 1000, toTimestamp: 1000 }),
    ).rejects.toThrow(/fromTimestamp < toTimestamp/);
    await expect(
      query.execute({ fromTimestamp: 2000, toTimestamp: 1000 }),
    ).rejects.toThrow(/fromTimestamp < toTimestamp/);
  });

  it('propagates repository errors', async () => {
    const repository = new InMemoryUsageSessionRepository();
    jest
      .spyOn(repository, 'findOverlapping')
      .mockRejectedValue(new Error('db failure'));
    const query = new GetUsageSessionsForRange(repository);
    await expect(
      query.execute({ fromTimestamp: 0, toTimestamp: 1000 }),
    ).rejects.toThrow(/db failure/);
  });

  it('does not mutate returned sessions', async () => {
    const repository = new InMemoryUsageSessionRepository();
    const stored = createUsageSession({
      id: 'immutable',
      startTime: 100,
      endTime: 500,
      durationMs: 400,
    });
    await repository.save(stored);
    const query = new GetUsageSessionsForRange(repository);
    const sessions = await query.execute({ fromTimestamp: 0, toTimestamp: 1000 });
    expect(sessions[0]).toEqual(stored);
    expect(sessions[0]).not.toBe(stored);
  });
});
