import { ActivityClassification } from '../../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../../domain/classification/ClassificationSource';
import { ContentType } from '../../../../domain/classification/ContentType';
import { Platform } from '../../../../domain/platform/Platform';
import {
  classificationRuleRowToDomain,
  classificationRuleToInsertParams,
} from './ClassificationRuleMapper';
import type { ClassificationRuleRow } from './rows';

describe('ClassificationRuleMapper', () => {
  it('round-trips a full rule', () => {
    const createdAt = 100;
    const updatedAt = 200;
    const params = classificationRuleToInsertParams(
      {
        id: 'rule-1',
        platform: Platform.INSTAGRAM,
        contentType: ContentType.REELS,
        packageName: 'com.instagram.android',
        classification: ActivityClassification.WASTE,
        source: ClassificationSource.USER_OVERRIDE,
        priority: 10,
        enabled: true,
      },
      createdAt,
      updatedAt,
    );

    const row: ClassificationRuleRow = {
      id: params[0] as string,
      platform: params[1] as string,
      content_type: params[2] as string,
      package_name: params[3] as string,
      classification: params[4] as string,
      source: params[5] as string,
      priority: params[6] as number,
      enabled: params[7] as number,
      created_at: params[8] as number,
      updated_at: params[9] as number,
    };

    expect(classificationRuleRowToDomain(row)).toEqual({
      id: 'rule-1',
      platform: Platform.INSTAGRAM,
      contentType: ContentType.REELS,
      packageName: 'com.instagram.android',
      classification: ActivityClassification.WASTE,
      source: ClassificationSource.USER_OVERRIDE,
      priority: 10,
      enabled: true,
    });
  });

  it('maps optional fields and enabled flag', () => {
    const row: ClassificationRuleRow = {
      id: 'sparse',
      platform: null,
      content_type: null,
      package_name: null,
      classification: ActivityClassification.NEUTRAL,
      source: ClassificationSource.SYSTEM_DEFAULT,
      priority: 0,
      enabled: 0,
      created_at: 1,
      updated_at: 2,
    };

    expect(classificationRuleRowToDomain(row)).toEqual({
      id: 'sparse',
      classification: ActivityClassification.NEUTRAL,
      source: ClassificationSource.SYSTEM_DEFAULT,
      priority: 0,
      enabled: false,
    });
  });
});
