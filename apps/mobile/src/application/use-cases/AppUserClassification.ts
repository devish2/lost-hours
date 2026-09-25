import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import {
  buildAppUserClassificationRule,
  deriveAppUserClassificationRuleId,
  isAppUserClassificationRule,
  type ExplicitActivityClassification,
} from '../../domain/classification/appUserClassificationRule';
import { normalizeClassificationPackageName } from '../../domain/classification/normalizeClassificationPackageName';
import type { ClassificationRuleRepository } from '../../domain/repositories/ClassificationRuleRepository';

export class InvalidAppClassificationTargetError extends Error {
  constructor() {
    super(
      'App classification must be PRODUCTIVE, NEUTRAL, LEISURE, or WASTE; use clearClassification to remove',
    );
    this.name = 'InvalidAppClassificationTargetError';
  }
}

export type AppUserClassificationRuleSummary = {
  ruleId: string;
  packageName: string;
  classification: ExplicitActivityClassification;
};

/** App-level USER_RULE management keyed by Android packageName (D3.4). */
export class AppUserClassification {
  constructor(
    private readonly classificationRuleRepository: ClassificationRuleRepository,
  ) {}

  async getClassification(packageName: string): Promise<ActivityClassification> {
    const explicit = await this.getExplicitAppClassification(packageName);
    return explicit ?? ActivityClassification.UNKNOWN;
  }

  /** Explicit app-level USER_RULE classification, or null when none exists. */
  async getExplicitAppClassification(
    packageName: string,
  ): Promise<ExplicitActivityClassification | null> {
    const normalized = normalizeClassificationPackageName(packageName);
    const rule = await this.classificationRuleRepository.findById(
      deriveAppUserClassificationRuleId(normalized),
    );
    if (rule == null || !rule.enabled || !isAppUserClassificationRule(rule)) {
      return null;
    }
    return rule.classification as ExplicitActivityClassification;
  }

  async setClassification(
    packageName: string,
    classification: ActivityClassification,
  ): Promise<void> {
    if (!isExplicitAppClassification(classification)) {
      throw new InvalidAppClassificationTargetError();
    }
    const rule = buildAppUserClassificationRule(packageName, classification);
    await this.classificationRuleRepository.save(rule);
  }

  /** Removes the explicit app-level USER_RULE so classifier fallback can be UNKNOWN. */
  async clearClassification(packageName: string): Promise<void> {
    const normalized = normalizeClassificationPackageName(packageName);
    await this.classificationRuleRepository.deleteById(
      deriveAppUserClassificationRuleId(normalized),
    );
  }

  async listAppUserRules(): Promise<AppUserClassificationRuleSummary[]> {
    const rules = await this.classificationRuleRepository.findAll();
    return rules
      .filter(
        rule => rule.enabled && isAppUserClassificationRule(rule),
      )
      .map(rule => ({
        ruleId: rule.id,
        packageName: rule.packageName!,
        classification: rule.classification as ExplicitActivityClassification,
      }))
      .sort((a, b) => a.packageName.localeCompare(b.packageName));
  }
}

function isExplicitAppClassification(
  classification: ActivityClassification,
): classification is ExplicitActivityClassification {
  return classification !== ActivityClassification.UNKNOWN;
}
