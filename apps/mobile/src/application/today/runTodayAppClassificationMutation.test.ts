import { TodayClassificationMutationError } from './TodayAppClassificationActions';
import { runTodayAppClassificationMutation } from './runTodayAppClassificationMutation';

describe('runTodayAppClassificationMutation', () => {
  const refreshResult = { kind: 'success' as const, dashboard: {} as never };

  it('calls refresh after successful persistence', async () => {
    const persist = jest.fn(async () => {});
    const refreshToday = jest.fn(async () => refreshResult);

    const result = await runTodayAppClassificationMutation({
      persist,
      refreshToday,
    });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(refreshToday).toHaveBeenCalledTimes(1);
    expect(result).toBe(refreshResult);
  });

  it('does not refresh when persistence fails', async () => {
    const persist = jest.fn(async () => {
      throw new Error('disk full');
    });
    const refreshToday = jest.fn(async () => refreshResult);

    await expect(
      runTodayAppClassificationMutation({ persist, refreshToday }),
    ).rejects.toMatchObject({
      stage: 'persist',
      rulePersisted: false,
      message: 'Could not save classification. Try again.',
    });
    expect(refreshToday).not.toHaveBeenCalled();
  });

  it('marks rule persisted when refresh fails after save', async () => {
    const persist = jest.fn(async () => {});
    const refreshToday = jest.fn(async () => {
      throw new Error('sync failed');
    });

    try {
      await runTodayAppClassificationMutation({ persist, refreshToday });
      fail('expected mutation error');
    } catch (error) {
      expect(error).toBeInstanceOf(TodayClassificationMutationError);
      expect(error).toMatchObject({
        stage: 'refresh',
        rulePersisted: true,
        message:
          'Classification was saved, but Today could not refresh. Try refreshing again.',
      });
    }
  });
});
