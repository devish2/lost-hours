import { ActivityClassification } from '../classification/ActivityClassification';
import { Platform } from '../platform/Platform';
import { createUsageSession } from '../testSupport/createUsageSession';
import { aggregateUsageByApp } from './aggregateUsageByApp';

const MIN_MS = 60 * 1000;
const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';
const CHROME = 'com.android.chrome';
const WHATSAPP = 'com.whatsapp';
const YOUTUBE = 'com.google.android.youtube';

function sumTracked(rows: ReturnType<typeof aggregateUsageByApp>): number {
  return rows.reduce((sum, row) => sum + row.trackedDurationMs, 0);
}

function sumLost(rows: ReturnType<typeof aggregateUsageByApp>): number {
  return rows.reduce((sum, row) => sum + row.lostDurationMs, 0);
}

describe('aggregateUsageByApp (D4.6)', () => {
  it('aggregates canonical 130m Day Detail dataset', () => {
    const sessions = [
      createUsageSession({
        id: 'snap',
        app: { packageName: SNAPCHAT, displayName: 'Snapchat' },
        platform: Platform.OTHER,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: 'li',
        app: { packageName: LINKEDIN, displayName: 'LinkedIn' },
        platform: Platform.LINKEDIN,
        durationMs: 20 * MIN_MS,
        classification: ActivityClassification.PRODUCTIVE,
      }),
      createUsageSession({
        id: 'wa',
        app: { packageName: WHATSAPP, displayName: 'WhatsApp' },
        platform: Platform.OTHER,
        durationMs: 15 * MIN_MS,
        classification: ActivityClassification.NEUTRAL,
      }),
      createUsageSession({
        id: 'yt',
        app: { packageName: YOUTUBE, displayName: 'YouTube' },
        platform: Platform.OTHER,
        durationMs: 25 * MIN_MS,
        classification: ActivityClassification.LEISURE,
      }),
      createUsageSession({
        id: 'chrome',
        app: { packageName: CHROME, displayName: 'Chrome' },
        platform: Platform.OTHER,
        durationMs: 40 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    ];

    const rows = aggregateUsageByApp(sessions);
    expect(rows.map(r => r.packageName)).toEqual([
      CHROME,
      SNAPCHAT,
      YOUTUBE,
      LINKEDIN,
      WHATSAPP,
    ]);

    expect(sumTracked(rows)).toBe(130 * MIN_MS);
    expect(sumLost(rows)).toBe(30 * MIN_MS);

    const chrome = rows.find(r => r.packageName === CHROME)!;
    expect(chrome.trackedDurationMs).toBe(40 * MIN_MS);
    expect(chrome.lostDurationMs).toBe(0);
    expect(chrome.classification).toBe(ActivityClassification.UNKNOWN);

    const snap = rows.find(r => r.packageName === SNAPCHAT)!;
    expect(snap.trackedDurationMs).toBe(30 * MIN_MS);
    expect(snap.lostDurationMs).toBe(30 * MIN_MS);
    expect(snap.classification).toBe(ActivityClassification.WASTE);
  });

  it('merges multiple sessions for the same packageName', () => {
    const sessions = [
      createUsageSession({
        id: '1',
        app: { packageName: SNAPCHAT },
        durationMs: 10 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: '2',
        app: { packageName: SNAPCHAT },
        durationMs: 15 * MIN_MS,
        startTime: 10 * MIN_MS,
        endTime: 25 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
      createUsageSession({
        id: '3',
        app: { packageName: SNAPCHAT },
        durationMs: 5 * MIN_MS,
        startTime: 25 * MIN_MS,
        endTime: 30 * MIN_MS,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const rows = aggregateUsageByApp(sessions);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.trackedDurationMs).toBe(30 * MIN_MS);
    expect(rows[0]!.lostDurationMs).toBe(30 * MIN_MS);
  });

  it('keeps duplicate display names as separate package rows', () => {
    const sessions = [
      createUsageSession({
        id: 'a',
        app: { packageName: 'com.example.messages.one', displayName: 'Messages' },
        durationMs: MIN_MS,
      }),
      createUsageSession({
        id: 'b',
        app: { packageName: 'com.example.messages.two', displayName: 'Messages' },
        durationMs: 2 * MIN_MS,
        startTime: MIN_MS,
        endTime: 3 * MIN_MS,
      }),
    ];
    const rows = aggregateUsageByApp(sessions);
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.packageName).sort()).toEqual([
      'com.example.messages.one',
      'com.example.messages.two',
    ]);
  });

  it('does not mutate source sessions', () => {
    const session = createUsageSession({
      id: 's',
      app: { packageName: CHROME },
      durationMs: MIN_MS,
    });
    const copy = { ...session, app: { ...session.app } };
    aggregateUsageByApp([session]);
    expect(session).toEqual(copy);
  });
});
