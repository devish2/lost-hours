import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { deriveAppUserClassificationRuleId } from '../../domain/classification/appUserClassificationRule';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { AppUserClassification } from '../use-cases/AppUserClassification';
import { TodayDashboardRefreshError } from '../today/TodayDashboardRefreshError';
import { TodayLiveDashboardService } from '../today/TodayLiveDashboardService';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import type { InitializedStorage } from '../../infrastructure/storage/createInitializedStorage';

describe('Day 3 permission revocation regression (D3.11)', () => {
  it('keeps persisted classification rules when Today refresh is permission-blocked', async () => {
    const ruleRepository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(ruleRepository);
    await appClassification.setClassification(
      'com.snapchat.android',
      ActivityClassification.WASTE,
    );

    const composition: UsageTrackingComposition = {
      kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
      provider: new MockUsageTrackingProvider({
        permissionStatus: UsageTrackingPermissionStatus.DENIED,
      }),
      appMetadataPort: noOpAppMetadataPort,
    };
    const service = new TodayLiveDashboardService({
      composition,
      getStorage: jest.fn(async () =>
        ({
          db: {} as never,
          repositories: {
            classificationRules: ruleRepository,
            usageSessions: {} as never,
          },
        }) as unknown as InitializedStorage,
      ),
    });

    await expect(service.refreshToday()).rejects.toBeInstanceOf(
      TodayDashboardRefreshError,
    );
    expect(
      await ruleRepository.findById(
        deriveAppUserClassificationRuleId('com.snapchat.android'),
      ),
    ).toBeDefined();
  });
});
