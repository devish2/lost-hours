import type { Scalar } from '@op-engineering/op-sqlite';

export interface UsageSessionRow {
  id: string;
  package_name: string;
  app_display_name: string | null;
  platform: string;
  start_time: number;
  end_time: number;
  duration_ms: number;
  content_type: string;
  classification: string;
  classification_source: string;
  classification_confidence: number | null;
  tracking_source: string;
  created_at: number;
}

export interface ClassificationRuleRow {
  id: string;
  platform: string | null;
  content_type: string | null;
  package_name: string | null;
  classification: string;
  source: string;
  priority: number;
  enabled: number;
  created_at: number;
  updated_at: number;
}

export interface DailyUsageSummaryRow {
  date: string;
  total_tracked_ms: number;
  productive_ms: number;
  neutral_ms: number;
  leisure_ms: number;
  waste_ms: number;
  unknown_ms: number;
  session_count: number;
  longest_session_ms: number;
  updated_at: number;
}

export function rowToUsageSessionRow(row: Record<string, Scalar>): UsageSessionRow {
  return row as unknown as UsageSessionRow;
}

export function rowToClassificationRuleRow(
  row: Record<string, Scalar>,
): ClassificationRuleRow {
  return row as unknown as ClassificationRuleRow;
}

export function rowToDailyUsageSummaryRow(
  row: Record<string, Scalar>,
): DailyUsageSummaryRow {
  return row as unknown as DailyUsageSummaryRow;
}
