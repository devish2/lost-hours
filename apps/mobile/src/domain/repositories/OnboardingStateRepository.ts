/** Persists product onboarding completion only — not Usage Access grant state. */
export interface OnboardingStateRepository {
  isOnboardingCompleted(): Promise<boolean>;
  markOnboardingCompleted(): Promise<void>;
}

export class OnboardingStateReadError extends Error {
  constructor(cause?: unknown) {
    super('Could not read onboarding state');
    this.name = 'OnboardingStateReadError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export class OnboardingStateWriteError extends Error {
  constructor(cause?: unknown) {
    super('Could not save onboarding completion');
    this.name = 'OnboardingStateWriteError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
