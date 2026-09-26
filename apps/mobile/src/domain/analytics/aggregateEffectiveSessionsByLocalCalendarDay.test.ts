import { ActivityClassification } from '../classification/ActivityClassification';
import { Platform } from '../platform/Platform';
import { createUsageSession } from '../testSupport/createUsageSession';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { aggregateEffectiveSessionsByLocalCalendarDay } from './aggregateEffectiveSessionsByLocalCalendarDay';

const MIN_MS = 60 * 1000;
const CHROME = 'com.android.chrome';

function assertDayReconciliation(item: {
  trackedDurationMs: number;
  productiveDurationMs: number;
  neutralDurationMs: number;
  leisureDurationMs: number;
  lostDurationMs: number;
  unknownDurationMs: number;
}) {
  expect(
    item.productiveDurationMs +
      item.neutralDurationMs +
      item.leisureDurationMs +
      item.lostDurationMs +
      item.unknownDurationMs,
  ).toBe(item.trackedDurationMs);
}

describe('aggregateEffectiveSessionsByLocalCalendarDay (D4.3)', () => {
  it('returns empty array when there are no sessions', () => {
    expect(aggregateEffectiveSessionsByLocalCalendarDay([])).toEqual([]);
  });

  it('aggregates one session on one local day', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 22, 10, 0, 0).getTime(),
    );
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'one',
        startTime: dayStart + 3_600_000,
        endTime: dayStart + 7_200_000,
        durationMs: 3_600_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.dayStartTimestamp).toBe(dayStart);
    expect(items[0]?.trackedDurationMs).toBe(3_600_000);
  });

  it('combines multiple sessions on the same local day', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 23, 8, 0, 0).getTime(),
    );
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'a',
        startTime: dayStart + 1_000,
        endTime: dayStart + 2_000,
        durationMs: 1_000,
      }),
      createUsageSession({
        id: 'b',
        startTime: dayStart + 10_000,
        endTime: dayStart + 20_000,
        durationMs: 10_000,
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.trackedDurationMs).toBe(11_000);
  });

  it('returns two items for usage on two independent days', () => {
    let dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 20, 0, 0, 0).getTime(),
    );
    const dayTwo = getNextLocalCalendarDayStart(dayStart);
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'd1',
        startTime: dayStart + 1_000,
        endTime: dayStart + 2_000,
        durationMs: 1_000,
      }),
      createUsageSession({
        id: 'd2',
        startTime: dayTwo + 1_000,
        endTime: dayTwo + 2_000,
        durationMs: 1_000,
      }),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]?.dayStartTimestamp).toBeLessThan(items[1]!.dayStartTimestamp);
  });

  it('splits WASTE session across midnight into two 30-minute days', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 24, 12, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'midnight-waste',
        classification: ActivityClassification.WASTE,
        startTime: nextDay - 30 * MIN_MS,
        endTime: nextDay + 30 * MIN_MS,
        durationMs: 60 * MIN_MS,
      }),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]?.lostDurationMs).toBe(30 * MIN_MS);
    expect(items[1]?.lostDurationMs).toBe(30 * MIN_MS);
    assertDayReconciliation(items[0]!);
    assertDayReconciliation(items[1]!);
  });

  it('splits a long session across multiple local midnights', () => {
    let dayOne = getLocalCalendarDayStart(
      new Date(2026, 8, 10, 0, 0, 0).getTime(),
    );
    const dayTwo = getNextLocalCalendarDayStart(dayOne);
    const dayThree = getNextLocalCalendarDayStart(dayTwo);
    const sessionStart = dayOne + 23 * 60 * MIN_MS;
    const sessionEnd = dayThree + 60 * MIN_MS;
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'long',
        classification: ActivityClassification.NEUTRAL,
        startTime: sessionStart,
        endTime: sessionEnd,
        durationMs: sessionEnd - sessionStart,
      }),
    ]);
    expect(items).toHaveLength(3);
    const totalTracked = items.reduce((sum, d) => sum + d.trackedDurationMs, 0);
    expect(totalTracked).toBe(sessionEnd - sessionStart);
  });

  it('assigns session ending exactly at local midnight to the prior day only', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 18, 0, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'ends-midnight',
        startTime: nextDay - 5 * MIN_MS,
        endTime: nextDay,
        durationMs: 5 * MIN_MS,
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.dayStartTimestamp).toBe(dayStart);
    expect(items[0]?.trackedDurationMs).toBe(5 * MIN_MS);
  });

  it('includes session starting exactly at local midnight on that day', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 19, 0, 0, 0).getTime(),
    );
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'starts-midnight',
        startTime: dayStart,
        endTime: dayStart + 10 * MIN_MS,
        durationMs: 10 * MIN_MS,
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.dayStartTimestamp).toBe(dayStart);
  });

  it('ignores invalid non-positive-duration sessions', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 21, 0, 0, 0).getTime(),
    );
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'zero',
        startTime: dayStart,
        endTime: dayStart,
        durationMs: 0,
      }),
    ]);
    expect(items).toEqual([]);
  });

  it('reconciles all five classifications on one day (130m canonical)', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 25, 9, 0, 0).getTime(),
    );
    const base = dayStart + 60_000;
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'p',
        startTime: base,
        endTime: base + 20 * MIN_MS,
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'n',
        startTime: base,
        endTime: base + 15 * MIN_MS,
        durationMs: 15 * MIN_MS,
        classification: ActivityClassification.NEUTRAL,
      }),
      createUsageSession({
        id: 'l',
        startTime: base,
        endTime: base + 25 * MIN_MS,
        durationMs: 25 * MIN_MS,
        classification: ActivityClassification.LEISURE,
      }),
      createUsageSession({
        id: 'w',
        startTime: base,
        endTime: base + 30 * MIN_MS,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'u',
        app: { packageName: CHROME, displayName: 'Chrome' },
        platform: Platform.OTHER,
        startTime: base,
        endTime: base + 40 * MIN_MS,
        durationMs: 40 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(items).toHaveLength(1);
    const day = items[0]!;
    expect(day.trackedDurationMs).toBe(130 * MIN_MS);
    expect(day.lostDurationMs).toBe(30 * MIN_MS);
    expect(day.productiveDurationMs).toBe(20 * MIN_MS);
    expect(day.neutralDurationMs).toBe(15 * MIN_MS);
    expect(day.leisureDurationMs).toBe(25 * MIN_MS);
    expect(day.unknownDurationMs).toBe(40 * MIN_MS);
    assertDayReconciliation(day);
  });

  it('is independent of input session order', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 12, 0, 0, 0).getTime(),
    );
    const dayTwo = getNextLocalCalendarDayStart(dayStart);
    const a = createUsageSession({
      id: 'a',
      startTime: dayStart + 1_000,
      endTime: dayStart + 2_000,
      durationMs: 1_000,
    });
    const b = createUsageSession({
      id: 'b',
      startTime: dayTwo + 1_000,
      endTime: dayTwo + 2_000,
      durationMs: 1_000,
    });
    expect(
      aggregateEffectiveSessionsByLocalCalendarDay([a, b]),
    ).toEqual(aggregateEffectiveSessionsByLocalCalendarDay([b, a]));
  });

  it('does not fabricate zero-evidence calendar days', () => {
    let dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 1, 0, 0, 0).getTime(),
    );
    const dayThree = getNextLocalCalendarDayStart(
      getNextLocalCalendarDayStart(dayStart),
    );
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'only-day-three',
        startTime: dayThree + 1_000,
        endTime: dayThree + 2_000,
        durationMs: 1_000,
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.dayStartTimestamp).toBe(dayThree);
  });

  it('keeps OTHER platform separate from UNKNOWN classification', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 14, 0, 0, 0).getTime(),
    );
    const items = aggregateEffectiveSessionsByLocalCalendarDay([
      createUsageSession({
        id: 'other-unknown',
        platform: Platform.OTHER,
        classification: ActivityClassification.UNKNOWN,
        startTime: dayStart + 1_000,
        endTime: dayStart + MIN_MS + 1_000,
        durationMs: MIN_MS,
      }),
    ]);
    expect(items[0]?.unknownDurationMs).toBe(MIN_MS);
  });
});
