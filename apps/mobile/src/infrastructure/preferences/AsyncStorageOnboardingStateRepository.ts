import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OnboardingStateRepository } from '../../domain/repositories/OnboardingStateRepository';
import {
  OnboardingStateReadError,
  OnboardingStateWriteError,
} from '../../domain/repositories/OnboardingStateRepository';
import {
  ONBOARDING_COMPLETED_STORAGE_KEY,
  ONBOARDING_COMPLETED_STORAGE_VALUE,
} from './onboardingStateStorageKey';

export type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export class AsyncStorageOnboardingStateRepository
  implements OnboardingStateRepository
{
  constructor(
    private readonly storage: AsyncStorageLike = AsyncStorage,
  ) {}

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const value = await this.storage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY);
      return value === ONBOARDING_COMPLETED_STORAGE_VALUE;
    } catch (error) {
      throw new OnboardingStateReadError(error);
    }
  }

  async markOnboardingCompleted(): Promise<void> {
    try {
      await this.storage.setItem(
        ONBOARDING_COMPLETED_STORAGE_KEY,
        ONBOARDING_COMPLETED_STORAGE_VALUE,
      );
    } catch (error) {
      throw new OnboardingStateWriteError(error);
    }
  }
}
