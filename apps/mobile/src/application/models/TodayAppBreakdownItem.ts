import type { ActivityClassification } from '../../domain/classification/ActivityClassification';
import type { ClassificationSource } from '../../domain/classification/ClassificationSource';
import type { Platform } from '../../domain/platform/Platform';

/** Read-only per-app Today analytics row (grouped by Android packageName). */
export interface TodayAppBreakdownItem {
  packageName: string;
  displayName?: string;
  platform: Platform;
  /** Present when all effective sessions for the package share one classification. */
  classification?: ActivityClassification;
  /** Present when all effective sessions share one classification source. */
  classificationSource?: ClassificationSource;
  hasMixedClassification: boolean;
  hasMixedClassificationSource: boolean;
  trackedDurationMs: number;
  lostDurationMs: number;
}
