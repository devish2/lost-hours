import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { Platform } from '../../domain/platform/Platform';
import { clipUsageSessionsToWindow } from '../../domain/session/clipUsageSessionsToWindow';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { GetTodayDashboard } from './GetTodayDashboard';

const query = new GetTodayDashboard();
const MIN_MS = 60 * 1000;
const THIRTY_MIN_MS = 30 * MIN_MS;

describe('GetTodayDashboard Lost Time V1 (D3.8)', () => {
  describe('classification matrix aligns buckets with Lost Time', () => {
    it.each([
      [ActivityClassification.PRODUCTIVE, 'productiveMs', 0],
      [ActivityClassification.NEUTRAL, 'neutralMs', 0],
      [ActivityClassification.LEISURE, 'leisureMs', 0],
      [ActivityClassification.WASTE, 'wasteMs', THIRTY_MIN_MS],
      [ActivityClassification.UNKNOWN, 'unknownMs', 0],
    ])('%s bucket and Lost Time', (classification, bucketKey, expectedLost) => {
      const model = query.execute('2024-06-15', [
        createUsageSession({
          id: 's1',
          durationMs: THIRTY_MIN_MS,
          classification,
        }),
      ]);
      expect(model[bucketKey as keyof typeof model]).toBe(THIRTY_MIN_MS);
      expect(model.totalTrackedMs).toBe(THIRTY_MIN_MS);
      expect(model.totalLostMs).toBe(expectedLost);
    });
  });

  it('maintains totalLostMs <= totalTrackedMs for mixed effective sessions', () => {
    const model = query.execute('2024-06-15', [
      createUsageSession({
        id: 'w1',
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'w2',
        durationMs: 15 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'p1',
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'u1',
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(model.totalLostMs).toBeLessThanOrEqual(model.totalTrackedMs);
    expect(model.totalLostMs).toBe(25 * MIN_MS);
    expect(model.totalTrackedMs).toBe(75 * MIN_MS);
  });

  it('uses clipped duration for Lost Time (calculator does not re-clip)', () => {
    const dayStart = new Date(2024, 5, 15, 0, 0, 0).getTime();
    const windowEnd = dayStart + 11 * 60 * 60 * 1000;
    const raw = createUsageSession({
      id: 'cross-midnight',
      app: { packageName: 'com.snapchat.android' },
      platform: Platform.OTHER,
      startTime: dayStart - 10 * MIN_MS,
      endTime: dayStart + 20 * MIN_MS,
      durationMs: THIRTY_MIN_MS,
      classification: ActivityClassification.WASTE,
    });
    const clipped = clipUsageSessionsToWindow([raw], dayStart, windowEnd);
    const model = query.execute('2024-06-15', clipped);
    expect(model.totalLostMs).toBe(20 * MIN_MS);
    expect(model.wasteMs).toBe(20 * MIN_MS);
  });

  it('clips future overlap on the right edge of the analytics window', () => {
    const from = new Date(2024, 5, 15, 10, 0, 0).getTime();
    const to = from + 60 * MIN_MS;
    const raw = createUsageSession({
      id: 'future-tail',
      startTime: from + 50 * MIN_MS,
      endTime: from + 80 * MIN_MS,
      durationMs: THIRTY_MIN_MS,
      classification: ActivityClassification.WASTE,
    });
    const clipped = clipUsageSessionsToWindow([raw], from, to);
    const model = query.execute('2024-06-15', clipped);
    expect(model.totalLostMs).toBe(10 * MIN_MS);
  });

  it('uses half-open [from, to) overlap semantics via clipping', () => {
    const from = 1_000;
    const to = 2_000;
    const endingAtFrom = createUsageSession({
      id: 'ends-at-from',
      startTime: 500,
      endTime: from,
      durationMs: 500,
      classification: ActivityClassification.WASTE,
    });
    const startingAtTo = createUsageSession({
      id: 'starts-at-to',
      startTime: to,
      endTime: to + 500,
      durationMs: 500,
      classification: ActivityClassification.WASTE,
    });
    const exactWindow = createUsageSession({
      id: 'exact',
      startTime: from,
      endTime: to,
      durationMs: to - from,
      classification: ActivityClassification.WASTE,
    });
    const clipped = clipUsageSessionsToWindow(
      [endingAtFrom, startingAtTo, exactWindow],
      from,
      to,
    );
    const model = query.execute('2024-06-15', clipped);
    expect(model.totalLostMs).toBe(to - from);
    expect(clipped).toHaveLength(1);
  });
});
