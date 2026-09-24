import { ActivityClassification } from '../classification/ActivityClassification';
import { ClassificationSource } from '../classification/ClassificationSource';
import { ContentType } from '../classification/ContentType';
import type { PlatformResolver } from '../platform/PlatformResolver';
import { PackageNamePlatformResolver } from '../platform/PackageNamePlatformResolver';
import type { AppIdentity } from '../usage/AppIdentity';
import type { UsageEvent } from '../usage/UsageEvent';
import { UsageEventType } from '../usage/UsageEventType';
import { TrackingSource } from '../usage/TrackingSource';
import { deriveUsageSessionId } from './deriveUsageSessionId';
import type { SessionBuilder } from './SessionBuilder';
import type { UsageSession } from './UsageSession';
import { validateSessionProcessingWindow } from './validateSessionProcessingWindow';

type OpenSession = {
  app: AppIdentity;
  startTime: number;
  trackingSource: TrackingSource;
};

export type DefaultUsageSessionBuilderDeps = {
  platformResolver?: PlatformResolver;
};

const EVENT_TYPE_SORT_ORDER: Record<UsageEventType, number> = {
  [UsageEventType.FOREGROUND]: 0,
  [UsageEventType.BACKGROUND]: 1,
  [UsageEventType.UNKNOWN]: 2,
};

function isValidEventForWindow(
  event: UsageEvent,
  fromTimestamp: number,
  toTimestamp: number,
): boolean {
  if (event.timestamp < 0) {
    return false;
  }
  if (event.timestamp < fromTimestamp || event.timestamp >= toTimestamp) {
    return false;
  }
  const packageName = event.app.packageName.trim();
  if (packageName.length === 0) {
    return false;
  }
  if (event.eventType === UsageEventType.UNKNOWN) {
    return false;
  }
  return true;
}

function compareEventsForProcessing(a: UsageEvent, b: UsageEvent): number {
  if (a.timestamp !== b.timestamp) {
    return a.timestamp - b.timestamp;
  }
  const typeOrder =
    EVENT_TYPE_SORT_ORDER[a.eventType] - EVENT_TYPE_SORT_ORDER[b.eventType];
  if (typeOrder !== 0) {
    return typeOrder;
  }
  return a.app.packageName.localeCompare(b.app.packageName);
}

function createSession(
  open: OpenSession,
  endTime: number,
  platformResolver: PlatformResolver,
): UsageSession | null {
  const durationMs = endTime - open.startTime;
  if (durationMs <= 0) {
    return null;
  }

  return {
    id: deriveUsageSessionId({
      packageName: open.app.packageName,
      startTime: open.startTime,
      endTime,
      trackingSource: open.trackingSource,
    }),
    app: open.app,
    platform: platformResolver.resolvePlatform(open.app),
    startTime: open.startTime,
    endTime,
    durationMs,
    contentType: ContentType.UNKNOWN,
    classification: ActivityClassification.UNKNOWN,
    classificationSource: ClassificationSource.UNKNOWN,
    trackingSource: open.trackingSource,
  };
}

export class DefaultUsageSessionBuilder implements SessionBuilder {
  private readonly platformResolver: PlatformResolver;

  constructor(deps: DefaultUsageSessionBuilderDeps = {}) {
    this.platformResolver =
      deps.platformResolver ?? new PackageNamePlatformResolver();
  }

  buildSessions(
    events: readonly UsageEvent[],
    fromTimestamp: number,
    toTimestamp: number,
  ): readonly UsageSession[] {
    validateSessionProcessingWindow(fromTimestamp, toTimestamp);

    const normalized = events
      .filter(event => isValidEventForWindow(event, fromTimestamp, toTimestamp))
      .slice()
      .sort(compareEventsForProcessing);

    const openByPackage = new Map<string, OpenSession>();
    const sessions: UsageSession[] = [];

    for (const event of normalized) {
      const packageName = event.app.packageName;

      if (event.eventType === UsageEventType.FOREGROUND) {
        if (!openByPackage.has(packageName)) {
          openByPackage.set(packageName, {
            app: event.app,
            startTime: event.timestamp,
            trackingSource: event.trackingSource,
          });
        }
        continue;
      }

      if (event.eventType === UsageEventType.BACKGROUND) {
        const open = openByPackage.get(packageName);
        if (open == null) {
          continue;
        }
        const session = createSession(
          open,
          event.timestamp,
          this.platformResolver,
        );
        openByPackage.delete(packageName);
        if (session != null) {
          sessions.push(session);
        }
      }
    }

    for (const open of openByPackage.values()) {
      const session = createSession(
        open,
        toTimestamp,
        this.platformResolver,
      );
      if (session != null) {
        sessions.push(session);
      }
    }

    sessions.sort((a, b) => {
      if (a.startTime !== b.startTime) {
        return a.startTime - b.startTime;
      }
      const packageCompare = a.app.packageName.localeCompare(b.app.packageName);
      if (packageCompare !== 0) {
        return packageCompare;
      }
      return a.endTime - b.endTime;
    });

    return sessions;
  }
}
