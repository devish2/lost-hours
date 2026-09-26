import type { ActivityClassification } from '../classification/ActivityClassification';
import type { ClassificationSource } from '../classification/ClassificationSource';
import type { Platform } from '../platform/Platform';

/** Per-app analytics row grouped by packageName (range-independent). */
export interface AppUsageBreakdownItem {
  packageName: string;
  displayName?: string;
  platform: Platform;
  classification?: ActivityClassification;
  classificationSource?: ClassificationSource;
  hasMixedClassification: boolean;
  hasMixedClassificationSource: boolean;
  trackedDurationMs: number;
  lostDurationMs: number;
}
