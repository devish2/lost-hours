import { createGetBaselineProgress } from './createGetBaselineProgress';
import { InMemoryUsageSessionRepository } from './testSupport/InMemoryUsageSessionRepository';

describe('createGetBaselineProgress', () => {
  it('wires usage session repository into baseline query', async () => {
    const query = createGetBaselineProgress({
      usageSessions: new InMemoryUsageSessionRepository(),
    });
    const result = await query.execute();
    expect(result.status).toBe('COLLECTING');
    expect(result.observedCalendarDays).toBe(0);
  });
});
