/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { HistoricalDayDetailLiveDataProvider } from '../../../app/providers/HistoricalDayDetailLiveDataProvider';
import { HistoricalDayDetailLiveService } from '../../../application/history/HistoricalDayDetailLiveService';
import { getLocalCalendarDayStart } from '../../../shared/time/localCalendarDay';
import { HistoricalDayDetailScreen } from './HistoricalDayDetailScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

describe('HistoricalDayDetailScreen (D4.6)', () => {
  const dayStart = getLocalCalendarDayStart(Date.now());

  it('shows loading indicator while day detail loads', async () => {
    const service = {
      loadDayDetail: jest.fn(
        () =>
          new Promise<never>(() => {
            /* pending */
          }),
      ),
    } as unknown as HistoricalDayDetailLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoricalDayDetailLiveDataProvider
          dayStartTimestamp={dayStart}
          service={service}>
          <HistoricalDayDetailScreen />
        </HistoricalDayDetailLiveDataProvider>,
      );
    });

    expect(
      tree.root.findByProps({ accessibilityLabel: 'Loading day detail' }),
    ).toBeTruthy();
  });

  it('shows populated day detail with classification and apps', async () => {
    const service = {
      loadDayDetail: jest.fn(async () => ({
        dayStartTimestamp: dayStart,
        dayEndTimestamp: dayStart + 86_400_000,
        trackedDurationMs: 130 * 60_000,
        lostDurationMs: 30 * 60_000,
        productiveDurationMs: 20 * 60_000,
        neutralDurationMs: 15 * 60_000,
        leisureDurationMs: 25 * 60_000,
        unknownDurationMs: 40 * 60_000,
        apps: [
          {
            packageName: 'com.snapchat.android',
            displayName: 'Snapchat',
            platform: 'OTHER',
            classification: 'WASTE',
            classificationSource: 'USER_RULE',
            hasMixedClassification: false,
            hasMixedClassificationSource: false,
            trackedDurationMs: 30 * 60_000,
            lostDurationMs: 30 * 60_000,
          },
          {
            packageName: 'com.example.mixed',
            displayName: 'Mixed App',
            platform: 'OTHER',
            hasMixedClassification: true,
            hasMixedClassificationSource: false,
            trackedDurationMs: 30 * 60_000,
            lostDurationMs: 10 * 60_000,
          },
        ],
      })),
    } as unknown as HistoricalDayDetailLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoricalDayDetailLiveDataProvider
          dayStartTimestamp={dayStart}
          service={service}>
          <HistoricalDayDetailScreen />
        </HistoricalDayDetailLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const content = screenText(tree.root);
    expect(content).toMatch(/Today|Yesterday|[A-Z]{3} \d+/);
    expect(content).toContain('2h 10m tracked');
    expect(content).toContain('30m lost');
    expect(content).toContain('Productive');
    expect(content).toContain('Snapchat');
    expect(content).toContain('Lost');
    expect(content).toContain('Mixed');
    expect(service.loadDayDetail).toHaveBeenCalledWith({
      dayStartTimestamp: dayStart,
    });
  });

  it('shows empty day copy', async () => {
    const service = {
      loadDayDetail: jest.fn(async () => ({
        dayStartTimestamp: dayStart,
        dayEndTimestamp: dayStart + 1,
        trackedDurationMs: 0,
        lostDurationMs: 0,
        productiveDurationMs: 0,
        neutralDurationMs: 0,
        leisureDurationMs: 0,
        unknownDurationMs: 0,
        apps: [],
      })),
    } as unknown as HistoricalDayDetailLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoricalDayDetailLiveDataProvider
          dayStartTimestamp={dayStart}
          service={service}>
          <HistoricalDayDetailScreen />
        </HistoricalDayDetailLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screenText(tree.root)).toContain('No usage recorded for this day');
  });

  it('shows error and Retry when load fails', async () => {
    const service = {
      loadDayDetail: jest.fn(async () => {
        throw new Error('db locked');
      }),
    } as unknown as HistoricalDayDetailLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoricalDayDetailLiveDataProvider
          dayStartTimestamp={dayStart}
          service={service}>
          <HistoricalDayDetailScreen />
        </HistoricalDayDetailLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screenText(tree.root)).toContain('Could not load day detail');
    expect(screenText(tree.root)).toContain('Retry');
  });
});
