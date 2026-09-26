import { createGetHistoricalUsageAnalyticsForRange } from './createGetHistoricalUsageAnalyticsForRange';
import { InMemoryClassificationRuleRepository } from './testSupport/InMemoryClassificationRuleRepository';
import { InMemoryUsageSessionRepository } from './testSupport/InMemoryUsageSessionRepository';

describe('createGetHistoricalUsageAnalyticsForRange', () => {
  it('wires repositories into a read-only historical query', async () => {
    const query = createGetHistoricalUsageAnalyticsForRange({
      usageSessions: new InMemoryUsageSessionRepository(),
      classificationRules: new InMemoryClassificationRuleRepository(),
    });
    const result = await query.execute({
      fromTimestamp: 0,
      toTimestamp: 86_400_000,
    });
    expect(result.trackedDurationMs).toBe(0);
  });
});
