import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import type { UsageSession } from '../../domain/session/UsageSession';
import { isValidAnalyticsSession } from '../../domain/session/isValidAnalyticsSession';
import type { TodayAppBreakdownItem } from '../models/TodayAppBreakdownItem';

type PackageAccumulator = {
  packageName: string;
  trackedDurationMs: number;
  lostDurationMs: number;
  sessions: UsageSession[];
};

function compareSessionsMostRecentFirst(a: UsageSession, b: UsageSession): number {
  if (a.endTime !== b.endTime) {
    return b.endTime - a.endTime;
  }
  if (a.startTime !== b.startTime) {
    return b.startTime - a.startTime;
  }
  return a.id.localeCompare(b.id);
}

function selectDisplayName(sessions: readonly UsageSession[]): string | undefined {
  const ordered = [...sessions].sort(compareSessionsMostRecentFirst);
  for (const session of ordered) {
    const label = session.app.displayName?.trim();
    if (label != null && label.length > 0) {
      return label;
    }
  }
  return undefined;
}

function selectPlatform(sessions: readonly UsageSession[]) {
  const [mostRecent] = [...sessions].sort(compareSessionsMostRecentFirst);
  return mostRecent?.platform ?? sessions[0]!.platform;
}

function uniqueValues<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function buildClassificationFields(sessions: readonly UsageSession[]): Pick<
  TodayAppBreakdownItem,
  | 'classification'
  | 'classificationSource'
  | 'hasMixedClassification'
  | 'hasMixedClassificationSource'
> {
  const classifications = uniqueValues(sessions.map(s => s.classification));
  const sources = uniqueValues(sessions.map(s => s.classificationSource));
  const hasMixedClassification = classifications.length > 1;
  const hasMixedClassificationSource = sources.length > 1;
  return {
    hasMixedClassification,
    hasMixedClassificationSource,
    classification: hasMixedClassification ? undefined : classifications[0],
    classificationSource: hasMixedClassificationSource ? undefined : sources[0],
  };
}

/** Aggregates effective clipped sessions into per-package Today rows. */
export function aggregateTodayUsageByApp(
  sessions: readonly UsageSession[],
): TodayAppBreakdownItem[] {
  const byPackage = new Map<string, PackageAccumulator>();

  for (const session of sessions) {
    if (!isValidAnalyticsSession(session)) {
      continue;
    }
    const packageName = session.app.packageName.trim();
    if (packageName.length === 0) {
      continue;
    }
    const existing = byPackage.get(packageName);
    const lostIncrement =
      session.classification === ActivityClassification.WASTE
        ? session.durationMs
        : 0;
    if (existing == null) {
      byPackage.set(packageName, {
        packageName,
        trackedDurationMs: session.durationMs,
        lostDurationMs: lostIncrement,
        sessions: [session],
      });
      continue;
    }
    existing.trackedDurationMs += session.durationMs;
    existing.lostDurationMs += lostIncrement;
    existing.sessions.push(session);
  }

  const rows: TodayAppBreakdownItem[] = [];
  for (const group of byPackage.values()) {
    rows.push({
      packageName: group.packageName,
      displayName: selectDisplayName(group.sessions),
      platform: selectPlatform(group.sessions),
      ...buildClassificationFields(group.sessions),
      trackedDurationMs: group.trackedDurationMs,
      lostDurationMs: group.lostDurationMs,
    });
  }

  rows.sort((a, b) => {
    if (a.trackedDurationMs !== b.trackedDurationMs) {
      return b.trackedDurationMs - a.trackedDurationMs;
    }
    return a.packageName.localeCompare(b.packageName);
  });

  return rows;
}
