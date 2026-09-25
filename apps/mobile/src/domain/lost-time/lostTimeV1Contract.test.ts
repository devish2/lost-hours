import { ActivityClassification } from '../classification/ActivityClassification';
import { ClassificationSource } from '../classification/ClassificationSource';
import { Platform } from '../platform/Platform';
import { createUsageSession } from '../testSupport/createUsageSession';
import { DefaultLostTimeCalculator } from './DefaultLostTimeCalculator';

const calculator = new DefaultLostTimeCalculator();
const THIRTY_MIN_MS = 30 * 60 * 1000;
const MIN_MS = 60 * 1000;

describe('Lost Time V1 contract (D3.8)', () => {
  describe('classification matrix', () => {
    it.each([
      [ActivityClassification.PRODUCTIVE, 0],
      [ActivityClassification.NEUTRAL, 0],
      [ActivityClassification.LEISURE, 0],
      [ActivityClassification.WASTE, THIRTY_MIN_MS],
      [ActivityClassification.UNKNOWN, 0],
    ])('%s → Lost Time %i ms for 30m session', (classification, expectedLost) => {
      const result = calculator.calculate([
        createUsageSession({
          id: 'single',
          durationMs: THIRTY_MIN_MS,
          classification,
        }),
      ]);
      expect(result.totalLostMs).toBe(expectedLost);
    });
  });

  describe('classificationSource independence for WASTE', () => {
    it.each([
      ClassificationSource.USER_RULE,
      ClassificationSource.USER_OVERRIDE,
      ClassificationSource.SYSTEM_DEFAULT,
      ClassificationSource.INFERRED,
    ])('WASTE with source %s contributes full duration', source => {
      const result = calculator.calculate([
        createUsageSession({
          id: 'waste',
          durationMs: 5_000,
          classification: ActivityClassification.WASTE,
          classificationSource: source,
        }),
      ]);
      expect(result.totalLostMs).toBe(5_000);
    });

    it('USER_RULE PRODUCTIVE contributes zero Lost Time', () => {
      expect(
        calculator.calculate([
          createUsageSession({
            id: 'productive',
            durationMs: 5_000,
            classification: ActivityClassification.PRODUCTIVE,
            classificationSource: ClassificationSource.USER_RULE,
          }),
        ]).totalLostMs,
      ).toBe(0);
    });
  });

  it('sums multiple sessions with mixed classifications', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'a',
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'b',
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'c',
        durationMs: 15 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'd',
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
      createUsageSession({
        id: 'e',
        durationMs: 5 * MIN_MS,
        classification: ActivityClassification.LEISURE,
      }),
    ]);
    expect(result.totalLostMs).toBe(25 * MIN_MS);
    expect(result.sessionCount).toBe(2);
  });

  it('sums same-package WASTE sessions without collapsing', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 's1',
        app: { packageName: 'com.snapchat.android' },
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 's2',
        app: { packageName: 'com.snapchat.android' },
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 's3',
        app: { packageName: 'com.snapchat.android' },
        durationMs: 15 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(45 * MIN_MS);
    expect(result.sessionCount).toBe(3);
  });

  it('sums overlapping WASTE sessions (no wall-clock deduplication)', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'a',
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'b',
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(40 * MIN_MS);
  });

  it('counts OTHER platform WASTE toward Lost Time and lostByPlatform', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'snap',
        app: { packageName: 'com.snapchat.android' },
        platform: Platform.OTHER,
        durationMs: THIRTY_MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(THIRTY_MIN_MS);
    expect(result.byPlatform[Platform.OTHER]).toBe(THIRTY_MIN_MS);
  });

  it('never counts large UNKNOWN toward Lost Time', () => {
    const eightHours = 8 * 60 * 60 * 1000;
    const result = calculator.calculate([
      createUsageSession({
        id: 'chrome',
        platform: Platform.OTHER,
        durationMs: eightHours,
        classification: ActivityClassification.UNKNOWN,
      }),
      createUsageSession({
        id: 'snap',
        platform: Platform.OTHER,
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(20 * MIN_MS);
    expect(result.sessionCount).toBe(1);
  });

  it('returns zero Lost Time when no WASTE sessions exist', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'p',
        durationMs: MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'n',
        durationMs: MIN_MS,
        classification: ActivityClassification.NEUTRAL,
      }),
      createUsageSession({
        id: 'l',
        durationMs: MIN_MS,
        classification: ActivityClassification.LEISURE,
      }),
      createUsageSession({
        id: 'u',
        durationMs: MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
  });

  it('uses exact millisecond duration without rounding', () => {
    const durationMs = 90_123;
    expect(
      calculator.calculate([
        createUsageSession({
          id: 'precise',
          durationMs,
          classification: ActivityClassification.WASTE,
        }),
      ]).totalLostMs,
    ).toBe(durationMs);
  });

  it('handles large daily WASTE totals in milliseconds', () => {
    const twelveHours = 12 * 60 * 60 * 1000;
    expect(
      calculator.calculate([
        createUsageSession({
          id: 'long',
          durationMs: twelveHours,
          classification: ActivityClassification.WASTE,
        }),
      ]).totalLostMs,
    ).toBe(twelveHours);
  });

  it('builds lostByPlatform from effective WASTE only', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'ig-waste',
        platform: Platform.INSTAGRAM,
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'ig-productive',
        platform: Platform.INSTAGRAM,
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'yt-waste',
        platform: Platform.YOUTUBE,
        durationMs: 15 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'other-unknown',
        platform: Platform.OTHER,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(result.totalLostMs).toBe(35 * MIN_MS);
    expect(result.byPlatform).toEqual({
      [Platform.INSTAGRAM]: 20 * MIN_MS,
      [Platform.YOUTUBE]: 15 * MIN_MS,
    });
  });

  it('ignores invalid durations for WASTE', () => {
    expect(
      calculator.calculate([
        createUsageSession({
          id: 'zero',
          durationMs: 0,
          classification: ActivityClassification.WASTE,
        }),
        createUsageSession({
          id: 'negative',
          durationMs: -1,
          classification: ActivityClassification.WASTE,
        }),
        createUsageSession({
          id: 'invalid-range',
          startTime: 100,
          endTime: 100,
          durationMs: 0,
          classification: ActivityClassification.WASTE,
        }),
      ]).totalLostMs,
    ).toBe(0);
  });
});
