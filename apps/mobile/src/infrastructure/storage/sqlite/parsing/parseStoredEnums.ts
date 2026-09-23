import { ActivityClassification } from '../../../../domain/classification/ActivityClassification';
import { ClassificationSource } from '../../../../domain/classification/ClassificationSource';
import { ContentType } from '../../../../domain/classification/ContentType';
import { Platform } from '../../../../domain/platform/Platform';
import { TrackingSource } from '../../../../domain/usage/TrackingSource';

function parseEnumValue<T extends string>(
  value: unknown,
  enumName: string,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${enumName} value in database: ${String(value)}`);
  }
  if (!allowed.includes(value as T)) {
    throw new Error(`Invalid ${enumName} value in database: ${value}`);
  }
  return value as T;
}

export function parsePlatform(value: unknown): Platform {
  return parseEnumValue(value, 'Platform', Object.values(Platform));
}

export function parseContentType(value: unknown): ContentType {
  return parseEnumValue(value, 'ContentType', Object.values(ContentType));
}

export function parseActivityClassification(value: unknown): ActivityClassification {
  return parseEnumValue(
    value,
    'ActivityClassification',
    Object.values(ActivityClassification),
  );
}

export function parseClassificationSource(value: unknown): ClassificationSource {
  return parseEnumValue(
    value,
    'ClassificationSource',
    Object.values(ClassificationSource),
  );
}

export function parseTrackingSource(value: unknown): TrackingSource {
  return parseEnumValue(value, 'TrackingSource', Object.values(TrackingSource));
}
