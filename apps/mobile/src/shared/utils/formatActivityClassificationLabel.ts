import { ActivityClassification } from '../../domain/classification/ActivityClassification';

/** Neutral presentation labels for effective activity classification. */
export function formatActivityClassificationLabel(
  classification: ActivityClassification | undefined,
  hasMixedClassification: boolean,
): string {
  if (hasMixedClassification) {
    return 'Mixed';
  }
  switch (classification) {
    case ActivityClassification.PRODUCTIVE:
      return 'Productive';
    case ActivityClassification.NEUTRAL:
      return 'Neutral';
    case ActivityClassification.LEISURE:
      return 'Leisure';
    case ActivityClassification.WASTE:
      return 'Waste';
    case ActivityClassification.UNKNOWN:
    default:
      return 'Unknown';
  }
}
