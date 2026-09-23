import type { ClassificationRuleRepository } from '../../../domain/repositories/ClassificationRuleRepository';
import type { DailyUsageSummaryRepository } from '../../../domain/repositories/DailyUsageSummaryRepository';
import type { UsageSessionRepository } from '../../../domain/repositories/UsageSessionRepository';
import type { SqlExecutor } from './database/SqlExecutor';
import { SQLiteClassificationRuleRepository } from './repositories/SQLiteClassificationRuleRepository';
import { SQLiteDailyUsageSummaryRepository } from './repositories/SQLiteDailyUsageSummaryRepository';
import { SQLiteUsageSessionRepository } from './repositories/SQLiteUsageSessionRepository';

export interface SqliteRepositories {
  usageSessions: UsageSessionRepository;
  classificationRules: ClassificationRuleRepository;
  dailyUsageSummaries: DailyUsageSummaryRepository;
}

export function createSqliteRepositories(db: SqlExecutor): SqliteRepositories {
  return {
    usageSessions: new SQLiteUsageSessionRepository(db),
    classificationRules: new SQLiteClassificationRuleRepository(db),
    dailyUsageSummaries: new SQLiteDailyUsageSummaryRepository(db),
  };
}
