import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { GetTodayDashboard } from './GetTodayDashboard';

const MIN_MS = 60 * 1000;

describe('GetTodayDashboard app breakdown (D3.9)', () => {
  it('reconciles app row totals with dashboard totals', () => {
    const sessions = [
      createUsageSession({
        id: 'w',
        app: { packageName: 'com.snapchat.android', displayName: 'Snapchat' },
        platform: Platform.OTHER,
        durationMs: 30 * MIN_MS,
        classification: ActivityClassification.WASTE,
        classificationSource: ClassificationSource.USER_RULE,
      }),
      createUsageSession({
        id: 'u',
        app: { packageName: 'com.android.chrome', displayName: 'Chrome' },
        platform: Platform.OTHER,
        durationMs: 40 * MIN_MS,
        classification: ActivityClassification.UNKNOWN,
      }),
    ];
    const model = new GetTodayDashboard().execute('2026-01-01', sessions);
    const trackedSum = model.apps.reduce(
      (sum, row) => sum + row.trackedDurationMs,
      0,
    );
    const lostSum = model.apps.reduce((sum, row) => sum + row.lostDurationMs, 0);
    expect(trackedSum).toBe(model.totalTrackedMs);
    expect(lostSum).toBe(model.totalLostMs);
    expect(model.apps).toHaveLength(2);
  });

  it('returns empty apps for empty sessions', () => {
    const model = new GetTodayDashboard().execute('2026-01-01', []);
    expect(model.apps).toEqual([]);
  });
});
