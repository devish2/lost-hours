import type { ClassificationRule } from './ClassificationRule';
import { getClassificationRuleSpecificity } from './classificationRuleSpecificity';
import { getClassificationSourcePrecedence } from './classificationSourcePrecedence';

/**
 * Returns a positive number if `a` outranks `b`, negative if `b` outranks `a`, 0 if tied.
 * Tie-break: ascending lexical rule id (smaller id wins).
 */
export function compareClassificationRules(
  a: ClassificationRule,
  b: ClassificationRule,
): number {
  const sourceDiff =
    getClassificationSourcePrecedence(a.source) -
    getClassificationSourcePrecedence(b.source);
  if (sourceDiff !== 0) {
    return sourceDiff;
  }

  const priorityDiff = a.priority - b.priority;
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const specificityDiff =
    getClassificationRuleSpecificity(a) - getClassificationRuleSpecificity(b);
  if (specificityDiff !== 0) {
    return specificityDiff;
  }

  if (a.id < b.id) {
    return 1;
  }
  if (a.id > b.id) {
    return -1;
  }
  return 0;
}
