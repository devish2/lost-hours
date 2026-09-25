import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { Platform } from '../../domain/platform/Platform';
import type { UsageSession } from '../../domain/session/UsageSession';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';
import { ContentType } from '../../domain/classification/ContentType';
import { TrackingSource } from '../../domain/usage/TrackingSource';
import { enrichUsageSessionsWithAppMetadata } from './enrichUsageSessionsWithAppMetadata';

function createSession(packageName: string): UsageSession {
  return {
    id: `id-${packageName}`,
    app: { packageName },
    platform: Platform.OTHER,
    startTime: 1,
    endTime: 2,
    durationMs: 1,
    contentType: ContentType.UNKNOWN,
    classification: ActivityClassification.UNKNOWN,
    classificationSource: ClassificationSource.UNKNOWN,
    trackingSource: TrackingSource.ANDROID_USAGE_STATS,
  };
}

describe('enrichUsageSessionsWithAppMetadata', () => {
  it('deduplicates package names for one metadata batch call', async () => {
    const getAppMetadata = jest.fn(async () => [
      { packageName: 'com.whatsapp', displayName: 'WhatsApp' },
      { packageName: 'com.linkedin.android', displayName: 'LinkedIn' },
      { packageName: 'com.snapchat.android', displayName: 'Snapchat' },
    ]);
    const port: AppMetadataPort = { getAppMetadata };

    const sessions = [
      ...Array.from({ length: 10 }, () => createSession('com.whatsapp')),
      ...Array.from({ length: 5 }, () => createSession('com.linkedin.android')),
      ...Array.from({ length: 3 }, () => createSession('com.snapchat.android')),
    ];

    const enriched = await enrichUsageSessionsWithAppMetadata(sessions, port);

    expect(getAppMetadata).toHaveBeenCalledTimes(1);
    expect(getAppMetadata).toHaveBeenCalledWith([
      'com.whatsapp',
      'com.linkedin.android',
      'com.snapchat.android',
    ]);
    expect(enriched).toHaveLength(18);
    expect(enriched.every(s => s.app.displayName != null)).toBe(true);
    expect(enriched[0].classification).toBe(ActivityClassification.UNKNOWN);
    expect(enriched[0].classificationSource).toBe(ClassificationSource.UNKNOWN);
    expect(enriched[0].platform).toBe(Platform.OTHER);
  });

  it('leaves displayName absent when metadata has no label', async () => {
    const port: AppMetadataPort = {
      getAppMetadata: async () => [
        { packageName: 'com.example.nonexistent' },
      ],
    };
    const enriched = await enrichUsageSessionsWithAppMetadata(
      [createSession('com.example.nonexistent')],
      port,
    );
    expect(enriched[0].app.packageName).toBe('com.example.nonexistent');
    expect(enriched[0].app.displayName).toBeUndefined();
  });

  it('does not fail sessions when metadata provider throws', async () => {
    const port: AppMetadataPort = {
      getAppMetadata: async () => {
        throw new Error('native metadata failure');
      },
    };
    const sessions = [createSession('com.whatsapp')];
    const enriched = await enrichUsageSessionsWithAppMetadata(sessions, port);
    expect(enriched).toHaveLength(1);
    expect(enriched[0].app.displayName).toBeUndefined();
    expect(enriched[0].app.packageName).toBe('com.whatsapp');
  });

  it('returns sessions unchanged when port is null', async () => {
    const sessions = [createSession('com.whatsapp')];
    const enriched = await enrichUsageSessionsWithAppMetadata(sessions, null);
    expect(enriched[0].app.displayName).toBeUndefined();
  });
});
