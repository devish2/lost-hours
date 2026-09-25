import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { deriveAppUserClassificationRuleId } from '../../domain/classification/appUserClassificationRule';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { noOpAppMetadataPort } from '../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import type { InitializedStorage } from '../../infrastructure/storage/createInitializedStorage';
import { TodayLiveDashboardService } from './TodayLiveDashboardService';

describe('TodayLiveDashboardService app classification (D3.10)', () => {
  const SNAPCHAT = 'com.snapchat.android';
  const composition: UsageTrackingComposition = {
    kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
    provider: new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.GRANTED,
    }),
    appMetadataPort: noOpAppMetadataPort,
  };

  it('setClassification persists via AppUserClassification then refreshes', async () => {
    const ruleRepository = new InMemoryClassificationRuleRepository();
    const refreshToday = jest.fn(async () => ({
      kind: 'empty' as const,
      dashboard: {} as never,
    }));
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
    jest.spyOn(service, 'refreshToday').mockImplementation(refreshToday);

    await service.setClassification(SNAPCHAT, ActivityClassification.WASTE);

    const rule = await ruleRepository.findById(
      deriveAppUserClassificationRuleId(SNAPCHAT),
    );
    expect(rule?.classification).toBe(ActivityClassification.WASTE);
    expect(refreshToday).toHaveBeenCalledTimes(1);
  });

  it('clearClassification removes rule then refreshes', async () => {
    const ruleRepository = new InMemoryClassificationRuleRepository();
    const refreshToday = jest.fn(async () => ({
      kind: 'empty' as const,
      dashboard: {} as never,
    }));
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
    jest.spyOn(service, 'refreshToday').mockImplementation(refreshToday);

    await service.setClassification(SNAPCHAT, ActivityClassification.PRODUCTIVE);
    await service.clearClassification(SNAPCHAT);

    expect(
      await ruleRepository.findById(deriveAppUserClassificationRuleId(SNAPCHAT)),
    ).toBeNull();
    expect(refreshToday).toHaveBeenCalledTimes(2);
  });
});
