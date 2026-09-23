import { ActivityClassification } from './ActivityClassification';
import { ClassificationSource } from './ClassificationSource';

export interface ClassificationResult {
  classification: ActivityClassification;
  source: ClassificationSource;
  matchedRuleId?: string;
  confidence?: number;
}
