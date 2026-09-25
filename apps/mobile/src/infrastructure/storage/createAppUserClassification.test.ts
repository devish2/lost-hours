import { AppUserClassification } from '../../application/use-cases/AppUserClassification';
import { InMemoryClassificationRuleRepository } from './testSupport/InMemoryClassificationRuleRepository';
import { createAppUserClassification } from './createAppUserClassification';

describe('createAppUserClassification', () => {
  it('constructs AppUserClassification from a ClassificationRuleRepository', () => {
    const repository = new InMemoryClassificationRuleRepository();
    const service = createAppUserClassification(repository);
    expect(service).toBeInstanceOf(AppUserClassification);
  });
});
