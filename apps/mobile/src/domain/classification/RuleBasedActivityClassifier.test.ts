import { Platform } from '../platform/Platform';
import { ActivityClassification } from './ActivityClassification';
import { ClassificationSource } from './ClassificationSource';
import type { ClassificationContext } from './ClassificationContext';
import type { ClassificationRule } from './ClassificationRule';
import { ContentType } from './ContentType';
import { RuleBasedActivityClassifier } from './RuleBasedActivityClassifier';

const classifier = new RuleBasedActivityClassifier();

const baseContext: ClassificationContext = {
  app: { packageName: 'com.instagram.android', displayName: 'Instagram' },
  platform: Platform.INSTAGRAM,
  contentType: ContentType.REELS,
};

function rule(
  overrides: Partial<ClassificationRule> & Pick<ClassificationRule, 'id'>,
): ClassificationRule {
  return {
    classification: ActivityClassification.NEUTRAL,
    source: ClassificationSource.SYSTEM_DEFAULT,
    priority: 0,
    enabled: true,
    ...overrides,
  };
}

describe('RuleBasedActivityClassifier', () => {
  it('returns UNKNOWN when there are no rules', () => {
    const result = classifier.classify(baseContext, []);
    expect(result).toEqual({
      classification: ActivityClassification.UNKNOWN,
      source: ClassificationSource.UNKNOWN,
    });
    expect(result.matchedRuleId).toBeUndefined();
  });

  it('returns UNKNOWN when no rule matches', () => {
    const rules = [
      rule({
        id: 'youtube-only',
        platform: Platform.YOUTUBE,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.classification).toBe(ActivityClassification.UNKNOWN);
    expect(result.source).toBe(ClassificationSource.UNKNOWN);
  });

  it('ignores disabled rules', () => {
    const rules = [
      rule({
        id: 'disabled',
        platform: Platform.INSTAGRAM,
        classification: ActivityClassification.WASTE,
        enabled: false,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.classification).toBe(ActivityClassification.UNKNOWN);
  });

  it('matches a platform-only rule', () => {
    const rules = [
      rule({
        id: 'ig-platform',
        platform: Platform.INSTAGRAM,
        classification: ActivityClassification.LEISURE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result).toMatchObject({
      classification: ActivityClassification.LEISURE,
      source: ClassificationSource.SYSTEM_DEFAULT,
      matchedRuleId: 'ig-platform',
    });
  });

  it('matches a content-type-only rule', () => {
    const rules = [
      rule({
        id: 'reels-only',
        contentType: ContentType.REELS,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('reels-only');
    expect(result.classification).toBe(ActivityClassification.WASTE);
  });

  it('matches a package-only rule', () => {
    const rules = [
      rule({
        id: 'pkg',
        packageName: 'com.instagram.android',
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('pkg');
  });

  it('requires all specified matchers on a multi-field rule', () => {
    const rules = [
      rule({
        id: 'triple',
        platform: Platform.INSTAGRAM,
        contentType: ContentType.REELS,
        packageName: 'com.instagram.android',
        classification: ActivityClassification.NEUTRAL,
      }),
      rule({
        id: 'wrong-pkg',
        platform: Platform.INSTAGRAM,
        contentType: ContentType.REELS,
        packageName: 'com.other.app',
        classification: ActivityClassification.WASTE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('triple');
  });

  it('ignores rules with no matcher fields', () => {
    const rules = [
      rule({
        id: 'empty-matchers',
        classification: ActivityClassification.WASTE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.classification).toBe(ActivityClassification.UNKNOWN);
  });

  it('prefers USER_OVERRIDE over USER_RULE when both match', () => {
    const rules = [
      rule({
        id: 'user-rule',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.USER_RULE,
        priority: 100,
        classification: ActivityClassification.WASTE,
      }),
      rule({
        id: 'user-override',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.USER_OVERRIDE,
        priority: 1,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('user-override');
    expect(result.classification).toBe(ActivityClassification.PRODUCTIVE);
  });

  it('prefers USER_RULE over SYSTEM_DEFAULT when both match', () => {
    const rules = [
      rule({
        id: 'system',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 500,
        classification: ActivityClassification.WASTE,
      }),
      rule({
        id: 'user',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.USER_RULE,
        priority: 0,
        classification: ActivityClassification.NEUTRAL,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('user');
  });

  it('prefers SYSTEM_DEFAULT over INFERRED when both match', () => {
    const rules = [
      rule({
        id: 'inferred',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.INFERRED,
        priority: 999,
        classification: ActivityClassification.WASTE,
      }),
      rule({
        id: 'system',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 0,
        classification: ActivityClassification.LEISURE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('system');
  });

  it('applies source precedence before numeric priority', () => {
    const rules = [
      rule({
        id: 'system-high-priority',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 999,
        classification: ActivityClassification.WASTE,
      }),
      rule({
        id: 'override-low-priority',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.USER_OVERRIDE,
        priority: 1,
        classification: ActivityClassification.PRODUCTIVE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('override-low-priority');
  });

  it('uses higher numeric priority when source is equal', () => {
    const rules = [
      rule({
        id: 'low',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 1,
        classification: ActivityClassification.NEUTRAL,
      }),
      rule({
        id: 'high',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 50,
        classification: ActivityClassification.LEISURE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('high');
  });

  it('prefers more specific rules when source and priority are equal', () => {
    const rules = [
      rule({
        id: 'platform-only',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 10,
        classification: ActivityClassification.NEUTRAL,
      }),
      rule({
        id: 'platform-and-type',
        platform: Platform.INSTAGRAM,
        contentType: ContentType.REELS,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 10,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('platform-and-type');
  });

  it('breaks ties with ascending lexical rule id', () => {
    const rules = [
      rule({
        id: 'rule-b',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 10,
        classification: ActivityClassification.WASTE,
      }),
      rule({
        id: 'rule-a',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.SYSTEM_DEFAULT,
        priority: 10,
        classification: ActivityClassification.LEISURE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('rule-a');
  });

  it('produces the same result regardless of rule array order', () => {
    const rulesA = [
      rule({
        id: 'first',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.USER_RULE,
        priority: 5,
        classification: ActivityClassification.NEUTRAL,
      }),
      rule({
        id: 'second',
        platform: Platform.INSTAGRAM,
        contentType: ContentType.REELS,
        source: ClassificationSource.USER_RULE,
        priority: 5,
        classification: ActivityClassification.WASTE,
      }),
    ];
    const rulesB = [...rulesA].reverse();
    expect(classifier.classify(baseContext, rulesA)).toEqual(
      classifier.classify(baseContext, rulesB),
    );
    expect(classifier.classify(baseContext, rulesA).matchedRuleId).toBe(
      'second',
    );
  });

  it('does not mutate the rules array or rule objects', () => {
    const rules = [
      rule({
        id: 'mutable-check',
        platform: Platform.INSTAGRAM,
        classification: ActivityClassification.NEUTRAL,
      }),
    ];
    const snapshot = JSON.stringify(rules);
    classifier.classify(baseContext, rules);
    expect(JSON.stringify(rules)).toBe(snapshot);
  });

  it('does not mutate the classification context', () => {
    const context: ClassificationContext = {
      app: { packageName: 'com.example.app' },
      platform: Platform.OTHER,
      contentType: ContentType.UNKNOWN,
    };
    const snapshot = JSON.stringify(context);
    classifier.classify(context, [
      rule({
        id: 'pkg',
        packageName: 'com.example.app',
        classification: ActivityClassification.NEUTRAL,
      }),
    ]);
    expect(JSON.stringify(context)).toBe(snapshot);
  });

  it('ranks UNKNOWN source lowest among matching rules', () => {
    const rules = [
      rule({
        id: 'unknown-source',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.UNKNOWN,
        priority: 1000,
        classification: ActivityClassification.WASTE,
      }),
      rule({
        id: 'inferred',
        platform: Platform.INSTAGRAM,
        source: ClassificationSource.INFERRED,
        priority: 0,
        classification: ActivityClassification.LEISURE,
      }),
    ];
    const result = classifier.classify(baseContext, rules);
    expect(result.matchedRuleId).toBe('inferred');
  });

  it('includes matchedRuleId when a rule wins', () => {
    const result = classifier.classify(baseContext, [
      rule({
        id: 'winner-id',
        contentType: ContentType.REELS,
        classification: ActivityClassification.NEUTRAL,
      }),
    ]);
    expect(result.matchedRuleId).toBe('winner-id');
  });
});
