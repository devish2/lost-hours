import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { AppUserClassification } from './AppUserClassification';
import { InMemoryClassificationRuleRepository } from '../../infrastructure/storage/testSupport/InMemoryClassificationRuleRepository';

const SNAPCHAT = 'com.snapchat.android';

describe('AppUserClassification idempotency (D3.11)', () => {
  it('repeated setClassification keeps one rule row', async () => {
    const repository = new InMemoryClassificationRuleRepository();
    const appClassification = new AppUserClassification(repository);

    for (let i = 0; i < 5; i += 1) {
      await appClassification.setClassification(SNAPCHAT, ActivityClassification.WASTE);
    }
    expect(repository.allRules()).toHaveLength(1);

    await appClassification.setClassification(
      SNAPCHAT,
      ActivityClassification.PRODUCTIVE,
    );
    await appClassification.setClassification(SNAPCHAT, ActivityClassification.WASTE);
    expect(repository.allRules()).toHaveLength(1);
    expect(repository.allRules()[0]?.classification).toBe(ActivityClassification.WASTE);
  });
});
