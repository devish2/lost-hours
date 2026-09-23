import type { ClassificationRule } from '../classification/ClassificationRule';

export interface ClassificationRuleRepository {
  save(rule: ClassificationRule): Promise<void>;
  saveMany(rules: readonly ClassificationRule[]): Promise<void>;
  findById(id: string): Promise<ClassificationRule | null>;
  findAll(): Promise<ClassificationRule[]>;
  findEnabled(): Promise<ClassificationRule[]>;
  deleteById(id: string): Promise<void>;
}
