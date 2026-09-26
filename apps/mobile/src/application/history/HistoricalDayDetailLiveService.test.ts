import { HistoricalDayDetailLiveService } from './HistoricalDayDetailLiveService';
import { createGetHistoricalDayDetail } from '../../infrastructure/storage/createGetHistoricalDayDetail';

jest.mock('../../infrastructure/storage/createGetHistoricalDayDetail', () => ({
  createGetHistoricalDayDetail: jest.fn(),
}));

describe('HistoricalDayDetailLiveService (D4.6)', () => {
  it('loads day detail from persisted storage only (no UsageStats sync)', async () => {
    const execute = jest.fn(async () => ({
      dayStartTimestamp: 100,
      dayEndTimestamp: 200,
      trackedDurationMs: 0,
      lostDurationMs: 0,
      productiveDurationMs: 0,
      neutralDurationMs: 0,
      leisureDurationMs: 0,
      unknownDurationMs: 0,
      apps: [],
    }));
    jest.mocked(createGetHistoricalDayDetail).mockReturnValue({ execute } as never);

    const repositories = { usageSessions: {}, classificationRules: {} };
    const getStorage = jest.fn(async () => ({ repositories })) as unknown as typeof import('../../infrastructure/storage/getAppStorage').getAppStorage;
    const service = new HistoricalDayDetailLiveService({ getStorage });

    await service.loadDayDetail({ dayStartTimestamp: 100 });

    expect(getStorage).toHaveBeenCalledTimes(1);
    expect(createGetHistoricalDayDetail).toHaveBeenCalledWith(repositories);
    expect(execute).toHaveBeenCalledWith({ dayStartTimestamp: 100 });
  });
});
