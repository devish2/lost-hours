import { HistoryLiveService } from './HistoryLiveService';
import { createGetHistory } from '../../infrastructure/storage/createGetHistory';

jest.mock('../../infrastructure/storage/createGetHistory', () => ({
  createGetHistory: jest.fn(),
}));

describe('HistoryLiveService (D4.5)', () => {
  it('loads History from persisted storage only (no UsageStats sync)', async () => {
    const execute = jest.fn(async () => ({
      fromTimestamp: 1,
      toTimestamp: 2,
      baseline: {
        status: 'COLLECTING' as const,
        observedCalendarDays: 0,
        targetCalendarDays: 7,
        trackedDurationMs: 0,
      },
      days: [],
    }));
    jest.mocked(createGetHistory).mockReturnValue({ execute } as never);

    const repositories = { usageSessions: {}, classificationRules: {} };
    const getStorage = jest.fn(async () => ({ repositories })) as unknown as typeof import('../../infrastructure/storage/getAppStorage').getAppStorage;
    const clock = { now: () => 99_000 };

    const service = new HistoryLiveService({ getStorage, clock });
    const result = await service.loadHistory();

    expect(getStorage).toHaveBeenCalledTimes(1);
    expect(createGetHistory).toHaveBeenCalledWith(repositories);
    expect(execute).toHaveBeenCalledWith({
      nowTimestamp: 99_000,
      numberOfLocalCalendarDays: undefined,
    });
    expect(result.nowTimestamp).toBe(99_000);
  });
});
