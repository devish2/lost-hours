import type { ClassificationContext } from './ClassificationContext';
import type { ClassificationResult } from './ClassificationResult';
import type { ClassificationRule } from './ClassificationRule';

export interface ActivityClassifier {
  classify(
    context: ClassificationContext,
    rules: readonly ClassificationRule[],
  ): ClassificationResult;
}
