import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import {
  APP_USER_CLASSIFICATION_RULE_PRIORITY,
  deriveAppUserClassificationRuleId,
} from '../../domain/classification/appUserClassificationRule';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { ContentType } from '../../domain/classification/ContentType';
import { Platform } from '../../domain/platform/Platform';
import { TrackingSource } from '../../domain/usage/TrackingSource';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import { SQLiteClassificationRuleRepository } from '../../infrastructure/storage/sqlite/repositories/SQLiteClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { createMockClassificationRuleSqlExecutor } from '../../infrastructure/storage/testSupport/createMockClassificationRuleSqlExecutor';

const SNAPCHAT = 'com.snapchat.android';
const LINKEDIN = 'com.linkedin.android';

function createProductionRuleRepository() {
  const mock = createMockClassificationRuleSqlExecutor();
  return {
    repository: new SQLiteClassificationRuleRepository(mock.executor),
    mock,
  };
}

function createAppClassification(repository: SQLiteClassificationRuleRepository) {
  return createAppUserClassification(repository);
}

describe('appUserClassification SQLite persistence (D3.5)', () => {
  it('persists set → get → reclassify → clear across recreated repository instances', async () => {
    const mock = createMockClassificationRuleSqlExecutor();
    const firstRepo = new SQLiteClassificationRuleRepository(mock.executor);
    const appClassification = createAppClassification(firstRepo);

    expect(await appClassification.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.UNKNOWN,
    );

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );

    const ruleId = deriveAppUserClassificationRuleId(SNAPCHAT);
    const stored = mock.getRow(ruleId);
    expect(stored).toMatchObject({
      id: ruleId,
      package_name: SNAPCHAT,
      classification: ActivityClassification.WASTE,
      source: ClassificationSource.USER_RULE,
      enabled: 1,
      platform: null,
      content_type: null,
    });
    expect(mock.rowCount()).toBe(1);

    const secondRepo = new SQLiteClassificationRuleRepository(mock.executor);
    const reloaded = createAppClassification(secondRepo);
    expect(await reloaded.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.WASTE,
    );

    await reloaded.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    expect(mock.rowCount()).toBe(1);
    expect(mock.getRow(ruleId)?.classification).toBe(
      ActivityClassification.PRODUCTIVE,
    );

    await reloaded.clearClassification(SNAPCHAT);
    expect(await reloaded.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.UNKNOWN,
    );
    expect(mock.getRow(ruleId)).toBeUndefined();
    expect(await secondRepo.findById(ruleId)).toBeNull();
  });

  it('upserts idempotently for repeated setClassification calls', async () => {
    const { repository, mock } = createProductionRuleRepository();
    const appClassification = createAppClassification(repository);

    for (let index = 0; index < 5; index += 1) {
      await appClassification.setClassification(
        SNAPCHAT,
        ActivityClassification.WASTE,
      );
    }
    expect(mock.rowCount()).toBe(1);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    expect(mock.rowCount()).toBe(1);
  });

  it('normalizes packageName before persistence', async () => {
    const { repository, mock } = createProductionRuleRepository();
    const appClassification = createAppClassification(repository);

    await appClassification.setClassification(
      `  ${LINKEDIN}  `,
      ActivityClassification.PRODUCTIVE,
    );

    const ruleId = deriveAppUserClassificationRuleId(LINKEDIN);
    expect(mock.getRow(ruleId)).toMatchObject({
      id: ruleId,
      package_name: LINKEDIN,
      classification: ActivityClassification.PRODUCTIVE,
    });
  });

  it('round-trips app USER_RULE fields with null platform and contentType', async () => {
    const { repository } = createProductionRuleRepository();
    const appClassification = createAppClassification(repository);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.LEISURE,
    );
    const rule = await repository.findById(
      deriveAppUserClassificationRuleId(SNAPCHAT),
    );
    expect(rule).toEqual({
      id: deriveAppUserClassificationRuleId(SNAPCHAT),
      packageName: SNAPCHAT,
      classification: ActivityClassification.LEISURE,
      source: ClassificationSource.USER_RULE,
      priority: APP_USER_CLASSIFICATION_RULE_PRIORITY,
      enabled: true,
    });
  });

  it('lists only enabled package-only USER_RULE rows sorted by packageName', async () => {
    const { repository, mock } = createProductionRuleRepository();
    const appClassification = createAppClassification(repository);

    await appClassification.setClassification(
      'com.whatsapp',
      ActivityClassification.NEUTRAL,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );

    mock.insertRowDirect({
      id: 'system-ig',
      platform: Platform.INSTAGRAM,
      classification: ActivityClassification.LEISURE,
      source: ClassificationSource.SYSTEM_DEFAULT,
      priority: 0,
      enabled: true,
    });
    mock.insertRowDirect({
      id: 'inferred-reels',
      contentType: ContentType.REELS,
      classification: ActivityClassification.WASTE,
      source: ClassificationSource.INFERRED,
      priority: 0,
      enabled: true,
    });
    mock.insertRowDirect({
      id: deriveAppUserClassificationRuleId('com.disabled.app'),
      packageName: 'com.disabled.app',
      classification: ActivityClassification.WASTE,
      source: ClassificationSource.USER_RULE,
      priority: APP_USER_CLASSIFICATION_RULE_PRIORITY,
      enabled: false,
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

  it('does not mutate persisted usage sessions when classification rules change', async () => {
    const { repository: ruleRepository, mock } =
      createProductionRuleRepository();
    const sessionRepository = new InMemoryUsageSessionRepository();
    const appClassification = createAppUserClassification(ruleRepository);
    const saveManySpy = jest.spyOn(
      sessionRepository,
      'saveManyWithOpeningReconciliation',
    );

    const session = createUsageSession({
      id: 'session-1',
      app: { packageName: SNAPCHAT },
      startTime: 100,
      endTime: 200,
      durationMs: 100,
      trackingSource: TrackingSource.ANDROID_USAGE_STATS,
    });
    await sessionRepository.save(session);
    const before = sessionRepository.allSessions()[0];

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.WASTE,
    );
    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    await appClassification.clearClassification(SNAPCHAT);

    expect(sessionRepository.allSessions()[0]).toEqual(before);
    expect(saveManySpy).not.toHaveBeenCalled();
    expect(mock.rowCount()).toBe(0);
  });

  it('surfaces repository write failures without converting to UNKNOWN', async () => {
    const { repository, mock } = createProductionRuleRepository();
    const appClassification = createAppClassification(repository);
    mock.failNextUpsert();

    await expect(
      appClassification.setClassification(
        SNAPCHAT,
        ActivityClassification.WASTE,
      ),
    ).rejects.toThrow(/sqlite execute failed/);
    expect(await appClassification.getClassification(SNAPCHAT)).toBe(
      ActivityClassification.UNKNOWN,
    );
  });
});
