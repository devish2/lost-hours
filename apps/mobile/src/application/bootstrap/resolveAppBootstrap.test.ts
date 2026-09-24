import { InMemoryOnboardingStateRepository } from '../../infrastructure/preferences/testSupport/InMemoryOnboardingStateRepository';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import {
  resolveAppBootstrap,
  resolvePermissionForCompletedOnboarding,
} from './resolveAppBootstrap';

function androidComposition(
  provider: MockUsageTrackingProvider,
): UsageTrackingComposition {
  return {
    kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
    provider,
  };
}

describe('resolveAppBootstrap', () => {
  it('routes first launch to Welcome without checking permission', async () => {
    const provider = new MockUsageTrackingProvider();
    const getStatus = jest.spyOn(provider, 'getPermissionStatus');

    const destination = await resolveAppBootstrap({
      onboardingRepository: new InMemoryOnboardingStateRepository(),
      composition: androidComposition(provider),
    });

    expect(destination).toBe('welcome_required');
    expect(getStatus).not.toHaveBeenCalled();
  });

  it('routes completed user with GRANTED permission to Main', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    await repository.markOnboardingCompleted();

    const destination = await resolveAppBootstrap({
      onboardingRepository: repository,
      composition: androidComposition(
        new MockUsageTrackingProvider({
          permissionStatus: UsageTrackingPermissionStatus.GRANTED,
        }),
      ),
    });

    expect(destination).toBe('ready');
  });

  it('routes completed user with DENIED permission to Usage Permission', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    await repository.markOnboardingCompleted();

    const destination = await resolveAppBootstrap({
      onboardingRepository: repository,
      composition: androidComposition(
        new MockUsageTrackingProvider({
          permissionStatus: UsageTrackingPermissionStatus.DENIED,
        }),
      ),
    });

    expect(destination).toBe('permission_required');
  });

  it('routes completed user with UNKNOWN permission to Usage Permission', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    await repository.markOnboardingCompleted();

    const destination = await resolveAppBootstrap({
      onboardingRepository: repository,
      composition: androidComposition(
        new MockUsageTrackingProvider({
          permissionStatus: UsageTrackingPermissionStatus.UNKNOWN,
        }),
      ),
    });

    expect(destination).toBe('permission_required');
  });

  it('routes completed user with native unavailable to Permission', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    await repository.markOnboardingCompleted();

    const destination = await resolveAppBootstrap({
      onboardingRepository: repository,
      composition: {
        kind: UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE,
        provider: null,
      },
    });

    expect(destination).toBe('permission_required');
  });

  it('falls back to Welcome when onboarding read fails', async () => {
    const repository = new InMemoryOnboardingStateRepository();
    repository.setReadShouldFail(true);

    const destination = await resolveAppBootstrap({
      onboardingRepository: repository,
      composition: androidComposition(new MockUsageTrackingProvider()),
    });

    expect(destination).toBe('welcome_required');
  });
});

describe('resolvePermissionForCompletedOnboarding (revoked permission cold start)', () => {
  it('returns permission_required when onboardingCompleted=true and permission=DENIED', async () => {
    const destination = await resolvePermissionForCompletedOnboarding(
      androidComposition(
        new MockUsageTrackingProvider({
          permissionStatus: UsageTrackingPermissionStatus.DENIED,
        }),
      ),
    );
    expect(destination).toBe('permission_required');
  });
});
