import { ActivityClassification } from '../classification/ActivityClassification';
import { ContentType } from '../classification/ContentType';
import { Platform } from '../platform/Platform';
import { createUsageSession } from '../testSupport/createUsageSession';
import { DefaultLostTimeCalculator } from './DefaultLostTimeCalculator';

const calculator = new DefaultLostTimeCalculator();

describe('DefaultLostTimeCalculator', () => {
  it('returns zero summary for empty sessions', () => {
    expect(calculator.calculate([])).toEqual({
      totalLostMs: 0,
      sessionCount: 0,
      byPlatform: {},
      byContentType: {},
    });
  });

  it('counts one WASTE session toward Lost Time', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'w1',
        durationMs: 10_000,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(10_000);
    expect(result.sessionCount).toBe(1);
  });

  it('excludes PRODUCTIVE sessions from Lost Time', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'p1',
        durationMs: 30_000,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
    expect(result.sessionCount).toBe(0);
  });

  it('excludes NEUTRAL sessions from Lost Time', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'n1',
        durationMs: 5_000,
        classification: ActivityClassification.NEUTRAL,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
  });

  it('excludes LEISURE sessions from Lost Time', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'l1',
        durationMs: 120_000,
        classification: ActivityClassification.LEISURE,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
  });

  it('excludes UNKNOWN classification from Lost Time', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'u1',
        durationMs: 15_000,
        classification: ActivityClassification.UNKNOWN,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
    expect(result.sessionCount).toBe(0);
  });

  it('aggregates multiple WASTE sessions', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'w1',
        durationMs: 10_000,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'w2',
        durationMs: 5_000,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(15_000);
    expect(result.sessionCount).toBe(2);
  });

  it('includes only WASTE in mixed classifications', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'w',
        durationMs: 8_000,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'p',
        durationMs: 30_000,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'l',
        durationMs: 20_000,
        classification: ActivityClassification.LEISURE,
      }),
    ]);
    expect(result.totalLostMs).toBe(8_000);
    expect(result.sessionCount).toBe(1);
  });

  it('builds platform breakdown from WASTE sessions only', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'ig1',
        durationMs: 600_000,
        platform: Platform.INSTAGRAM,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'ig2',
        durationMs: 300_000,
        platform: Platform.INSTAGRAM,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'yt-productive',
        durationMs: 1_800_000,
        platform: Platform.YOUTUBE,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'yt-waste',
        durationMs: 480_000,
        platform: Platform.YOUTUBE,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.byPlatform).toEqual({
      [Platform.INSTAGRAM]: 900_000,
      [Platform.YOUTUBE]: 480_000,
    });
    expect(result.totalLostMs).toBe(1_380_000);
  });

  it('builds content-type breakdown from WASTE sessions only', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'reels',
        durationMs: 1_200_000,
        contentType: ContentType.REELS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'shorts',
        durationMs: 600_000,
        contentType: ContentType.SHORTS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'tutorial',
        durationMs: 1_800_000,
        contentType: ContentType.TUTORIAL,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ]);
    expect(result.byContentType).toEqual({
      [ContentType.REELS]: 1_200_000,
      [ContentType.SHORTS]: 600_000,
    });
  });

  it('accumulates multiple WASTE sessions for the same platform', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'a',
        durationMs: 100,
        platform: Platform.REDDIT,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'b',
        durationMs: 250,
        platform: Platform.REDDIT,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.byPlatform[Platform.REDDIT]).toBe(350);
  });

  it('accumulates multiple WASTE sessions for the same content type', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'a',
        durationMs: 400,
        contentType: ContentType.FEED,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'b',
        durationMs: 600,
        contentType: ContentType.FEED,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.byContentType[ContentType.FEED]).toBe(1_000);
  });

  it('counts WASTE with UNKNOWN content type under ContentType.UNKNOWN', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'unknown-content',
        durationMs: 7_000,
        contentType: ContentType.UNKNOWN,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.byContentType[ContentType.UNKNOWN]).toBe(7_000);
    expect(result.totalLostMs).toBe(7_000);
  });

  it('ignores zero-duration WASTE sessions', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'zero',
        durationMs: 0,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
    expect(result.sessionCount).toBe(0);
  });

  it('ignores negative-duration WASTE sessions', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'negative',
        durationMs: -100,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(result.totalLostMs).toBe(0);
    expect(result.sessionCount).toBe(0);
  });

  it('sessionCount counts only valid WASTE sessions', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'w-valid',
        durationMs: 1_000,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'w-zero',
        durationMs: 0,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'productive',
        durationMs: 2_000,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ]);
    expect(result.sessionCount).toBe(1);
  });

  it('does not mutate input sessions', () => {
    const sessions = [
      createUsageSession({
        id: 'w1',
        durationMs: 500,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const snapshot = JSON.stringify(sessions);
    calculator.calculate(sessions);
    expect(JSON.stringify(sessions)).toBe(snapshot);
  });

  it('does not include zero-value breakdown keys', () => {
    const result = calculator.calculate([
      createUsageSession({
        id: 'only-ig',
        durationMs: 100,
        platform: Platform.INSTAGRAM,
        contentType: ContentType.REELS,
        classification: ActivityClassification.WASTE,
      }),
    ]);
    expect(Object.keys(result.byPlatform)).toEqual([Platform.INSTAGRAM]);
    expect(Object.keys(result.byContentType)).toEqual([ContentType.REELS]);
    expect(result.byPlatform[Platform.YOUTUBE]).toBeUndefined();
  });
});
