import { Platform } from '../platform/Platform';
import { ActivityClassification } from './ActivityClassification';
import {
  APP_USER_CLASSIFICATION_RULE_PRIORITY,
  buildAppUserClassificationRule,
  deriveAppUserClassificationRuleId,
  isAppUserClassificationRule,
} from './appUserClassificationRule';
import { ClassificationSource } from './ClassificationSource';
import { ContentType } from './ContentType';

describe('appUserClassificationRule', () => {
  it('derives stable rule id from packageName', () => {
    expect(deriveAppUserClassificationRuleId('com.snapchat.android')).toBe(
      'user-app:com.snapchat.android',
    );
    expect(
      deriveAppUserClassificationRuleId(' com.snapchat.android '),
    ).toBe('user-app:com.snapchat.android');
  });

  it('builds package-only USER_RULE with default priority', () => {
    const rule = buildAppUserClassificationRule(
      'com.snapchat.android',
      ActivityClassification.WASTE,
    );
    expect(rule).toEqual({
      id: 'user-app:com.snapchat.android',
      packageName: 'com.snapchat.android',
      classification: ActivityClassification.WASTE,
      source: ClassificationSource.USER_RULE,
      priority: APP_USER_CLASSIFICATION_RULE_PRIORITY,
      enabled: true,
    });
  });

  it('identifies app-level USER_RULE rows', () => {
    const appRule = buildAppUserClassificationRule(
      'com.example.app',
      ActivityClassification.NEUTRAL,
    );
    expect(isAppUserClassificationRule(appRule)).toBe(true);

    expect(
      isAppUserClassificationRule({
        ...appRule,
        platform: Platform.OTHER,
      }),
    ).toBe(false);

    expect(
      isAppUserClassificationRule({
        ...appRule,
        contentType: ContentType.UNKNOWN,
      }),
    ).toBe(false);

    expect(
      isAppUserClassificationRule({
        ...appRule,
        id: 'other-id',
      }),
    ).toBe(false);
  });
});
