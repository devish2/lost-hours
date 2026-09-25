import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { buildAppUserClassificationRule } from '../../domain/classification/appUserClassificationRule';
import { createUsageSession } from '../../domain/testSupport/createUsageSession';
import { applyEffectiveClassificationToUsageSessions } from './applyEffectiveClassificationToUsageSessions';

describe('effective classification persistence boundary (D3.7)', () => {
  it('effective copies override classification; raw persisted values stay UNKNOWN', () => {
    const raw = createUsageSession({
      id: 'raw',
      app: { packageName: 'com.snapchat.android' },
    });
    const [effective] = applyEffectiveClassificationToUsageSessions(
      [raw],
      [
        buildAppUserClassificationRule(
          'com.snapchat.android',
          ActivityClassification.WASTE,
        ),
      ],
    );
    expect(effective.classification).toBe(ActivityClassification.WASTE);
    expect(raw.classification).toBe(ActivityClassification.UNKNOWN);
  });
});
