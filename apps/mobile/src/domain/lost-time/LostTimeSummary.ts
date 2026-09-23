import { ContentType } from '../classification/ContentType';
import { Platform } from '../platform/Platform';

/** Aggregated lost-time metrics from {@link DefaultLostTimeCalculator}. */
export interface LostTimeSummary {
  totalLostMs: number;
  sessionCount: number;
  byPlatform: Partial<Record<Platform, number>>;
  byContentType: Partial<Record<ContentType, number>>;
}
