import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { deriveAppUserClassificationRuleId } from '../../domain/classification/appUserClassificationRule';
import { Platform } from '../../domain/platform/Platform';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { AppUserClassification } from '../use-cases/AppUserClassification';
import { aggregateTodayUsageByApp } from '../today/aggregateTodayUsageByApp';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';

describe('display name vs classification identity (D3.12)', () => {
  it('uses displayName for row title while classification rules stay package-keyed', async () => {
    const repo = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repo);
    const packageName = 'com.snapchat.android';

    await appClassification.setClassification(packageName, ActivityClassification.WASTE);
    expect(deriveAppUserClassificationRuleId(packageName)).toContain(packageName);

    const rows = aggregateTodayUsageByApp([
      createUsageSession({
        id: 'snap',
        app: { packageName, displayName: 'Snapchat' },
        platform: Platform.OTHER,
        classification: ActivityClassification.WASTE,
        durationMs: 60_000,
      }),
    ]);
    expect(rows[0]?.displayName).toBe('Snapchat');
    expect(rows[0]?.packageName).toBe(packageName);

    const rowsFallback = aggregateTodayUsageByApp([
      createUsageSession({
        id: 'snap2',
        app: { packageName },
        durationMs: 60_000,
      }),
    ]);
    expect(rowsFallback[0]?.displayName).toBeUndefined();
  });
});
