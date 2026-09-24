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
import { MockUsageTrackingProvider } from '../../../infrastructure/tracking/mock/MockUsageTrackingProvider';
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

    const content = tree.root
      .findAllByType(Text)
      .map(node =>
        typeof node.props.children === 'string' ? node.props.children : '',
      )
      .join(' ');
    expect(content).not.toContain('Preview data');
    expect(content).toContain('Total Tracked');
    expect(content).toContain('Total Tracked 1h');
    expect(content).not.toContain('2h 41m');
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

    const content = tree.root
      .findAllByType(Text)
      .map(node =>
        typeof node.props.children === 'string' ? node.props.children : '',
      )
      .join(' ');
    expect(content).toContain('Usage Access permission is required');
  });
});
