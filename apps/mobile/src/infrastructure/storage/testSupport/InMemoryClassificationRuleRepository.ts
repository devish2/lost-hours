import type { ClassificationRule } from '../../../domain/classification/ClassificationRule';
import type { ClassificationRuleRepository } from '../../../domain/repositories/ClassificationRuleRepository';

/** In-memory ClassificationRuleRepository for application/domain tests (D3.4). */
export class InMemoryClassificationRuleRepository
  implements ClassificationRuleRepository
{
  private readonly rules = new Map<string, ClassificationRule>();

  async save(rule: ClassificationRule): Promise<void> {
    this.rules.set(rule.id, { ...rule });
  }

  async saveMany(rules: readonly ClassificationRule[]): Promise<void> {
    for (const rule of rules) {
      await this.save(rule);
    }
  }

  async findById(id: string): Promise<ClassificationRule | null> {
    const rule = this.rules.get(id);
    return rule == null ? null : { ...rule };
  }

  async findAll(): Promise<ClassificationRule[]> {
    return [...this.rules.values()].map(rule => ({ ...rule }));
  }

  async findEnabled(): Promise<ClassificationRule[]> {
    return (await this.findAll()).filter(rule => rule.enabled);
  }

  async deleteById(id: string): Promise<void> {
    this.rules.delete(id);
  }

  /** Test helper: snapshot of stored rules. */
  allRules(): ClassificationRule[] {
    return [...this.rules.values()].map(rule => ({ ...rule }));
  }
}
