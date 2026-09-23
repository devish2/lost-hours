import { ActivityClassification } from './ActivityClassification';
import type { ActivityClassifier } from './ActivityClassifier';
import { ClassificationSource } from './ClassificationSource';
import type { ClassificationContext } from './ClassificationContext';
import type { ClassificationResult } from './ClassificationResult';
import type { ClassificationRule } from './ClassificationRule';
import { compareClassificationRules } from './compareClassificationRules';
import { matchesClassificationRule } from './matchesClassificationRule';

const UNKNOWN_RESULT: ClassificationResult = {
  classification: ActivityClassification.UNKNOWN,
  source: ClassificationSource.UNKNOWN,
};

export class RuleBasedActivityClassifier implements ActivityClassifier {
  classify(
    context: ClassificationContext,
    rules: readonly ClassificationRule[],
  ): ClassificationResult {
    let winner: ClassificationRule | undefined;

    for (const rule of rules) {
      if (!matchesClassificationRule(context, rule)) {
        continue;
      }

      if (winner === undefined) {
        winner = rule;
        continue;
      }

      if (compareClassificationRules(rule, winner) > 0) {
        winner = rule;
      }
    }

    if (winner === undefined) {
      return UNKNOWN_RESULT;
    }

    return {
      classification: winner.classification,
      source: winner.source,
      matchedRuleId: winner.id,
    };
  }
}

export const ruleBasedActivityClassifier = new RuleBasedActivityClassifier();
