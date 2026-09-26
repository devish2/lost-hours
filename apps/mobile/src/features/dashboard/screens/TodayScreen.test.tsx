/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, Text } from 'react-native';

import { TodayLiveDataProvider } from '../../../app/providers/TodayLiveDataProvider';
import { UsageTrackingProvider } from '../../../app/providers/UsageTrackingContext';
import { TodayLiveDashboardService } from '../../../application/today/TodayLiveDashboardService';
import { UsageTrackingCompositionKind } from '../../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import { MockUsageTrackingProvider } from '../../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { ActivityClassification } from '../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../domain/classification/ClassificationSource';
import { Platform } from '../../../domain/platform/Platform';
import { TodayScreen } from './TodayScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const ReactLib = require('react');
    ReactLib.useLayoutEffect(() => {
      callback();
    }, [callback]);
  },
  useIsFocused: () => true,
}));

function renderTodayScreen(service: TodayLiveDashboardService) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(
      <UsageTrackingProvider
        composition={{
          kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
          provider: new MockUsageTrackingProvider(),
          appMetadataPort: noOpAppMetadataPort,
        }}>
        <TodayLiveDataProvider service={service}>
          <TodayScreen />
        </TodayLiveDataProvider>
      </UsageTrackingProvider>,
    );
  });
  return tree;
}

describe('TodayScreen', () => {
  beforeEach(() => {
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading then success without demo preview copy', async () => {
    const service = {
      refreshToday: jest.fn(async () => ({
        kind: 'success' as const,
        dashboard: {
          date: '2024-06-15',
          totalTrackedMs: 3_600_000,
          totalLostMs: 0,
          productiveMs: 0,
          neutralMs: 0,
          leisureMs: 0,
          wasteMs: 0,
          unknownMs: 3_600_000,
          lostSessionCount: 0,
          lostByPlatform: [],
          apps: [
            {
              packageName: 'com.snapchat.android',
              displayName: 'Snapchat',
              platform: Platform.OTHER,
              classification: ActivityClassification.WASTE,
              classificationSource: ClassificationSource.USER_RULE,
              hasMixedClassification: false,
              hasMixedClassificationSource: false,
              trackedDurationMs: 3_600_000,
              lostDurationMs: 3_600_000,
            },
          ],
        },
      })),
      openUsageAccessSettings: jest.fn(async () => {}),
    } as unknown as TodayLiveDashboardService;

    const tree = renderTodayScreen(service);
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const flattenText = (children: unknown): string => {
      if (typeof children === 'string') {
        return children;
      }
      if (Array.isArray(children)) {
        return children.map(flattenText).join('');
      }
      return '';
    };
    const content = tree.root
      .findAllByType(Text)
      .map(node => flattenText(node.props.children))
      .join(' ');
    expect(content).not.toContain('Preview data');
    expect(content).toContain('Total Tracked');
    expect(content).toContain('Total Tracked 1h');
    expect(content).not.toContain('2h 41m');
    expect(content).toContain('Apps');
    expect(content).toContain('Snapchat');
    expect(content).toContain('Lost ▾');
  });

  it('shows permission-required state', async () => {
    const { TodayDashboardRefreshError } =
      require('../../../application/today/TodayDashboardRefreshError');
    const service = {
      refreshToday: jest.fn(async () => {
        throw new TodayDashboardRefreshError(
          'PERMISSION_REQUIRED',
          'Usage Access permission is required',
        );
      }),
      openUsageAccessSettings: jest.fn(async () => {}),
    } as unknown as TodayLiveDashboardService;

    const tree = renderTodayScreen(service);
    await act(async () => {
      await Promise.resolve();
    });

    const flattenText = (children: unknown): string => {
      if (typeof children === 'string') {
        return children;
      }
      if (Array.isArray(children)) {
        return children.map(flattenText).join('');
      }
      return '';
    };
    const content = tree.root
      .findAllByType(Text)
      .map(node => flattenText(node.props.children))
      .join(' ');
    expect(content).toContain('Usage Access permission is required');
  });
});
