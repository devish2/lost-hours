import type { OnboardingStateRepository } from '../../../domain/repositories/OnboardingStateRepository';
import {
  OnboardingStateReadError,
  OnboardingStateWriteError,
} from '../../../domain/repositories/OnboardingStateRepository';

export class InMemoryOnboardingStateRepository
  implements OnboardingStateRepository
{
  private completed = false;
  private readShouldFail = false;
  private writeShouldFail = false;
  private readonly otherKeys = new Map<string, string>();

  async isOnboardingCompleted(): Promise<boolean> {
    if (this.readShouldFail) {
      throw new OnboardingStateReadError(new Error('read failed'));
    }
    return this.completed;
  }

  async markOnboardingCompleted(): Promise<void> {
    if (this.writeShouldFail) {
      throw new OnboardingStateWriteError(new Error('write failed'));
    }
    this.completed = true;
  }

  setReadShouldFail(shouldFail: boolean): void {
    this.readShouldFail = shouldFail;
  }

  setWriteShouldFail(shouldFail: boolean): void {
    this.writeShouldFail = shouldFail;
  }

  /** Simulates unrelated preference keys remaining untouched. */
  setOtherKey(key: string, value: string): void {
    this.otherKeys.set(key, value);
  }

  getOtherKey(key: string): string | undefined {
    return this.otherKeys.get(key);
  }
}
