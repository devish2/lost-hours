import type { OnboardingStateRepository } from '../../domain/repositories/OnboardingStateRepository';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import type { AppBootstrapDestination } from './AppBootstrapDestination';

export type ResolveAppBootstrapInput = {
  onboardingRepository: OnboardingStateRepository;
  composition: UsageTrackingComposition;
};

/** Completed users with non-Android or unavailable native tracking cannot enter Main. */
export async function resolvePermissionForCompletedOnboarding(
  composition: UsageTrackingComposition,
): Promise<AppBootstrapDestination> {
  if (composition.kind !== UsageTrackingCompositionKind.ANDROID_NATIVE) {
    return 'permission_required';
  }

  try {
    const status = await composition.provider.getPermissionStatus();
    if (status === UsageTrackingPermissionStatus.GRANTED) {
      return 'ready';
    }
    return 'permission_required';
  } catch {
    return 'permission_required';
  }
}

/**
 * Cold-start routing: persisted onboarding completion + live Usage Access check.
 * Read failures fall back to Welcome (safe default).
 */
export async function resolveAppBootstrap(
  input: ResolveAppBootstrapInput,
): Promise<AppBootstrapDestination> {
  let onboardingCompleted: boolean;
  try {
    onboardingCompleted =
      await input.onboardingRepository.isOnboardingCompleted();
  } catch {
    return 'welcome_required';
  }

  if (!onboardingCompleted) {
    return 'welcome_required';
  }

  return resolvePermissionForCompletedOnboarding(input.composition);
}
