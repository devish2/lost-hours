import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import { TodayLiveDashboardService } from './TodayLiveDashboardService';

describe('TodayLiveDashboardService error mapping', () => {
  it('maps storage initialization failure to QUERY_FAILED', async () => {
    const composition: UsageTrackingComposition = {
      kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
      provider: new MockUsageTrackingProvider({
        permissionStatus: UsageTrackingPermissionStatus.GRANTED,
      }),
    };

    const service = new TodayLiveDashboardService({
      composition,
      getStorage: jest.fn(async () => {
        throw new Error('db open failed');
      }),
    });

    await expect(service.refreshToday()).rejects.toMatchObject({
      code: 'QUERY_FAILED',
    });
  });

  it('maps permission denial to PERMISSION_REQUIRED before storage access', async () => {
    const getStorage = jest.fn();
    const composition: UsageTrackingComposition = {
      kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
      provider: new MockUsageTrackingProvider({
        permissionStatus: UsageTrackingPermissionStatus.DENIED,
      }),
    };

    const service = new TodayLiveDashboardService({ composition, getStorage });

    await expect(service.refreshToday()).rejects.toMatchObject({
      code: 'PERMISSION_REQUIRED',
    });
    expect(getStorage).not.toHaveBeenCalled();
  });
});
