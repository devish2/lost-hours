import { ActivityClassification } from '../classification/ActivityClassification';
import { ClassificationSource } from '../classification/ClassificationSource';
import { ContentType } from '../classification/ContentType';
import { Platform } from '../platform/Platform';
import type { AppIdentity } from '../usage/AppIdentity';
import { TrackingSource } from '../usage/TrackingSource';

/** Normalized user activity over a time range (epoch milliseconds). */
export interface UsageSession {
  id: string;
  app: AppIdentity;
  platform: Platform;
  startTime: number;
  endTime: number;
  durationMs: number;
  contentType: ContentType;
  classification: ActivityClassification;
  classificationSource: ClassificationSource;
  trackingSource: TrackingSource;
  /** Confidence in an inferred classification; intended range 0..1. */
  classificationConfidence?: number;
}
