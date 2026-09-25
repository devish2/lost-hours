/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { TodayLiveDashboardService } from '../../application/today/TodayLiveDashboardService';
import { UsageTrackingProvider } from './UsageTrackingContext';
import { UsageTrackingCompositionKind } from '../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { TodayLiveDataProvider, useTodayLiveData } from './TodayLiveDataProvider';

function Probe() {
  const { refreshToday } = useTodayLiveData();
  React.useEffect(() => {
    refreshToday();
    refreshToday();
    refreshToday();
  }, [refreshToday]);
  return null;
}

describe('TodayLiveDataProvider refresh single-flight', () => {
  it('shares one in-flight refresh when triggered concurrently', async () => {
    let resolveRefresh!: () => void;
    const refreshToday = jest.fn(
      () =>
        new Promise<{ kind: 'empty'; dashboard: unknown }>(resolve => {
          resolveRefresh = () =>
            resolve({
              kind: 'empty',
              dashboard: {
                date: '2024-06-15',
                totalTrackedMs: 0,
                totalLostMs: 0,
                productiveMs: 0,
                neutralMs: 0,
                leisureMs: 0,
                wasteMs: 0,
                unknownMs: 0,
                lostSessionCount: 0,
                lostByPlatform: [],
                apps: [],
              },
            });
        }),
    );

    const service = {
      refreshToday,
      openUsageAccessSettings: jest.fn(),
    } as unknown as TodayLiveDashboardService;

    await act(async () => {
      ReactTestRenderer.create(
        <UsageTrackingProvider
          composition={{
            kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
            provider: new MockUsageTrackingProvider(),
            appMetadataPort: noOpAppMetadataPort,
          }}>
          <TodayLiveDataProvider service={service}>
            <Probe />
          </TodayLiveDataProvider>
        </UsageTrackingProvider>,
      );
      await Promise.resolve();
    });

    expect(refreshToday).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefresh();
      await Promise.resolve();
    });
  });
});
