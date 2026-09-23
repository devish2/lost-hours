import { ActivityClassification } from '../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../domain/classification/ClassificationSource';
import { ContentType } from '../../../domain/classification/ContentType';
import { Platform } from '../../../domain/platform/Platform';
import type { UsageSession } from '../../../domain/session/UsageSession';
import { TrackingSource } from '../../../domain/usage/TrackingSource';

/**
 * Deterministic demo-day sessions. Classifications are fixture data only —
 * not production policy (e.g. Instagram Reels as WASTE is illustrative).
 *
 * Target totals (via domain calculators): ~5h 12m tracked, ~2h 41m lost (WASTE).
 */
export function createDemoUsageSessions(): readonly UsageSession[] {
  const trackingSource = TrackingSource.ANDROID_USAGE_STATS;
  const userRule = ClassificationSource.USER_RULE;

  return [
    {
      id: 'demo-instagram-reels',
      app: { packageName: 'com.instagram.android' },
      platform: Platform.INSTAGRAM,
      startTime: 1_710_000_000_000,
      endTime: 1_710_005_040_000,
      durationMs: 84 * 60_000,
      contentType: ContentType.REELS,
      classification: ActivityClassification.WASTE,
      classificationSource: userRule,
      trackingSource,
    },
    {
      id: 'demo-youtube-shorts',
      app: { packageName: 'com.google.android.youtube' },
      platform: Platform.YOUTUBE,
      startTime: 1_710_010_000_000,
      endTime: 1_710_013_120_000,
      durationMs: 52 * 60_000,
      contentType: ContentType.SHORTS,
      classification: ActivityClassification.WASTE,
      classificationSource: userRule,
      trackingSource,
    },
    {
      id: 'demo-reddit-feed',
      app: { packageName: 'com.reddit.frontpage' },
      platform: Platform.REDDIT,
      startTime: 1_710_020_000_000,
      endTime: 1_710_021_500_000,
      durationMs: 25 * 60_000,
      contentType: ContentType.FEED,
      classification: ActivityClassification.WASTE,
      classificationSource: userRule,
      trackingSource,
    },
    {
      id: 'demo-youtube-tutorial',
      app: { packageName: 'com.google.android.youtube' },
      platform: Platform.YOUTUBE,
      startTime: 1_710_030_000_000,
      endTime: 1_710_032_880_000,
      durationMs: 48 * 60_000,
      contentType: ContentType.TUTORIAL,
      classification: ActivityClassification.PRODUCTIVE,
      classificationSource: ClassificationSource.SYSTEM_DEFAULT,
      trackingSource,
    },
    {
      id: 'demo-linkedin-creator',
      app: { packageName: 'com.linkedin.android' },
      platform: Platform.LINKEDIN,
      startTime: 1_710_040_000_000,
      endTime: 1_710_041_800_000,
      durationMs: 30 * 60_000,
      contentType: ContentType.CREATOR_ACTIVITY,
      classification: ActivityClassification.PRODUCTIVE,
      classificationSource: ClassificationSource.SYSTEM_DEFAULT,
      trackingSource,
    },
    {
      id: 'demo-messaging',
      app: { packageName: 'com.google.android.apps.messaging' },
      platform: Platform.OTHER,
      startTime: 1_710_050_000_000,
      endTime: 1_710_052_040_000,
      durationMs: 34 * 60_000,
      contentType: ContentType.MESSAGING,
      classification: ActivityClassification.NEUTRAL,
      classificationSource: ClassificationSource.SYSTEM_DEFAULT,
      trackingSource,
    },
    {
      id: 'demo-entertainment',
      app: { packageName: 'com.netflix.mediaclient' },
      platform: Platform.OTHER,
      startTime: 1_710_060_000_000,
      endTime: 1_710_062_340_000,
      durationMs: 39 * 60_000,
      contentType: ContentType.ENTERTAINMENT,
      classification: ActivityClassification.LEISURE,
      classificationSource: userRule,
      trackingSource,
    },
    {
      id: 'demo-unknown-skipped',
      app: { packageName: 'com.example.unknown' },
      platform: Platform.OTHER,
      startTime: 1_710_070_000_000,
      endTime: 1_710_070_000_000,
      durationMs: 0,
      contentType: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      classificationSource: ClassificationSource.UNKNOWN,
      trackingSource,
    },
  ];
}
