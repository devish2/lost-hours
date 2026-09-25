import { AppUserClassification } from '../../application/use-cases/AppUserClassification';
import type { ClassificationRuleRepository } from '../../domain/repositories/ClassificationRuleRepository';

/** Wires app-level classification management to a rule repository (D3.5). */
export function createAppUserClassification(
  classificationRuleRepository: ClassificationRuleRepository,
): AppUserClassification {
  return new AppUserClassification(classificationRuleRepository);
}
