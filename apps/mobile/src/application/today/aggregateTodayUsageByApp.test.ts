import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { aggregateTodayUsageByApp } from './aggregateTodayUsageByApp';

const MIN_MS = 60 * 1000;
const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';
const CHROME = 'com.android.chrome';
const WHATSAPP = 'com.whatsapp';

function sumTracked(
  rows: ReturnType<typeof aggregateTodayUsageByApp>,
): number {
  return rows.reduce((sum, row) => sum + row.trackedDurationMs, 0);
}

function sumLost(rows: ReturnType<typeof aggregateTodayUsageByApp>): number {
  return rows.reduce((sum, row) => sum + row.lostDurationMs, 0);
}

describe('aggregateTodayUsageByApp', () => {
  it('aggregates canonical Today scenario sorted by tracked duration', () => {
    const sessions = [
      createUsageSession({
        id: 'snap-1',
        app: { packageName: SNAPCHAT, displayName: 'Snapchat' },
        platform: Platform.OTHER,
        durationMs: 10 * MIN_MS,
        startTime: 0,
        endTime: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
        classificationSource: ClassificationSource.USER_RULE,
      }),
      createUsageSession({
        id: 'snap-2',
        app: { packageName: SNAPCHAT, displayName: 'Snapchat' },
        platform: Platform.OTHER,
        durationMs: 20 * MIN_MS,
        startTime: 10 * MIN_MS,
        endTime: 30 * MIN_MS,
        classification: ActivityClassification.WASTE,
        classificationSource: ClassificationSource.USER_RULE,
      }),
      createUsageSession({
        id: 'li',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        platform: Platform.LINKEDIN,
        durationMs: 20 * MIN_MS,
        startTime: 30 * MIN_MS,
        endTime: 50 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
        classificationSource: ClassificationSource.USER_RULE,
      }),
      createUsageSession({
        id: 'chrome',
        app: { packageName: CHROME, displayName: 'Chrome' },
        platform: Platform.OTHER,
        durationMs: 40 * MIN_MS,
        startTime: 50 * MIN_MS,
        endTime: 90 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
        classificationSource: ClassificationSource.UNKNOWN,
      }),
      createUsageSession({
        id: 'wa',
        app: { packageName: WHATSAPP, displayName: 'WhatsApp' },
        platform: Platform.OTHER,
        durationMs: 15 * MIN_MS,
        startTime: 90 * MIN_MS,
        endTime: 105 * MIN_MS,
        classification: ActivityClassification.NEUTRAL,
        classificationSource: ClassificationSource.USER_RULE,
      }),
    ];

    const rows = aggregateTodayUsageByApp(sessions);
    expect(rows.map(r => r.packageName)).toEqual([
      CHROME,
      SNAPCHAT,
      LINKEDIN,
      WHATSAPP,
    ]);

    const chrome = rows.find(r => r.packageName === CHROME)!;
    expect(chrome.trackedDurationMs).toBe(40 * MIN_MS);
    expect(chrome.lostDurationMs).toBe(0);
    expect(chrome.classification).toBe(ActivityClassification.UNKNOWN);

    const snap = rows.find(r => r.packageName === SNAPCHAT)!;
    expect(snap.trackedDurationMs).toBe(30 * MIN_MS);
    expect(snap.lostDurationMs).toBe(30 * MIN_MS);
    expect(snap.classification).toBe(ActivityClassification.WASTE);

    expect(sumTracked(rows)).toBe(105 * MIN_MS);
    expect(sumLost(rows)).toBe(30 * MIN_MS);
  });

  it('groups by packageName regardless of displayName drift', () => {
    const sessions = [
      createUsageSession({
        id: 'a',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn Beta' },
        durationMs: MIN_MS,
        startTime: 0,
        endTime: MIN_MS,
      }),
      createUsageSession({
        id: 'b',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        durationMs: MIN_MS,
        startTime: MIN_MS,
        endTime: 2 * MIN_MS,
      }),
    ];
    const rows = aggregateTodayUsageByApp(sessions);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.trackedDurationMs).toBe(2 * MIN_MS);
  });

  it('uses most recent non-empty displayName', () => {
    const sessions = [
      createUsageSession({
        id: 'old',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        durationMs: MIN_MS,
        startTime: 0,
        endTime: MIN_MS,
      }),
      createUsageSession({
        id: 'new',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn New' },
        durationMs: MIN_MS,
        startTime: MIN_MS,
        endTime: 2 * MIN_MS,
      }),
    ];
    expect(aggregateTodayUsageByApp(sessions)[0]!.displayName).toBe(
      'LinkedIn New',
    );
  });

  it('skips empty newest displayName and uses latest available label', () => {
    const sessions = [
      createUsageSession({
        id: 'old',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        durationMs: MIN_MS,
        startTime: 0,
        endTime: MIN_MS,
      }),
      createUsageSession({
        id: 'new',
        app: { packageName: LINKEDIN },
        durationMs: MIN_MS,
        startTime: MIN_MS,
        endTime: 2 * MIN_MS,
      }),
    ];
    expect(aggregateTodayUsageByApp(sessions)[0]!.displayName).toBe('LinkedIn');
  });

  it('leaves displayName undefined when none exist; UI may fall back to packageName', () => {
    const sessions = [
      createUsageSession({
        id: 'x',
        app: { packageName: CHROME },
        durationMs: MIN_MS,
      }),
    ];
    expect(aggregateTodayUsageByApp(sessions)[0]!.displayName).toBeUndefined();
  });

  it('uses platform from most recent session when historical platforms differ', () => {
    const sessions = [
      createUsageSession({
        id: 'old',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        durationMs: MIN_MS,
        startTime: 0,
        endTime: MIN_MS,
      }),
      createUsageSession({
        id: 'new',
        app: { packageName: SNAPCHAT },
        platform: Platform.OTHER,
        durationMs: MIN_MS,
        startTime: MIN_MS,
        endTime: 2 * MIN_MS,
      }),
    ];
    expect(aggregateTodayUsageByApp(sessions)[0]!.platform).toBe(Platform.OTHER);
  });

  it('represents mixed effective classification without a single row classification', () => {
    const packageName = 'com.example.mixed';
    const sessions = [
      createUsageSession({
        id: 'w',
        app: { packageName },
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
        classificationSource: ClassificationSource.USER_RULE,
      }),
      createUsageSession({
        id: 'p',
        app: { packageName },
        durationMs: 20 * MIN_MS,
        startTime: 10 * MIN_MS,
        endTime: 30 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
        classificationSource: ClassificationSource.USER_OVERRIDE,
      }),
    ];
    const row = aggregateTodayUsageByApp(sessions)[0]!;
    expect(row.trackedDurationMs).toBe(30 * MIN_MS);
    expect(row.lostDurationMs).toBe(10 * MIN_MS);
    expect(row.hasMixedClassification).toBe(true);
    expect(row.classification).toBeUndefined();
    expect(row.hasMixedClassificationSource).toBe(true);
    expect(row.classificationSource).toBeUndefined();
  });

  it('ignores zero-duration sessions', () => {
    const sessions = [
      createUsageSession({
        id: 'zero',
        app: { packageName: CHROME },
        durationMs: 0,
      }),
      createUsageSession({
        id: 'ok',
        app: { packageName: CHROME },
        durationMs: MIN_MS,
      }),
    ];
    expect(aggregateTodayUsageByApp(sessions)[0]!.trackedDurationMs).toBe(
      MIN_MS,
    );
  });
});
