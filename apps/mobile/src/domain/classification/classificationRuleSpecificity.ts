import type { ClassificationRule } from './ClassificationRule';

/** Count of matcher dimensions specified on the rule (not context-dependent). */
export function getClassificationRuleSpecificity(rule: ClassificationRule): number {
  let score = 0;
  if (rule.platform !== undefined) {
    score += 1;
  }
  if (rule.contentType !== undefined) {
    score += 1;
  }
  if (rule.packageName !== undefined) {
    score += 1;
  }
  return score;
}
