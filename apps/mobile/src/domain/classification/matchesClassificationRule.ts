import type { ClassificationContext } from './ClassificationContext';
import type { ClassificationRule } from './ClassificationRule';
import { getClassificationRuleSpecificity } from './classificationRuleSpecificity';

export function ruleHasMatchers(rule: ClassificationRule): boolean {
  return getClassificationRuleSpecificity(rule) > 0;
}

export function matchesClassificationRule(
  context: ClassificationContext,
  rule: ClassificationRule,
): boolean {
  if (!rule.enabled) {
    return false;
  }

  if (!ruleHasMatchers(rule)) {
    return false;
  }

  if (rule.platform !== undefined && rule.platform !== context.platform) {
    return false;
  }

  if (rule.contentType !== undefined && rule.contentType !== context.contentType) {
    return false;
  }

  if (
    rule.packageName !== undefined &&
    rule.packageName !== context.app.packageName
  ) {
    return false;
  }

  return true;
}
