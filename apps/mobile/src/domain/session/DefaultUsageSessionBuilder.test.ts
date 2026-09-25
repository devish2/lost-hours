import { ActivityClassification } from '../classification/ActivityClassification';
import { ClassificationSource } from '../classification/ClassificationSource';
import { ContentType } from '../classification/ContentType';
import { Platform } from '../platform/Platform';
import type { PlatformResolver } from '../platform/PlatformResolver';
import { createUsageEvent } from '../testSupport/createUsageEvent';
import { TrackingSource } from '../usage/TrackingSource';
import { UsageEventType } from '../usage/UsageEventType';
import { PackageNamePlatformResolver } from '../platform/PackageNamePlatformResolver';
import { DefaultUsageSessionBuilder } from './DefaultUsageSessionBuilder';
import { deriveUsageSessionId } from './deriveUsageSessionId';

const FROM = 0;
const TO = 60_000;

describe('DefaultUsageSessionBuilder', () => {
  const builder = new DefaultUsageSessionBuilder();

  it('returns empty sessions for empty events', () => {
    expect(builder.buildSessions([], FROM, TO)).toEqual([]);
  });

  it('builds a normal foreground → background pair as [start, end)', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 10_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.instagram.android' },
        }),
        createUsageEvent({
          timestamp: 14_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.instagram.android' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      startTime: 10_000,
      endTime: 14_000,
      durationMs: 4_000,
      platform: Platform.INSTAGRAM,
      contentType: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      classificationSource: ClassificationSource.UNKNOWN,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });
  });

  it('ignores orphan background without inventing a start', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );
    expect(sessions).toEqual([]);
  });

  it('closes unmatched foreground at window end (truncated session)', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 10_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.startTime).toBe(10_000);
    expect(sessions[0]?.endTime).toBe(TO);
    expect(sessions[0]?.durationMs).toBe(TO - 10_000);
  });

  it('retains earliest foreground on duplicate foreground for same package', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 10_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.startTime).toBe(1_000);
    expect(sessions[0]?.endTime).toBe(10_000);
  });

  it('ignores duplicate background after a pair is closed', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 10_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 11_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.endTime).toBe(10_000);
  });

  it('preserves overlapping package-specific sessions on app switch', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 10_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.app.a' },
        }),
        createUsageEvent({
          timestamp: 15_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.app.b' },
        }),
        createUsageEvent({
          timestamp: 16_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.app.a' },
        }),
        createUsageEvent({
          timestamp: 20_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.app.b' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toEqual([
      expect.objectContaining({
        app: { packageName: 'com.app.a' },
        startTime: 10_000,
        endTime: 16_000,
      }),
      expect.objectContaining({
        app: { packageName: 'com.app.b' },
        startTime: 15_000,
        endTime: 20_000,
      }),
    ]);
  });

  it('normalizes unsorted input deterministically', () => {
    const events = [
      createUsageEvent({
        timestamp: 10_000,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: 'com.example.app' },
      }),
      createUsageEvent({
        timestamp: 1_000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
    ];

    const sessions = builder.buildSessions(events, FROM, TO);
    expect(sessions[0]?.startTime).toBe(1_000);
    expect(sessions[0]?.endTime).toBe(10_000);
  });

  it('does not create zero-duration sessions for same timestamp foreground/background', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );
    expect(sessions).toEqual([]);
  });

  it('ignores events outside the processing window', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: FROM - 1,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: TO,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 8_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.startTime).toBe(5_000);
  });

  it('ignores UNKNOWN event types for session construction', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.UNKNOWN,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.startTime).toBe(2_000);
  });

  it('rejects invalid processing windows', () => {
    expect(() => builder.buildSessions([], 10, 10)).toThrow(
      /fromTimestamp < toTimestamp/,
    );
    expect(() => builder.buildSessions([], -1, TO)).toThrow(/>= 0/);
    expect(() => builder.buildSessions([], FROM, -1)).toThrow(/>= 0/);
  });

  it('produces deterministic session ids', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );

    const expectedId = deriveUsageSessionId({
      packageName: 'com.example.app',
      startTime: 1_000,
      endTime: 2_000,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });
    expect(sessions[0]?.id).toBe(expectedId);

    const again = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.example.app' },
        }),
      ],
      FROM,
      TO,
    );
    expect(again[0]?.id).toBe(expectedId);
  });

  it('sorts output by startTime, packageName, endTime', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.z.app' },
        }),
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.a.app' },
        }),
        createUsageEvent({
          timestamp: 8_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.z.app' },
        }),
        createUsageEvent({
          timestamp: 8_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.a.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions.map(session => session.app.packageName)).toEqual([
      'com.a.app',
      'com.z.app',
    ]);
  });

  it('does not mutate the input events array', () => {
    const events = [
      createUsageEvent({
        timestamp: 5_000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
      createUsageEvent({
        timestamp: 1_000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
    ];
    const snapshot = events.map(event => ({ ...event, app: { ...event.app } }));
    builder.buildSessions(events, FROM, TO);
    expect(events).toEqual(snapshot);
  });

  it('skips events with blank package names or negative timestamps', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: -1,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.example.app' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: '   ' },
        }),
        createUsageEvent({
          timestamp: 3_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.valid.app' },
        }),
        createUsageEvent({
          timestamp: 4_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.valid.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.app.packageName).toBe('com.valid.app');
  });

  it('preserves packageName and resolves platform via default PackageNamePlatformResolver', () => {
    const builderWithCatalog = new DefaultUsageSessionBuilder({
      platformResolver: new PackageNamePlatformResolver(),
    });

    const linkedIn = builderWithCatalog.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.linkedin.android' },
        }),
        createUsageEvent({
          timestamp: 5_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.linkedin.android' },
        }),
      ],
      FROM,
      TO,
    );

    expect(linkedIn).toHaveLength(1);
    expect(linkedIn[0]?.app.packageName).toBe('com.linkedin.android');
    expect(linkedIn[0]?.platform).toBe(Platform.LINKEDIN);
    expect(linkedIn[0]?.classification).toBe(ActivityClassification.UNKNOWN);
    expect(linkedIn[0]?.classificationSource).toBe(
      ClassificationSource.UNKNOWN,
    );

    const snapchat = builderWithCatalog.buildSessions(
      [
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.snapchat.android' },
        }),
        createUsageEvent({
          timestamp: 6_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.snapchat.android' },
        }),
      ],
      FROM,
      TO,
    );

    expect(snapchat[0]?.app.packageName).toBe('com.snapchat.android');
    expect(snapchat[0]?.platform).toBe(Platform.OTHER);
  });

  it('maps Chrome foreground to OTHER without inferring in-app websites', () => {
    const builderWithCatalog = new DefaultUsageSessionBuilder({
      platformResolver: new PackageNamePlatformResolver(),
    });

    const chrome = builderWithCatalog.buildSessions(
      [
        createUsageEvent({
          timestamp: 10_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.android.chrome' },
        }),
        createUsageEvent({
          timestamp: 40_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.android.chrome' },
        }),
      ],
      FROM,
      TO,
    );

    expect(chrome).toHaveLength(1);
    expect(chrome[0]?.app.packageName).toBe('com.android.chrome');
    expect(chrome[0]?.platform).toBe(Platform.OTHER);
    expect(chrome[0]?.classification).toBe(ActivityClassification.UNKNOWN);
  });

  it('uses injected platform resolver', () => {
    const resolver: PlatformResolver = {
      resolvePlatform: () => Platform.YOUTUBE,
    };
    const customBuilder = new DefaultUsageSessionBuilder({
      platformResolver: resolver,
    });
    const sessions = customBuilder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'unknown.pkg' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'unknown.pkg' },
        }),
      ],
      FROM,
      TO,
    );
    expect(sessions[0]?.platform).toBe(Platform.YOUTUBE);
  });

  it('builds independent sessions for multiple packages', () => {
    const sessions = builder.buildSessions(
      [
        createUsageEvent({
          timestamp: 1_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.one.app' },
        }),
        createUsageEvent({
          timestamp: 2_000,
          eventType: UsageEventType.FOREGROUND,
          app: { packageName: 'com.two.app' },
        }),
        createUsageEvent({
          timestamp: 3_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.one.app' },
        }),
        createUsageEvent({
          timestamp: 4_000,
          eventType: UsageEventType.BACKGROUND,
          app: { packageName: 'com.two.app' },
        }),
      ],
      FROM,
      TO,
    );

    expect(sessions).toHaveLength(2);
  });
});
