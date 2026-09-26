import { ActivityClassification } from '../classification/ActivityClassification';
import { ClassificationSource } from '../classification/ClassificationSource';
import { Platform } from '../platform/Platform';
import { createUsageSession } from '../testSupport/createUsageSession';
import {
  getLocalCalendarDayStart,
  getNextLocalCalendarDayStart,
} from '../../shared/time/localCalendarDay';
import { clipUsageSessionToLocalCalendarDayPieces } from './clipUsageSessionToLocalCalendarDayPieces';

describe('clipUsageSessionToLocalCalendarDayPieces', () => {
  it('preserves packageName, displayName, platform, and classification through splits', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 8, 24, 12, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const original = createUsageSession({
      id: 'meta',
      app: { packageName: 'com.example.app', displayName: 'Example' },
      platform: Platform.OTHER,
      classification: ActivityClassification.WASTE,
      classificationSource: ClassificationSource.USER_RULE,
      startTime: nextDay - 30 * 60 * 1000,
      endTime: nextDay + 30 * 60 * 1000,
      durationMs: 60 * 60 * 1000,
    });
    const snapshot = JSON.stringify(original);
    const pieces = clipUsageSessionToLocalCalendarDayPieces(original);
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(pieces).toHaveLength(2);
    for (const piece of pieces) {
      expect(piece.app.packageName).toBe('com.example.app');
      expect(piece.app.displayName).toBe('Example');
      expect(piece.platform).toBe(Platform.OTHER);
      expect(piece.classification).toBe(ActivityClassification.WASTE);
      expect(piece.classificationSource).toBe(ClassificationSource.USER_RULE);
    }
  });

  it('splits at getNextLocalCalendarDayStart boundaries (not timestamp / 86_400_000)', () => {
    const dayStart = getLocalCalendarDayStart(
      new Date(2026, 2, 8, 12, 0, 0).getTime(),
    );
    const nextDay = getNextLocalCalendarDayStart(dayStart);
    const pieces = clipUsageSessionToLocalCalendarDayPieces(
      createUsageSession({
        id: 'calendar-boundary',
        startTime: dayStart + 60_000,
        endTime: nextDay + 60_000,
        durationMs: nextDay - dayStart,
      }),
    );
    expect(pieces).toHaveLength(2);
    expect(pieces[0]?.endTime).toBe(nextDay);
    expect(pieces[1]?.startTime).toBe(nextDay);
    expect(pieces[0]?.durationMs + pieces[1]?.durationMs).toBe(
      nextDay - dayStart,
    );
  });
});
