import { ActivityClassification } from './ActivityClassification';
import type { ClassificationRule } from './ClassificationRule';
import { ClassificationSource } from './ClassificationSource';
import { normalizeClassificationPackageName } from './normalizeClassificationPackageName';

/** User-chosen classifications stored as app-level USER_RULE (not UNKNOWN). */
export type ExplicitActivityClassification = Exclude<
  ActivityClassification,
  ActivityClassification.UNKNOWN
>;

export const APP_USER_CLASSIFICATION_RULE_ID_PREFIX = 'user-app:';

/** Stable default priority for app-level USER_RULE (no user-facing priority control). */
export const APP_USER_CLASSIFICATION_RULE_PRIORITY = 0;

export function deriveAppUserClassificationRuleId(packageName: string): string {
  const normalized = normalizeClassificationPackageName(packageName);
  return `${APP_USER_CLASSIFICATION_RULE_ID_PREFIX}${normalized}`;
}

export function buildAppUserClassificationRule(
  packageName: string,
  classification: ExplicitActivityClassification,
): ClassificationRule {
  const normalized = normalizeClassificationPackageName(packageName);
  return {
    id: deriveAppUserClassificationRuleId(normalized),
    packageName: normalized,
    classification,
    source: ClassificationSource.USER_RULE,
    priority: APP_USER_CLASSIFICATION_RULE_PRIORITY,
    enabled: true,
  };
}

/** Package-only USER_RULE rows managed by app-level classification (D3.4). */
export function isAppUserClassificationRule(rule: ClassificationRule): boolean {
  if (rule.source !== ClassificationSource.USER_RULE) {
    return false;
  }
  if (rule.platform !== undefined || rule.contentType !== undefined) {
    return false;
  }
  if (rule.packageName === undefined) {
    return false;
  }
  return rule.id === deriveAppUserClassificationRuleId(rule.packageName);
}
