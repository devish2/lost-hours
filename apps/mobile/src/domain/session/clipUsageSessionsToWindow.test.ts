import { ActivityClassification } from '../classification/ActivityClassification';
import { ContentType } from '../classification/ContentType';
import { TrackingSource } from '../usage/TrackingSource';
import { createUsageSession } from '../testSupport/createUsageSession';
import {
  clipUsageSessionToWindow,
  clipUsageSessionsToWindow,
} from './clipUsageSessionsToWindow';

describe('clipUsageSessionsToWindow', () => {
  const FROM = 10_000;
  const TO = 20_000;

  it('leaves a fully inside session unchanged except analytics id', () => {
    const original = createUsageSession({
      id: 'stored',
      startTime: 12_000,
      endTime: 15_000,
      durationMs: 3_000,
    });
    const clipped = clipUsageSessionToWindow(original, FROM, TO);
    expect(clipped).toMatchObject({
      startTime: 12_000,
      endTime: 15_000,
      durationMs: 3_000,
    });
    expect(clipped?.id).toBe('stored|clip:10000:20000');
  });

  it('clips crossing start boundary to window from', () => {
    const original = createUsageSession({
      id: 'cross-start',
      startTime: 9_000,
      endTime: 12_000,
      durationMs: 3_000,
    });
    const clipped = clipUsageSessionToWindow(original, FROM, TO);
    expect(clipped?.startTime).toBe(FROM);
    expect(clipped?.endTime).toBe(12_000);
    expect(clipped?.durationMs).toBe(2_000);
  });

  it('clips crossing end boundary to window to', () => {
    const original = createUsageSession({
      id: 'cross-end',
      startTime: 18_000,
      endTime: 25_000,
      durationMs: 7_000,
    });
    const clipped = clipUsageSessionToWindow(original, FROM, TO);
    expect(clipped?.endTime).toBe(TO);
    expect(clipped?.durationMs).toBe(2_000);
  });

  it('clips a session containing the entire window to the window bounds', () => {
    const original = createUsageSession({
      id: 'contains',
      startTime: 0,
      endTime: 30_000,
      durationMs: 30_000,
    });
    const clipped = clipUsageSessionToWindow(original, FROM, TO);
    expect(clipped).toMatchObject({
      startTime: FROM,
      endTime: TO,
      durationMs: TO - FROM,
    });
  });

  it('excludes non-overlapping sessions', () => {
    const original = createUsageSession({
      id: 'before',
      startTime: 0,
      endTime: FROM,
      durationMs: FROM,
    });
    expect(clipUsageSessionToWindow(original, FROM, TO)).toBeNull();
  });

  it('does not mutate the original session object', () => {
    const original = createUsageSession({
      id: 'orig',
      startTime: 9_000,
      endTime: 12_000,
      durationMs: 3_000,
      contentType: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });
    const snapshot = { ...original, app: { ...original.app } };
    clipUsageSessionsToWindow([original], FROM, TO);
    expect(original).toEqual(snapshot);
  });

  it('supports cross-midnight analytics by clipping to day window', () => {
    const midnight = 1_000_000;
    const nextMidnight = midnight + 24 * 60 * 60 * 1000;
    const original = createUsageSession({
      id: 'overnight',
      startTime: midnight - 5 * 60 * 1000,
      endTime: midnight + 10 * 60 * 1000,
      durationMs: 15 * 60 * 1000,
    });
    const clipped = clipUsageSessionToWindow(original, midnight, nextMidnight);
    expect(clipped).toMatchObject({
      startTime: midnight,
      endTime: midnight + 10 * 60 * 1000,
      durationMs: 10 * 60 * 1000,
    });
  });
});
