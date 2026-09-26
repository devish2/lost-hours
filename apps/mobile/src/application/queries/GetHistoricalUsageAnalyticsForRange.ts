import { applyEffectiveClassificationToUsageSessions } from '../classification/applyEffectiveClassificationToUsageSessions';
import type { ActivityClassifier } from '../../domain/classification/ActivityClassifier';
import { ruleBasedActivityClassifier } from '../../domain/classification/RuleBasedActivityClassifier';
import type { ClassificationRuleRepository } from '../../domain/repositories/ClassificationRuleRepository';
import { DefaultLostTimeCalculator } from '../../domain/lost-time/DefaultLostTimeCalculator';
import type { LostTimeCalculator } from '../../domain/lost-time/LostTimeCalculator';
import { clipUsageSessionsToWindow } from '../../domain/session/clipUsageSessionsToWindow';
import { DefaultDailyUsageAggregator } from '../../domain/usage/DefaultDailyUsageAggregator';
import type { DailyUsageAggregator } from '../../domain/usage/DailyUsageAggregator';
import type { HistoricalAnalyticsWindow } from '../historical/HistoricalAnalyticsWindow';
import { HistoricalUsageAnalyticsError } from '../historical/HistoricalUsageAnalyticsError';
import type { HistoricalUsageAnalyticsModel } from '../models/HistoricalUsageAnalyticsModel';
import { GetUsageSessionsForRange } from './GetUsageSessionsForRange';

export type GetHistoricalUsageAnalyticsForRangeDeps = {
  getUsageSessionsForRange: GetUsageSessionsForRange;
  classificationRuleRepository: ClassificationRuleRepository;
  activityClassifier?: ActivityClassifier;
  dailyUsageAggregator?: DailyUsageAggregator;
  lostTimeCalculator?: LostTimeCalculator;
};

const HISTORICAL_AGGREGATE_DATE_PLACEHOLDER = 'historical-range';

function emptyHistoricalAnalytics(
  window: HistoricalAnalyticsWindow,
): HistoricalUsageAnalyticsModel {
  return {
    fromTimestamp: window.fromTimestamp,
    toTimestamp: window.toTimestamp,
    trackedDurationMs: 0,
    lostDurationMs: 0,
    productiveDurationMs: 0,
    neutralDurationMs: 0,
    leisureDurationMs: 0,
    unknownDurationMs: 0,
    effectiveSessions: [],
  };
}

/**
 * Read-only historical analytics from persisted sessions (no UsageStats sync).
 */
export class GetHistoricalUsageAnalyticsForRange {
  private readonly activityClassifier: ActivityClassifier;
  private readonly dailyUsageAggregator: DailyUsageAggregator;
  private readonly lostTimeCalculator: LostTimeCalculator;

  constructor(private readonly deps: GetHistoricalUsageAnalyticsForRangeDeps) {
    this.activityClassifier =
      deps.activityClassifier ?? ruleBasedActivityClassifier;
    this.dailyUsageAggregator =
      deps.dailyUsageAggregator ?? new DefaultDailyUsageAggregator();
    this.lostTimeCalculator =
      deps.lostTimeCalculator ?? new DefaultLostTimeCalculator();
  }

  async execute(
    window: HistoricalAnalyticsWindow,
  ): Promise<HistoricalUsageAnalyticsModel> {
    let storedSessions;
    try {
      storedSessions = await this.deps.getUsageSessionsForRange.execute(window);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid session processing window')) {
        throw new HistoricalUsageAnalyticsError(
          'INVALID_WINDOW',
          error.message,
          error,
        );
      }
      throw new HistoricalUsageAnalyticsError(
        'SESSION_QUERY_FAILED',
        'Could not read stored usage sessions for historical range',
        error,
      );
    }

    let clippedSessions;
    try {
      clippedSessions = clipUsageSessionsToWindow(
        storedSessions,
        window.fromTimestamp,
        window.toTimestamp,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid session processing window')) {
        throw new HistoricalUsageAnalyticsError(
          'INVALID_WINDOW',
          error.message,
          error,
        );
      }
      throw new HistoricalUsageAnalyticsError(
        'ANALYTICS_FAILED',
        'Could not clip sessions to historical window',
        error,
      );
    }

    if (clippedSessions.length === 0) {
      return emptyHistoricalAnalytics(window);
    }

    let enabledRules;
    try {
      enabledRules = await this.deps.classificationRuleRepository.findEnabled();
    } catch (error) {
      throw new HistoricalUsageAnalyticsError(
        'RULE_QUERY_FAILED',
        'Could not load classification rules for historical analytics',
        error,
      );
    }

    let effectiveSessions;
    try {
      effectiveSessions = applyEffectiveClassificationToUsageSessions(
        clippedSessions,
        enabledRules,
        this.activityClassifier,
      );
    } catch (error) {
      throw new HistoricalUsageAnalyticsError(
        'ANALYTICS_FAILED',
        'Could not apply effective classification for historical analytics',
        error,
      );
    }

    try {
      const daily = this.dailyUsageAggregator.aggregate(
        HISTORICAL_AGGREGATE_DATE_PLACEHOLDER,
        effectiveSessions,
      );
      const lost = this.lostTimeCalculator.calculate(effectiveSessions);

      return {
        fromTimestamp: window.fromTimestamp,
        toTimestamp: window.toTimestamp,
        trackedDurationMs: daily.totalTrackedMs,
        lostDurationMs: lost.totalLostMs,
        productiveDurationMs: daily.productiveMs,
        neutralDurationMs: daily.neutralMs,
        leisureDurationMs: daily.leisureMs,
        unknownDurationMs: daily.unknownMs,
        effectiveSessions,
      };
    } catch (error) {
      throw new HistoricalUsageAnalyticsError(
        'ANALYTICS_FAILED',
        'Could not calculate historical usage analytics',
        error,
      );
    }
  }
}
