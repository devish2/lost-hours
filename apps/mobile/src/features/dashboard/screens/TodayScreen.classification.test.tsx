/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, Text } from 'react-native';

import { TodayLiveDataProvider } from '../../../app/providers/TodayLiveDataProvider';
import { UsageTrackingProvider } from '../../../app/providers/UsageTrackingContext';
import { ActivityClassification } from '../../../domain/classification/ActivityClassification';
import { Platform } from '../../../domain/platform/Platform';
import { TodayLiveDashboardService } from '../../../application/today/TodayLiveDashboardService';
import { UsageTrackingCompositionKind } from '../../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import { MockUsageTrackingProvider } from '../../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import type { TodayDashboardModel } from '../../../application/models/TodayDashboardModel';
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

const SNAPCHAT = 'com.snapchat.android';
const CHROME = 'com.android.chrome';
const MIN_MS = 60 * 1000;

function baseDashboard(
  overrides: Partial<TodayDashboardModel> = {},
): TodayDashboardModel {
  return {
    date: '2024-06-15',
    totalTrackedMs: 30 * MIN_MS,
    totalLostMs: 0,
    productiveMs: 0,
    neutralMs: 0,
    leisureMs: 0,
    wasteMs: 0,
    unknownMs: 30 * MIN_MS,
    lostSessionCount: 0,
    lostByPlatform: [],
    apps: [
      {
        packageName: SNAPCHAT,
        displayName: 'Snapchat',
        platform: Platform.OTHER,
        classification: ActivityClassification.UNKNOWN,
        hasMixedClassification: false,
        hasMixedClassificationSource: false,
        trackedDurationMs: 30 * MIN_MS,
        lostDurationMs: 0,
      },
    ],
    ...overrides,
  };
}

function createClassificationService(
  initialDashboard: TodayDashboardModel,
  handlers: {
    setClassification?: TodayLiveDashboardService['setClassification'];
    clearClassification?: TodayLiveDashboardService['clearClassification'];
    getExplicitAppClassification?: TodayLiveDashboardService['getExplicitAppClassification'];
  } = {},
) {
  let dashboard = initialDashboard;
  return {
    service: {
      refreshToday: jest.fn(async () => ({
        kind: 'success' as const,
        dashboard,
      })),
      openUsageAccessSettings: jest.fn(async () => {}),
      getExplicitAppClassification:
        handlers.getExplicitAppClassification ??
        jest.fn(async () => null),
      setClassification:
        handlers.setClassification ??
        jest.fn(async (_packageName, classification) => {
          dashboard = baseDashboard({
            totalLostMs:
              classification === ActivityClassification.WASTE ? 30 * MIN_MS : 0,
            wasteMs:
              classification === ActivityClassification.WASTE ? 30 * MIN_MS : 0,
            unknownMs: 0,
            productiveMs:
              classification === ActivityClassification.PRODUCTIVE
                ? 30 * MIN_MS
                : 0,
            apps: [
              {
                packageName: SNAPCHAT,
                displayName: 'Snapchat',
                platform: Platform.OTHER,
                classification,
                hasMixedClassification: false,
                hasMixedClassificationSource: false,
                trackedDurationMs: 30 * MIN_MS,
                lostDurationMs:
                  classification === ActivityClassification.WASTE
                    ? 30 * MIN_MS
                    : 0,
              },
            ],
          });
          return { kind: 'success' as const, dashboard };
        }),
      clearClassification:
        handlers.clearClassification ??
        jest.fn(async () => {
          dashboard = baseDashboard();
          return { kind: 'success' as const, dashboard };
        }),
    } as unknown as TodayLiveDashboardService,
  };
}

async function renderAndSettle(service: TodayLiveDashboardService) {
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
          <TodayScreen />
        </TodayLiveDataProvider>
      </UsageTrackingProvider>,
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  return tree;
}

function flattenTextChildren(children: unknown): string {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(flattenTextChildren).join('');
  }
  if (children != null && typeof children === 'object' && 'props' in children) {
    return flattenTextChildren(
      (children as { props: { children?: unknown } }).props.children,
    );
  }
  return '';
}

function textContent(tree: ReactTestRenderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map(node => flattenTextChildren(node.props.children))
    .join(' ');
}

describe('TodayScreen classification editing (D3.10)', () => {
  beforeEach(() => {
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens classification chooser from rendered TodayScreen when UNKNOWN control is pressed', async () => {
    const { service } = createClassificationService(baseDashboard());
    const tree = await renderAndSettle(service);

    const control = tree.root.findByProps({
      testID: `today-app-classification-control:${SNAPCHAT}`,
    });
    expect(control.props.accessibilityRole).toBe('button');
    expect(typeof control.props.onPress).toBe('function');

    await act(async () => {
      if (typeof control.props.onPress === 'function') {
        control.props.onPress();
      }
      await Promise.resolve();
    });

    expect(
      tree.root.findByProps({ testID: 'today-app-classification-chooser' }),
    ).toBeTruthy();
    expect(
      tree.root.findByProps({
        testID: `today-app-classify:${SNAPCHAT}:${ActivityClassification.WASTE}`,
      }),
    ).toBeTruthy();
    expect(
      tree.root.findByProps({
        testID: `today-app-classify:${SNAPCHAT}:${ActivityClassification.PRODUCTIVE}`,
      }),
    ).toBeTruthy();
  });

  it('A: UNKNOWN → WASTE uses packageName and refreshes model', async () => {
    const setClassification = jest.fn(
      async (packageName: string, classification: ActivityClassification) => {
        expect(packageName).toBe(SNAPCHAT);
        expect(classification).toBe(ActivityClassification.WASTE);
        return {
          kind: 'success' as const,
          dashboard: baseDashboard({
            totalLostMs: 30 * MIN_MS,
            wasteMs: 30 * MIN_MS,
            unknownMs: 0,
            apps: [
              {
                packageName: SNAPCHAT,
                displayName: 'Snapchat',
                platform: Platform.OTHER,
                classification: ActivityClassification.WASTE,
                hasMixedClassification: false,
                hasMixedClassificationSource: false,
                trackedDurationMs: 30 * MIN_MS,
                lostDurationMs: 30 * MIN_MS,
              },
            ],
          }),
        };
      },
    );
    const { service } = createClassificationService(baseDashboard(), {
      setClassification,
    });
    const tree = await renderAndSettle(service);

    const control = tree.root.findByProps({
      testID: `today-app-classification-control:${SNAPCHAT}`,
    });
    await act(async () => {
      control.props.onPress();
      await Promise.resolve();
    });

    const wasteOption = tree.root.findByProps({
      testID: `today-app-classify:${SNAPCHAT}:${ActivityClassification.WASTE}`,
    });
    await act(async () => {
      wasteOption.props.onPress();
      await Promise.resolve();
    });

    expect(setClassification).toHaveBeenCalledWith(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    expect(textContent(tree)).toContain('Lost ▾');
    expect(textContent(tree)).toContain('Lost Hours 30m');
  });

  it('B: WASTE → PRODUCTIVE keeps package identity', async () => {
    const setClassification = jest.fn(async (packageName: string) => {
      expect(packageName).toBe(SNAPCHAT);
      return {
        kind: 'success' as const,
        dashboard: baseDashboard({
          totalLostMs: 0,
          wasteMs: 0,
          productiveMs: 30 * MIN_MS,
          unknownMs: 0,
          apps: [
            {
              packageName: SNAPCHAT,
              displayName: 'Snapchat',
              platform: Platform.OTHER,
              classification: ActivityClassification.PRODUCTIVE,
              hasMixedClassification: false,
              hasMixedClassificationSource: false,
              trackedDurationMs: 30 * MIN_MS,
              lostDurationMs: 0,
            },
          ],
        }),
      };
    });
    const { service } = createClassificationService(
      baseDashboard({
        totalLostMs: 30 * MIN_MS,
        wasteMs: 30 * MIN_MS,
        unknownMs: 0,
        apps: [
          {
            packageName: SNAPCHAT,
            displayName: 'Snapchat',
            platform: Platform.OTHER,
            classification: ActivityClassification.WASTE,
            hasMixedClassification: false,
            hasMixedClassificationSource: false,
            trackedDurationMs: 30 * MIN_MS,
            lostDurationMs: 30 * MIN_MS,
          },
        ],
      }),
      {
        setClassification,
        getExplicitAppClassification: jest.fn(async () => ActivityClassification.WASTE),
      },
    );
    const tree = await renderAndSettle(service);

    await act(async () => {
      tree.root
        .findByProps({ testID: `today-app-classification-control:${SNAPCHAT}` })
        .props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      tree.root
        .findByProps({
          testID: `today-app-classify:${SNAPCHAT}:${ActivityClassification.PRODUCTIVE}`,
        })
        .props.onPress();
      await Promise.resolve();
    });

    expect(setClassification).toHaveBeenCalledWith(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    expect(textContent(tree)).toContain('Productive');
  });

  it('C: Clear classification when explicit USER_RULE exists', async () => {
    const clearClassification = jest.fn(async (packageName: string) => {
      expect(packageName).toBe(SNAPCHAT);
      return { kind: 'success' as const, dashboard: baseDashboard() };
    });
    const { service } = createClassificationService(
      baseDashboard({
        productiveMs: 30 * MIN_MS,
        unknownMs: 0,
        apps: [
          {
            packageName: SNAPCHAT,
            displayName: 'Snapchat',
            platform: Platform.OTHER,
            classification: ActivityClassification.PRODUCTIVE,
            hasMixedClassification: false,
            hasMixedClassificationSource: false,
            trackedDurationMs: 30 * MIN_MS,
            lostDurationMs: 0,
          },
        ],
      }),
      {
        clearClassification,
        getExplicitAppClassification: jest.fn(async () =>
          ActivityClassification.PRODUCTIVE,
        ),
      },
    );
    const tree = await renderAndSettle(service);

    await act(async () => {
      tree.root
        .findByProps({ testID: `today-app-classification-control:${SNAPCHAT}` })
        .props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      tree.root.findByProps({ testID: `today-app-clear:${SNAPCHAT}` }).props.onPress();
      await Promise.resolve();
    });

    expect(clearClassification).toHaveBeenCalledWith(SNAPCHAT);
    expect(textContent(tree)).toContain('Unknown');
  });

  it('D: Cancel does not mutate', async () => {
    const setClassification = jest.fn();
    const { service } = createClassificationService(baseDashboard(), {
      setClassification,
    });
    const tree = await renderAndSettle(service);

    await act(async () => {
      tree.root
        .findByProps({ testID: `today-app-classification-control:${SNAPCHAT}` })
        .props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      tree.root.findByProps({ testID: 'today-app-classify-cancel' }).props.onPress();
    });

    expect(setClassification).not.toHaveBeenCalled();
  });

  it('E: mutation failure shows error without fake state', async () => {
    const setClassification = jest.fn(async () => {
      throw new (require('../../../application/today/TodayAppClassificationActions').TodayClassificationMutationError)(
        'persist',
        false,
        'Could not save classification. Try again.',
      );
    });
    const { service } = createClassificationService(baseDashboard(), {
      setClassification,
    });
    const tree = await renderAndSettle(service);

    await act(async () => {
      tree.root
        .findByProps({ testID: `today-app-classification-control:${SNAPCHAT}` })
        .props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      tree.root
        .findByProps({
          testID: `today-app-classify:${SNAPCHAT}:${ActivityClassification.WASTE}`,
        })
        .props.onPress();
      await Promise.resolve();
    });

    expect(textContent(tree)).toContain('Could not save classification');
    expect(
      tree.root.findByProps({
        testID: `today-app-classification-control:${SNAPCHAT}`,
      }).props.accessibilityLabel,
    ).toContain('Unknown');
  });

  it('classifies by packageName when two apps share displayName', async () => {
    const setClassification = jest.fn(async (packageName: string) => {
      expect(packageName).toBe(CHROME);
      return { kind: 'success' as const, dashboard: baseDashboard() };
    });
    const dashboard = baseDashboard({
      apps: [
        {
          packageName: SNAPCHAT,
          displayName: 'Browser',
          platform: Platform.OTHER,
          classification: ActivityClassification.UNKNOWN,
          hasMixedClassification: false,
          hasMixedClassificationSource: false,
          trackedDurationMs: 10 * MIN_MS,
          lostDurationMs: 0,
        },
        {
          packageName: CHROME,
          displayName: 'Browser',
          platform: Platform.OTHER,
          classification: ActivityClassification.UNKNOWN,
          hasMixedClassification: false,
          hasMixedClassificationSource: false,
          trackedDurationMs: 20 * MIN_MS,
          lostDurationMs: 0,
        },
      ],
    });
    const { service } = createClassificationService(dashboard, { setClassification });
    const tree = await renderAndSettle(service);

    await act(async () => {
      tree.root
        .findByProps({ testID: `today-app-classification-control:${CHROME}` })
        .props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      tree.root
        .findByProps({
          testID: `today-app-classify:${CHROME}:${ActivityClassification.NEUTRAL}`,
        })
        .props.onPress();
      await Promise.resolve();
    });

    expect(setClassification).toHaveBeenCalledWith(
      CHROME,
      ActivityClassification.NEUTRAL,
    );
  });
});
