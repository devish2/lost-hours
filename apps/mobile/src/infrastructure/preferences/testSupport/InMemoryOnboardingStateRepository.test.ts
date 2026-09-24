import { InMemoryOnboardingStateRepository } from './InMemoryOnboardingStateRepository';
import {
  OnboardingStateReadError,
  OnboardingStateWriteError,
} from '../../../domain/repositories/OnboardingStateRepository';

describe('InMemoryOnboardingStateRepository', () => {
  it('defaults to incomplete onboarding', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    await expect(repository.isOnboardingCompleted()).resolves.toBe(false);
  });

  it('persists completion across reads', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    await repository.markOnboardingCompleted();
    await expect(repository.isOnboardingCompleted()).resolves.toBe(true);
  });

  it('propagates read errors', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    repository.setReadShouldFail(true);
    await expect(repository.isOnboardingCompleted()).rejects.toBeInstanceOf(
      OnboardingStateReadError,
    );
  });

  it('propagates write errors', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    repository.setWriteShouldFail(true);
    await expect(repository.markOnboardingCompleted()).rejects.toBeInstanceOf(
      OnboardingStateWriteError,
    );
  });

  it('does not mutate unrelated keys', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    repository.setOtherKey('other-key', 'value');
    await repository.markOnboardingCompleted();
    expect(repository.getOtherKey('other-key')).toBe('value');
  });
});
