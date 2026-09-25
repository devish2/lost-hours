import { Platform } from '../../domain/platform/Platform';
import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { deriveAppUserClassificationRuleId } from '../../domain/classification/appUserClassificationRule';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import type { ClassificationContext } from '../../domain/classification/ClassificationContext';
import type { ClassificationRule } from '../../domain/classification/ClassificationRule';
import { ContentType } from '../../domain/classification/ContentType';
import { RuleBasedActivityClassifier } from '../../domain/classification/RuleBasedActivityClassifier';
import type { UsageSession } from '../../domain/session/UsageSession';
import { TrackingSource } from '../../domain/usage/TrackingSource';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import {
  AppUserClassification,
  InvalidAppClassificationTargetError,
} from './AppUserClassification';

const classifier = new RuleBasedActivityClassifier();
const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';

function snapchatContext(
  displayName?: string,
  platform: Platform = Platform.OTHER,
): ClassificationContext {
  return {
    app: {
      packageName: SNAPCHAT,
      ...(displayName !== undefined ? { displayName } : {}),
    },
    platform,
    contentType: ContentType.UNKNOWN,
  };
}

function classifyWithStoredRules(
  context: ClassificationContext,
  rules: readonly ClassificationRule[],
) {
  return classifier.classify(
    context,
    rules.filter(rule => rule.enabled),
  );
}

describe('AppUserClassification', () => {
  it('follows set → reclassify → clear lifecycle without duplicate rules', async () => {
    const repository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repository);

    expect(await appClassification.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.UNKNOWN,
    );
    expect(await appClassification.getExplicitAppClassification(SNAPCHAT)).toBeNull();

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    expect(repository.allRules()).toHaveLength(1);
    expect(await appClassification.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.WASTE,
    );
    expect(await appClassification.getExplicitAppClassification(SNAPCHAT)).toBe(
      ActivityClassification.WASTE,
    );

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    expect(repository.allRules()).toHaveLength(1);
    expect(repository.allRules()[0].classification).toBe(
      ActivityClassification.PRODUCTIVE,
    );

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.NEUTRAL,
    );
    expect(repository.allRules()).toHaveLength(1);
    expect(await appClassification.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.NEUTRAL,
    );

    await appClassification.clearClassification(SNAPCHAT);
    expect(repository.allRules()).toHaveLength(0);
    expect(await appClassification.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.UNKNOWN,
    );
  });

  it('rejects setting UNKNOWN via setClassification', async () => {
    const appClassification = new AppUserClassification(
      new InMemoryClassificationRuleRepository(),
    );
    await expect(
      appClassification.setClassification(
        SNAPCHAT,
        ActivityClassification.UNKNOWN,
      ),
    ).rejects.toBeInstanceOf(InvalidAppClassificationTargetError);
  });

  it('lists app-level USER_RULE rows sorted by packageName', async () => {
    const repository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repository);

    await appClassification.setClassification(
      'com.whatsapp',
      ActivityClassification.NEUTRAL,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    await repository.save({
      id: 'system-default-ig',
      platform: Platform.INSTAGRAM,
      classification: ActivityClassification.LEISURE,
      source: ClassificationSource.SYSTEM_DEFAULT,
      priority: 0,
      enabled: true,
    });

    const listed = await appClassification.listAppUserRules();
    expect(listed).toEqual([
      {
        ruleId: deriveAppUserClassificationRuleId(SNAPCHAT),
        packageName: SNAPCHAT,
        classification: ActivityClassification.WASTE,
      },
      {
        ruleId: deriveAppUserClassificationRuleId('com.whatsapp'),
        packageName: 'com.whatsapp',
        classification: ActivityClassification.NEUTRAL,
      },
    ]);
  });

  it('is compatible with RuleBasedActivityClassifier for set/reclassify/clear', async () => {
    const repository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repository);
    const context = snapchatContext();

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    let result = classifyWithStoredRules(context, repository.allRules());
    expect(result).toEqual({
      classification: ActivityClassification.WASTE,
      source: ClassificationSource.USER_RULE,
      matchedRuleId: deriveAppUserClassificationRuleId(SNAPCHAT),
    });

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    result = classifyWithStoredRules(context, repository.allRules());
    expect(result).toEqual({
      classification: ActivityClassification.PRODUCTIVE,
      source: ClassificationSource.USER_RULE,
      matchedRuleId: deriveAppUserClassificationRuleId(SNAPCHAT),
    });

    await appClassification.clearClassification(SNAPCHAT);
    result = classifyWithStoredRules(context, repository.allRules());
    expect(result).toEqual({
      classification: ActivityClassification.UNKNOWN,
      source: ClassificationSource.UNKNOWN,
    });
  });

  it('matches package rules regardless of displayName', async () => {
    const repository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repository);
    await appClassification.setClassification(
      LINKEDIN,
      ActivityClassification.PRODUCTIVE,
    );
    const rules = repository.allRules();

    for (const displayName of ['LinkedIn', 'LinkedIn Beta', undefined]) {
      const result = classifier.classify(
        {
          app: {
            packageName: LINKEDIN,
            ...(displayName !== undefined ? { displayName } : {}),
          },
          platform: Platform.LINKEDIN,
          contentType: ContentType.UNKNOWN,
        },
        rules,
      );
      expect(result.classification).toBe(ActivityClassification.PRODUCTIVE);
      expect(result.source).toBe(ClassificationSource.USER_RULE);
    }

    const differentPackage = classifier.classify(
      {
        app: { packageName: 'com.other.linkedin', displayName: 'LinkedIn' },
        platform: Platform.OTHER,
        contentType: ContentType.UNKNOWN,
      },
      rules,
    );
    expect(differentPackage.classification).toBe(
      ActivityClassification.UNKNOWN,
    );
  });

  it('matches package rules regardless of Platform on context', async () => {
    const repository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repository);
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    const rules = repository.allRules();

    for (const platform of [Platform.OTHER, Platform.LINKEDIN]) {
      const result = classifier.classify(
        snapchatContext(undefined, platform),
        rules,
      );
      expect(result.classification).toBe(ActivityClassification.WASTE);
    }
  });

  it('does not mutate usage sessions when rules change', async () => {
    const ruleRepository = new InMemoryClassificationRuleRepository();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const appClassification = new AppUserClassification(ruleRepository);

    const session: UsageSession = {
      id: 'session-1',
      app: { packageName: SNAPCHAT },
      platform: Platform.OTHER,
      startTime: 100,
      endTime: 200,
      durationMs: 100,
      contentType: ContentType.UNKNOWN,
      classification: ActivityClassification.UNKNOWN,
      classificationSource: ClassificationSource.UNKNOWN,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    };
    await sessionRepository.save(session);
    const before = sessionRepository.allSessions()[0];

    const saveSpy = jest.spyOn(sessionRepository, 'save');
    const saveManySpy = jest.spyOn(sessionRepository, 'saveMany');
    const saveManyReconcileSpy = jest.spyOn(
      sessionRepository,
      'saveManyWithOpeningReconciliation',
    );

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    await appClassification.clearClassification(SNAPCHAT);

    const after = sessionRepository.allSessions()[0];
    expect(after).toEqual(before);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(saveManySpy).not.toHaveBeenCalled();
    expect(saveManyReconcileSpy).not.toHaveBeenCalled();
  });
});
