import type { ClassificationRule } from '../../../../domain/classification/ClassificationRule';
import {
  parseActivityClassification,
  parseClassificationSource,
  parseContentType,
  parsePlatform,
} from '../parsing/parseStoredEnums';
import type { ClassificationRuleRow } from './rows';

export function classificationRuleToInsertParams(
  rule: ClassificationRule,
  createdAt: number,
  updatedAt: number,
): (string | number | null)[] {
  return [
    rule.id,
    rule.platform ?? null,
    rule.contentType ?? null,
    rule.packageName ?? null,
    rule.classification,
    rule.source,
    rule.priority,
    rule.enabled ? 1 : 0,
    createdAt,
    updatedAt,
  ];
}

export function classificationRuleRowToDomain(
  row: ClassificationRuleRow,
): ClassificationRule {
  return {
    id: row.id,
    platform: row.platform === null ? undefined : parsePlatform(row.platform),
    contentType:
      row.content_type === null ? undefined : parseContentType(row.content_type),
    packageName: row.package_name ?? undefined,
    classification: parseActivityClassification(row.classification),
    source: parseClassificationSource(row.source),
    priority: row.priority,
    enabled: row.enabled === 1,
  };
}

export const CLASSIFICATION_RULE_UPSERT_SQL = `
INSERT INTO classification_rules (
  id,
  platform,
  content_type,
  package_name,
  classification,
  source,
  priority,
  enabled,
  created_at,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  platform = excluded.platform,
  content_type = excluded.content_type,
  package_name = excluded.package_name,
  classification = excluded.classification,
  source = excluded.source,
  priority = excluded.priority,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at
`;
