import { AsyncStorageOnboardingStateRepository } from './AsyncStorageOnboardingStateRepository';
import {
  ONBOARDING_COMPLETED_STORAGE_KEY,
  ONBOARDING_COMPLETED_STORAGE_VALUE,
} from './onboardingStateStorageKey';
import {
  OnboardingStateReadError,
  OnboardingStateWriteError,
} from '../../domain/repositories/OnboardingStateRepository';

describe('AsyncStorageOnboardingStateRepository', () => {
  it('treats malformed values as incomplete', async () => {
    const storage = {
      getItem: jest.fn(async () => 'yes'),
      setItem: jest.fn(async () => {}),
    };
    const repository = new AsyncStorageOnboardingStateRepository(storage);
    await expect(repository.isOnboardingCompleted()).resolves.toBe(false);
  });

  it('reads completion from storage value', async () => {
    const storage = {
      getItem: jest.fn(async () => ONBOARDING_COMPLETED_STORAGE_VALUE),
      setItem: jest.fn(async () => {}),
    };
    const repository = new AsyncStorageOnboardingStateRepository(storage);

    await expect(repository.isOnboardingCompleted()).resolves.toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith(ONBOARDING_COMPLETED_STORAGE_KEY);
  });

  it('writes completion flag', async () => {
    const storage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => {}),
    };
    const repository = new AsyncStorageOnboardingStateRepository(storage);

    await repository.markOnboardingCompleted();
    expect(storage.setItem).toHaveBeenCalledWith(
      ONBOARDING_COMPLETED_STORAGE_KEY,
      ONBOARDING_COMPLETED_STORAGE_VALUE,
    );
  });

  it('wraps storage read failures', async () => {
    const repository = new AsyncStorageOnboardingStateRepository({
      getItem: jest.fn(async () => {
        throw new Error('disk');
      }),
      setItem: jest.fn(async () => {}),
    });

    await expect(repository.isOnboardingCompleted()).rejects.toBeInstanceOf(
      OnboardingStateReadError,
    );
  });

  it('wraps storage write failures', async () => {
    const repository = new AsyncStorageOnboardingStateRepository({
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => {
        throw new Error('disk');
      }),
    });

    await expect(repository.markOnboardingCompleted()).rejects.toBeInstanceOf(
      OnboardingStateWriteError,
    );
  });
});
