/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { AppState, Text } from 'react-native';

import { HistoryLiveDataProvider } from '../providers/HistoryLiveDataProvider';
import { TodayLiveDataProvider } from '../providers/TodayLiveDataProvider';
import { HistoryLiveService } from '../../application/history/HistoryLiveService';
import { UsageTrackingProvider } from '../providers/UsageTrackingContext';
import { TodayLiveDashboardService } from '../../application/today/TodayLiveDashboardService';
import { UsageTrackingCompositionKind } from '../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { MainTabNavigator } from './MainTabNavigator';
import { MainTabRoutes } from './routeNames';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: (callback: () => void) => {
      const ReactLib = require('react');
      ReactLib.useLayoutEffect(() => {
        callback();
      }, [callback]);
    },
    useIsFocused: () => true,
  };
});

describe('MainTabNavigator', () => {
  beforeEach(() => {
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows Today, History, and Settings tabs with live Today shell', async () => {
    const service = {
      refreshToday: jest.fn(async () => ({
        kind: 'empty' as const,
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
      })),
      openUsageAccessSettings: jest.fn(async () => {}),
    } as unknown as TodayLiveDashboardService;

    const historyService = {
      loadHistory: jest.fn(async () => ({
        nowTimestamp: Date.now(),
        model: {
          fromTimestamp: 0,
          toTimestamp: 1,
          baseline: {
            status: 'COLLECTING' as const,
            observedCalendarDays: 0,
            targetCalendarDays: 7,
            trackedDurationMs: 0,
          },
          days: [],
        },
      })),
    } as unknown as HistoryLiveService;

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
            <HistoryLiveDataProvider service={historyService}>
              <NavigationContainer>
                <MainTabNavigator />
              </NavigationContainer>
            </HistoryLiveDataProvider>
          </TodayLiveDataProvider>
        </UsageTrackingProvider>,
      );
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

    expect(content).toContain(MainTabRoutes.Today);
    expect(content).not.toContain('Preview data');
    expect(content).toContain(MainTabRoutes.History);
    expect(content).toContain(MainTabRoutes.Settings);
  });
});
