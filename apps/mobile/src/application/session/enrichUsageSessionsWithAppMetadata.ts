import type { UsageSession } from '../../domain/session/UsageSession';
import type { AppMetadataPort } from '../../domain/usage/AppMetadataPort';

function uniquePackageNames(sessions: readonly UsageSession[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const session of sessions) {
    const packageName = session.app.packageName.trim();
    if (packageName.length === 0 || seen.has(packageName)) {
      continue;
    }
    seen.add(packageName);
    ordered.push(packageName);
  }
  return ordered;
}

/** Enriches collected sessions with optional PackageManager labels (metadata failure is non-fatal). */
export async function enrichUsageSessionsWithAppMetadata(
  sessions: readonly UsageSession[],
  appMetadataPort: AppMetadataPort | null,
): Promise<UsageSession[]> {
  if (appMetadataPort == null || sessions.length === 0) {
    return sessions.map(session => ({ ...session, app: { ...session.app } }));
  }

  const packageNames = uniquePackageNames(sessions);
  if (packageNames.length === 0) {
    return sessions.map(session => ({ ...session, app: { ...session.app } }));
  }

  let metadata;
  try {
    metadata = await appMetadataPort.getAppMetadata(packageNames);
  } catch {
    return sessions.map(session => ({ ...session, app: { ...session.app } }));
  }

  const displayNameByPackage = new Map<string, string>();
  for (const entry of metadata) {
    const packageName = entry.packageName.trim();
    const displayName = entry.displayName?.trim();
    if (packageName.length > 0 && displayName != null && displayName.length > 0) {
      displayNameByPackage.set(packageName, displayName);
    }
  }

  return sessions.map(session => {
    const displayName = displayNameByPackage.get(session.app.packageName);
    if (displayName == null) {
      return { ...session, app: { ...session.app } };
    }
    return {
      ...session,
      app: {
        ...session.app,
        displayName,
      },
    };
  });
}
