import type { UsageSession } from '../../../../domain/session/UsageSession';
import {
  parseActivityClassification,
  parseClassificationSource,
  parseContentType,
  parsePlatform,
  parseTrackingSource,
} from '../parsing/parseStoredEnums';
import type { UsageSessionRow } from './rows';

export function usageSessionToInsertParams(
  session: UsageSession,
  createdAt: number,
): (string | number | null)[] {
  return [
    session.id,
    session.app.packageName,
    session.app.displayName ?? null,
    session.platform,
    session.startTime,
    session.endTime,
    session.durationMs,
    session.contentType,
    session.classification,
    session.classificationSource,
    session.classificationConfidence ?? null,
    session.trackingSource,
    createdAt,
  ];
}

export function usageSessionRowToDomain(row: UsageSessionRow): UsageSession {
  return {
    id: row.id,
    app: {
      packageName: row.package_name,
      displayName: row.app_display_name ?? undefined,
    },
    platform: parsePlatform(row.platform),
    startTime: row.start_time,
    endTime: row.end_time,
    durationMs: row.duration_ms,
    contentType: parseContentType(row.content_type),
    classification: parseActivityClassification(row.classification),
    classificationSource: parseClassificationSource(row.classification_source),
    trackingSource: parseTrackingSource(row.tracking_source),
    classificationConfidence:
      row.classification_confidence === null
        ? undefined
        : row.classification_confidence,
  };
}

export const USAGE_SESSION_DELETE_DERIVED_VARIANTS_SQL = `
DELETE FROM usage_sessions
WHERE tracking_source = ? AND package_name = ? AND start_time = ? AND id != ?
`;

export const USAGE_SESSION_UPSERT_SQL = `
INSERT INTO usage_sessions (
  id,
  package_name,
  app_display_name,
  platform,
  start_time,
  end_time,
  duration_ms,
  content_type,
  classification,
  classification_source,
  classification_confidence,
  tracking_source,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  package_name = excluded.package_name,
  app_display_name = excluded.app_display_name,
  platform = excluded.platform,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  duration_ms = excluded.duration_ms,
  content_type = excluded.content_type,
  classification = excluded.classification,
  classification_source = excluded.classification_source,
  classification_confidence = excluded.classification_confidence,
  tracking_source = excluded.tracking_source
`;
