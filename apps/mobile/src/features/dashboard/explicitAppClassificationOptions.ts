import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import type { ExplicitActivityClassification } from '../../domain/classification/appUserClassificationRule';

export type ExplicitAppClassificationOption = {
  classification: ExplicitActivityClassification;
  label: string;
  accessibilityLabel: string;
};

export const EXPLICIT_APP_CLASSIFICATION_OPTIONS: readonly ExplicitAppClassificationOption[] =
  [
    {
      classification: ActivityClassification.PRODUCTIVE,
      label: 'Productive',
      accessibilityLabel: 'Set classification to Productive',
    },
    {
      classification: ActivityClassification.NEUTRAL,
      label: 'Neutral',
      accessibilityLabel: 'Set classification to Neutral',
    },
    {
      classification: ActivityClassification.LEISURE,
      label: 'Leisure',
      accessibilityLabel: 'Set classification to Leisure',
    },
    {
      classification: ActivityClassification.WASTE,
      label: 'Waste',
      accessibilityLabel: 'Set classification to Waste',
    },
  ];
