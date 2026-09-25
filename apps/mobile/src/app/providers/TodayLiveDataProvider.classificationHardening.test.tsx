/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { TodayLiveDashboardService } from '../../application/today/TodayLiveDashboardService';
import { UsageTrackingProvider } from './UsageTrackingContext';
import { UsageTrackingCompositionKind } from '../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { TodayLiveDataProvider, useTodayLiveData } from './TodayLiveDataProvider';

function MutationProbe() {
  const { setAppClassification } = useTodayLiveData();
  React.useEffect(() => {
    setAppClassification('com.snapchat.android', ActivityClassification.WASTE);
    setAppClassification('com.snapchat.android', ActivityClassification.WASTE);
  }, [setAppClassification]);
  return null;
}

describe('TodayLiveDataProvider classification hardening (D3.11)', () => {
  it('serializes concurrent setAppClassification for the same package', async () => {
    let resolveFirst!: () => void;
    const setClassification = jest.fn(
      () =>
        new Promise<{ kind: 'empty'; dashboard: unknown }>(resolve => {
          resolveFirst = () => resolve({ kind: 'empty', dashboard: {} });
        }),
    );
    const service = {
      refreshToday: jest.fn(async () => ({ kind: 'empty', dashboard: {} })),
      openUsageAccessSettings: jest.fn(),
      getExplicitAppClassification: jest.fn(async () => null),
      setClassification,
      clearClassification: jest.fn(),
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
            <MutationProbe />
          </TodayLiveDataProvider>
        </UsageTrackingProvider>,
      );
      await Promise.resolve();
    });

    expect(setClassification).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst();
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('does not set state after unmount during classification mutation', async () => {
    let resolveMutation!: () => void;
    const setClassification = jest.fn(
      () =>
        new Promise<{ kind: 'empty'; dashboard: unknown }>(resolve => {
          resolveMutation = () => resolve({ kind: 'empty', dashboard: {} });
        }),
    );
    const service = {
      refreshToday: jest.fn(),
      openUsageAccessSettings: jest.fn(),
      getExplicitAppClassification: jest.fn(async () => null),
      setClassification,
      clearClassification: jest.fn(),
    } as unknown as TodayLiveDashboardService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <UsageTrackingProvider
          composition={{
            kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
            provider: new MockUsageTrackingProvider(),
            appMetadataPort: noOpAppMetadataPort,
          }}>
          <TodayLiveDataProvider service={service}>
            <MutationProbe />
          </TodayLiveDataProvider>
        </UsageTrackingProvider>,
      );
    });

    await act(async () => {
      tree.unmount();
      resolveMutation();
      await Promise.resolve();
    });
  });
});
