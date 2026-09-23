import { Platform } from '../platform/Platform';
import { ActivityClassification } from './ActivityClassification';
import { ClassificationSource } from './ClassificationSource';
import { ContentType } from './ContentType';

/** Configurable mapping input for classification (resolution not implemented here). */
export interface ClassificationRule {
  id: string;
  platform?: Platform;
  contentType?: ContentType;
  packageName?: string;
  classification: ActivityClassification;
  source: ClassificationSource;
  priority: number;
  enabled: boolean;
}
