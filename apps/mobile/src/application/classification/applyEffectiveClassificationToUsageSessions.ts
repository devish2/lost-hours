import type { ActivityClassifier } from '../../domain/classification/ActivityClassifier';
import type { ClassificationContext } from '../../domain/classification/ClassificationContext';
import type { ClassificationRule } from '../../domain/classification/ClassificationRule';
import { ruleBasedActivityClassifier } from '../../domain/classification/RuleBasedActivityClassifier';
import type { UsageSession } from '../../domain/session/UsageSession';
import type { EffectiveUsageSessionForAnalytics } from './effectiveUsageSessionForAnalytics';

function toClassificationContext(session: UsageSession): ClassificationContext {
  return {
    app: session.app,
    platform: session.platform,
    contentType: session.contentType,
  };
}

/**
 * Builds effective analytics copies from raw/persisted sessions + enabled rules.
 * Never mutates inputs; output must not be persisted to `usage_sessions`.
 */
export function applyEffectiveClassificationToUsageSessions(
  sessions: readonly UsageSession[],
  rules: readonly ClassificationRule[],
  classifier: ActivityClassifier = ruleBasedActivityClassifier,
): EffectiveUsageSessionForAnalytics[] {
  return sessions.map(session => {
    const result = classifier.classify(toClassificationContext(session), rules);
    return {
      ...session,
      app: { ...session.app },
      classification: result.classification,
      classificationSource: result.source,
    };
  });
}
