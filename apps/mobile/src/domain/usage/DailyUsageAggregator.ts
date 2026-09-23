import type { UsageSession } from '../session/UsageSession';
import type { DailyUsageSummary } from './DailyUsageSummary';

export interface DailyUsageAggregator {
  aggregate(date: string, sessions: readonly UsageSession[]): DailyUsageSummary;
}
