import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../domain/classification/ClassificationSource';
import { applyEffectiveClassificationToUsageSessions } from '../classification/applyEffectiveClassificationToUsageSessions';
import { DefaultUsageSessionBuilder } from '../../domain/session/DefaultUsageSessionBuilder';
import { createUsageEvent } from '../../domain/testSupport/createUsageEvent';
import { UsageEventType } from '../../domain/usage/UsageEventType';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from '../../infrastructure/storage/testSupport/InMemoryUsageSessionRepository';
import { AppUserClassification } from '../use-cases/AppUserClassification';
import { CollectUsageSessions } from '../use-cases/CollectUsageSessions';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import { GetTodayDashboard } from '../queries/GetTodayDashboard';
import { SyncUsageSessions } from '../use-cases/SyncUsageSessions';
import { clipUsageSessionsToWindow } from '../../domain/session/clipUsageSessionsToWindow';
import { ruleBasedActivityClassifier } from '../../domain/classification/RuleBasedActivityClassifier';

describe('Day 3 sync idempotency regression (D3.11)', () => {
  it('repeated sync + effective classification does not multiply totals', async () => {
    const events = [
      createUsageEvent({
        timestamp: 1_000,
        eventType: UsageEventType.FOREGROUND,
        app: { packageName: 'com.example.app' },
      }),
      createUsageEvent({
        timestamp: 4_000,
        eventType: UsageEventType.BACKGROUND,
        app: { packageName: 'com.example.app' },
      }),
    ];
    const port: UsageEventsPort = {
      getUsageEvents: jest.fn(async () => events),
    };
    const sessionRepository = new InMemoryUsageSessionRepository();
    const ruleRepository = new InMemoryClassificationRuleRepository();
    const sync = new SyncUsageSessions(
      new CollectUsageSessions(port, new DefaultUsageSessionBuilder()),
      sessionRepository,
    );
    const appClassification = new AppUserClassification(ruleRepository);
    await appClassification.setClassification(
      'com.example.app',
      ActivityClassification.WASTE,
    );

    for (let i = 0; i < 5; i += 1) {
      await sync.execute(0, 5_000);
    }

    expect(sessionRepository.allSessions()).toHaveLength(1);
    const stored = await new GetUsageSessionsForRange(sessionRepository).execute({
      fromTimestamp: 0,
      toTimestamp: 5_000,
    });
    const clipped = clipUsageSessionsToWindow(stored, 0, 5_000);
    const rules = await ruleRepository.findEnabled();
    const effective = applyEffectiveClassificationToUsageSessions(
      clipped,
      rules,
      ruleBasedActivityClassifier,
    );
    const dashboard = new GetTodayDashboard().execute('2024-01-01', effective);
    expect(dashboard.totalTrackedMs).toBe(3_000);
    expect(dashboard.totalLostMs).toBe(3_000);
    expect(stored[0]?.classification).toBe(ActivityClassification.UNKNOWN);
    expect(stored[0]?.classificationSource).toBe(ClassificationSource.UNKNOWN);
  });
});
