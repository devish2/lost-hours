import { Platform } from '../platform/Platform';
import type { AppIdentity } from '../usage/AppIdentity';
import { ContentType } from './ContentType';

/** Normalized facts supplied to the classifier (no duration or platform APIs). */
export interface ClassificationContext {
  app: AppIdentity;
  platform: Platform;
  contentType: ContentType;
}
