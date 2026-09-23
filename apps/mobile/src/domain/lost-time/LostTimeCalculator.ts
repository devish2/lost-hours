import type { UsageSession } from '../session/UsageSession';
import type { LostTimeSummary } from './LostTimeSummary';

export interface LostTimeCalculator {
  calculate(sessions: readonly UsageSession[]): LostTimeSummary;
}
