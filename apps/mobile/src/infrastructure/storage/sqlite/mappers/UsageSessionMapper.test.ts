import { ActivityClassification } from '../../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../../domain/classification/ClassificationSource';
import { ContentType } from '../../../../domain/classification/ContentType';
import { Platform } from '../../../../domain/platform/Platform';
import { TrackingSource } from '../../../../domain/usage/TrackingSource';
import { createUsageSession } from '../../../../domain/testSupport/createUsageSession';
import {
  usageSessionRowToDomain,
  usageSessionToInsertParams,
} from './UsageSessionMapper';
import type { UsageSessionRow } from './rows';

describe('UsageSessionMapper', () => {
  const createdAt = 1_700_000_000_000;

  it('maps domain to insert params and back', () => {
    const session = createUsageSession({
      id: 'session-1',
      durationMs: 120_000,
      platform: Platform.YOUTUBE,
      contentType: ContentType.SHORTS,
      classification: ActivityClassification.WASTE,
      classificationSource: ClassificationSource.USER_RULE,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
      classificationConfidence: 0.85,
      app: { packageName: 'com.google.android.youtube', displayName: 'YouTube' },
      startTime: 1000,
      endTime: 121_000,
    });

    const params = usageSessionToInsertParams(session, createdAt);
    const row: UsageSessionRow = {
      id: params[0] as string,
      package_name: params[1] as string,
      app_display_name: params[2] as string,
      platform: params[3] as string,
      start_time: params[4] as number,
      end_time: params[5] as number,
      duration_ms: params[6] as number,
      content_type: params[7] as string,
      classification: params[8] as string,
      classification_source: params[9] as string,
      classification_confidence: params[10] as number,
      tracking_source: params[11] as string,
      created_at: params[12] as number,
    };

    expect(usageSessionRowToDomain(row)).toEqual(session);
  });

  it('maps null optional fields to undefined in domain', () => {
    const row: UsageSessionRow = {
      id: 's2',
      package_name: 'com.example.app',
      app_display_name: null,
      platform: Platform.OTHER,
      start_time: 0,
      end_time: 100,
      duration_ms: 100,
      content_type: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      classification_source: ClassificationSource.UNKNOWN,
      classification_confidence: null,
      tracking_source: TrackingSource.ANDROID_USAGE_STATS,
      created_at: createdAt,
    };

    const domain = usageSessionRowToDomain(row);
    expect(domain.app.displayName).toBeUndefined();
    expect(domain.classificationConfidence).toBeUndefined();
  });

  it('throws on invalid platform enum in storage', () => {
    const row: UsageSessionRow = {
      id: 'bad',
      package_name: 'com.example.app',
      app_display_name: null,
      platform: 'RANDOM_PLATFORM',
      start_time: 0,
      end_time: 1,
      duration_ms: 1,
      content_type: ContentType.OTHER,
      classification: ActivityClassification.UNKNOWN,
      classification_source: ClassificationSource.UNKNOWN,
      classification_confidence: null,
      tracking_source: TrackingSource.ANDROID_USAGE_STATS,
      created_at: createdAt,
    };

    expect(() => usageSessionRowToDomain(row)).toThrow(/Invalid Platform/);
  });
});
