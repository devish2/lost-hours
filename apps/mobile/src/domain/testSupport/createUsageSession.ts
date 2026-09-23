import { ActivityClassification } from '../classification/ActivityClassification';
import { ClassificationSource } from '../classification/ClassificationSource';
import { ContentType } from '../classification/ContentType';
import { Platform } from '../platform/Platform';
import type { UsageSession } from '../session/UsageSession';
import { TrackingSource } from '../usage/TrackingSource';

/** Test-only builder for deterministic UsageSession fixtures. */
export function createUsageSession(
  overrides: Partial<UsageSession> & Pick<UsageSession, 'id'>,
): UsageSession {
  const durationMs = overrides.durationMs ?? 60_000;
  return {
    app: { packageName: 'com.example.app' },
    platform: Platform.OTHER,
    startTime: 0,
    endTime: durationMs,
    durationMs,
    contentType: ContentType.OTHER,
    classification: ActivityClassification.UNKNOWN,
    classificationSource: ClassificationSource.UNKNOWN,
    trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    ...overrides,
  };
}
