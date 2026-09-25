import { resetAppStorageForTests } from './getAppStorage';
import {
  AppClassificationStorageError,
  getAppUserClassification,
} from './getAppUserClassification';

jest.mock('./getAppStorage', () => ({
  getAppStorage: jest.fn(),
  resetAppStorageForTests: jest.fn(),
}));

const { getAppStorage } = require('./getAppStorage') as {
  getAppStorage: jest.Mock;
};

describe('getAppUserClassification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAppStorageForTests();
  });

  it('returns AppUserClassification wired to SQLite classificationRules repository', async () => {
    const classificationRules = { save: jest.fn() };
    getAppStorage.mockResolvedValue({
      repositories: { classificationRules },
    });

    const service = await getAppUserClassification();
    expect(service).toBeDefined();
    expect(getAppStorage).toHaveBeenCalledTimes(1);
  });

  it('throws AppClassificationStorageError when storage initialization fails', async () => {
    getAppStorage.mockRejectedValue(new Error('db open failed'));

    await expect(getAppUserClassification()).rejects.toBeInstanceOf(
      AppClassificationStorageError,
    );
    await expect(getAppUserClassification()).rejects.toThrow(
      /Classification storage is unavailable/,
    );
  });
});
