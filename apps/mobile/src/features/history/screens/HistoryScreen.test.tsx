/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { HistoryLiveDataProvider } from '../../../app/providers/HistoryLiveDataProvider';
import { HistoryLiveService } from '../../../application/history/HistoryLiveService';
import { HistoryRoutes } from '../../../app/navigation/routeNames';
import { HistoryScreen } from './HistoryScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

describe('HistoryScreen (D4.5)', () => {
  it('shows loading indicator while History is loading', async () => {
    const service = {
      loadHistory: jest.fn(
        () =>
          new Promise<{ nowTimestamp: number; model: never }>(() => {
            /* intentionally pending */
          }),
      ),
    } as unknown as HistoryLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryLiveDataProvider service={service}>
          <HistoryScreen />
        </HistoryLiveDataProvider>,
      );
    });

    expect(
      tree.root.findByProps({ accessibilityLabel: 'Loading History' }),
    ).toBeTruthy();
  });

  it('shows populated History with baseline and day rows', async () => {
    const dayStart = new Date(2026, 8, 25, 0, 0, 0).getTime();
    const service = {
      loadHistory: jest.fn(async () => ({
        nowTimestamp: dayStart + 18 * 60 * 60 * 1000,
        model: {
          fromTimestamp: dayStart,
          toTimestamp: dayStart + 86_400_000,
          baseline: {
            status: 'COLLECTING' as const,
            observedCalendarDays: 4,
            targetCalendarDays: 7,
            trackedDurationMs: 100_000,
          },
          days: [
            {
              dayStartTimestamp: dayStart,
              dayEndTimestamp: dayStart + 86_400_000,
              trackedDurationMs: 5 * 60 * 60 * 1000 + 2 * 60 * 1000,
              lostDurationMs: 28 * 60 * 1000,
              productiveDurationMs: 0,
              neutralDurationMs: 0,
              leisureDurationMs: 0,
              unknownDurationMs: 0,
            },
          ],
        },
      })),
    } as unknown as HistoryLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryLiveDataProvider service={service}>
          <HistoryScreen />
        </HistoryLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const content = screenText(tree.root);
    expect(content).toContain('History');
    expect(content).toContain('Learning your routine');
    expect(content).toContain('4 of 7 observed days');
    expect(content).toContain('Today');
    expect(content).toContain('5h 2m tracked');
    expect(content).toContain('28m lost');
    expect(content).not.toMatch(/Bad day|Terrible|wasted too much/i);
  });

  it('navigates to Day Detail with dayStartTimestamp only', async () => {
    mockNavigate.mockClear();
    const dayStart = new Date(2026, 8, 25, 0, 0, 0).getTime();
    const service = {
      loadHistory: jest.fn(async () => ({
        nowTimestamp: dayStart + 18 * 60 * 60 * 1000,
        model: {
          fromTimestamp: dayStart,
          toTimestamp: dayStart + 86_400_000,
          baseline: {
            status: 'READY' as const,
            observedCalendarDays: 7,
            targetCalendarDays: 7,
            trackedDurationMs: 1,
          },
          days: [
            {
              dayStartTimestamp: dayStart,
              dayEndTimestamp: dayStart + 86_400_000,
              trackedDurationMs: 60_000,
              lostDurationMs: 0,
              productiveDurationMs: 60_000,
              neutralDurationMs: 0,
              leisureDurationMs: 0,
              unknownDurationMs: 0,
            },
          ],
        },
      })),
    } as unknown as HistoryLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryLiveDataProvider service={service}>
          <HistoryScreen />
        </HistoryLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const row = tree.root.findByProps({ accessibilityRole: 'button' });
    await act(async () => {
      row.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith(HistoryRoutes.DayDetail, {
      dayStartTimestamp: dayStart,
    });
  });

  it('shows empty state when there are no observed days', async () => {
    const service = {
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
        <HistoryLiveDataProvider service={service}>
          <HistoryScreen />
        </HistoryLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screenText(tree.root)).toContain('No usage history yet');
  });

  it('shows error and Retry when load fails', async () => {
    const service = {
      loadHistory: jest.fn(async () => {
        throw new Error('db locked');
      }),
    } as unknown as HistoryLiveService;

    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <HistoryLiveDataProvider service={service}>
          <HistoryScreen />
        </HistoryLiveDataProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screenText(tree.root)).toContain('Could not load History');
    expect(screenText(tree.root)).toContain('Retry');
  });
});
