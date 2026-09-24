import {
  getAppStorage,
  resetAppStorageForTests,
} from './getAppStorage';

jest.mock('./createInitializedStorage', () => ({
  createInitializedStorage: jest.fn(),
}));

const { createInitializedStorage } =
  require('./createInitializedStorage') as {
    createInitializedStorage: jest.Mock;
  };

describe('getAppStorage', () => {
  beforeEach(() => {
    resetAppStorageForTests();
    createInitializedStorage.mockReset();
  });

  it('memoizes successful initialization for concurrent callers', async () => {
    const storage = { repositories: {} };
    createInitializedStorage.mockReturnValue(Promise.resolve(storage));

    const [a, b] = await Promise.all([getAppStorage(), getAppStorage()]);
    expect(a).toBe(storage);
    expect(b).toBe(storage);
    expect(createInitializedStorage).toHaveBeenCalledTimes(1);
  });

  it('clears memo after failure so a later call can retry', async () => {
    createInitializedStorage
      .mockRejectedValueOnce(new Error('open failed'))
      .mockResolvedValueOnce({ repositories: {} });

    await expect(getAppStorage()).rejects.toThrow(/open failed/);
    await expect(getAppStorage()).resolves.toEqual({ repositories: {} });
    expect(createInitializedStorage).toHaveBeenCalledTimes(2);
  });
});
