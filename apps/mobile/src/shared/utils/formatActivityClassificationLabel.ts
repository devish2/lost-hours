import { ActivityClassification } from '../../domain/classification/ActivityClassification';

export type FormatActivityClassificationLabelOptions = {
  /** Day Detail and receipts use "Lost" for WASTE; Today keeps "Waste". */
  wasteLabel?: 'Waste' | 'Lost';
};

/** Neutral presentation labels for effective activity classification. */
export function formatActivityClassificationLabel(
  classification: ActivityClassification | undefined,
  hasMixedClassification: boolean,
  options: FormatActivityClassificationLabelOptions = {},
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
      return options.wasteLabel === 'Lost' ? 'Lost' : 'Waste';
    case ActivityClassification.UNKNOWN:
    default:
      return 'Unknown';
  }
}
