import { ActivityClassification } from '../classification/ActivityClassification';
import { createUsageSession } from '../testSupport/createUsageSession';
import { DefaultDailyUsageAggregator } from './DefaultDailyUsageAggregator';

const aggregator = new DefaultDailyUsageAggregator();
const DATE = '2026-09-23';

describe('DefaultDailyUsageAggregator', () => {
  it('returns all zero values for empty input', () => {
    expect(aggregator.aggregate(DATE, [])).toEqual({
      date: DATE,
      totalTrackedMs: 0,
      productiveMs: 0,
      neutralMs: 0,
      leisureMs: 0,
      wasteMs: 0,
      unknownMs: 0,
      sessionCount: 0,
      longestSessionMs: 0,
    });
  });

  it('preserves the provided date', () => {
    const summary = aggregator.aggregate('2026-01-02', []);
    expect(summary.date).toBe('2026-01-02');
  });

  it('adds PRODUCTIVE duration to productiveMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'p',
        durationMs: 3_000,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ]);
    expect(summary.productiveMs).toBe(3_000);
  });

  it('adds NEUTRAL duration to neutralMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'n',
        durationMs: 4_000,
        classification: ActivityClassification.NEUTRAL,
      }),
    ]);
    expect(summary.neutralMs).toBe(4_000);
  });

  it('adds LEISURE duration to leisureMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'l',
        durationMs: 5_000,
        classification: ActivityClassification.LEISURE,
      }),
    ]);
    expect(summary.leisureMs).toBe(5_000);
  });

  it('adds WASTE duration to wasteMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'w',
        durationMs: 6_000,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(summary.wasteMs).toBe(6_000);
  });

  it('adds UNKNOWN classification duration to unknownMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'u',
        durationMs: 7_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(summary.unknownMs).toBe(7_000);
  });

  it('sums all valid classifications into totalTrackedMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'p',
        durationMs: 1_000,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'w',
        durationMs: 2_000,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'u',
        durationMs: 3_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(summary.totalTrackedMs).toBe(6_000);
  });

  it('sessionCount includes all valid sessions', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'p',
        durationMs: 100,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'w',
        durationMs: 200,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(summary.sessionCount).toBe(2);
  });

  it('computes longestSessionMs among valid sessions', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'short',
        durationMs: 100,
        classification: ActivityClassification.NEUTRAL,
      }),
      createUsageSession({
        id: 'long',
        durationMs: 9_999,
        classification: ActivityClassification.LEISURE,
      }),
    ]);
    expect(summary.longestSessionMs).toBe(9_999);
  });

  it('ignores zero-duration sessions', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'zero',
        durationMs: 0,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(summary.totalTrackedMs).toBe(0);
    expect(summary.sessionCount).toBe(0);
  });

  it('ignores negative-duration sessions', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'neg',
        durationMs: -50,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ]);
    expect(summary.totalTrackedMs).toBe(0);
    expect(summary.sessionCount).toBe(0);
  });

  it('aggregates mixed sessions correctly', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'p',
        durationMs: 100,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'n',
        durationMs: 200,
        classification: ActivityClassification.NEUTRAL,
      }),
      createUsageSession({
        id: 'l',
        durationMs: 300,
        classification: ActivityClassification.LEISURE,
      }),
      createUsageSession({
        id: 'w',
        durationMs: 400,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'u',
        durationMs: 500,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(summary).toMatchObject({
      productiveMs: 100,
      neutralMs: 200,
      leisureMs: 300,
      wasteMs: 400,
      unknownMs: 500,
      totalTrackedMs: 1_500,
      sessionCount: 5,
      longestSessionMs: 500,
    });
  });

  it('keeps classification buckets summing to totalTrackedMs', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: '1',
        durationMs: 111,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: '2',
        durationMs: 222,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    const bucketSum =
      summary.productiveMs +
      summary.neutralMs +
      summary.leisureMs +
      summary.wasteMs +
      summary.unknownMs;
    expect(bucketSum).toBe(summary.totalTrackedMs);
  });

  it('counts UNKNOWN toward tracked time and session count', () => {
    const summary = aggregator.aggregate(DATE, [
      createUsageSession({
        id: 'unknown',
        durationMs: 2_500,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(summary.totalTrackedMs).toBe(2_500);
    expect(summary.unknownMs).toBe(2_500);
    expect(summary.sessionCount).toBe(1);
    expect(summary.wasteMs).toBe(0);
  });

  it('does not mutate input sessions', () => {
    const sessions = [
      createUsageSession({
        id: 's1',
        durationMs: 100,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const snapshot = JSON.stringify(sessions);
    aggregator.aggregate(DATE, sessions);
    expect(JSON.stringify(sessions)).toBe(snapshot);
  });
});
