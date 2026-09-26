import type { HistoricalDayDetailModel } from '../../application/models/HistoricalDayDetailModel';

export type HistoricalDayDetailUiState =
  | { phase: 'loading' }
  | { phase: 'empty'; model: HistoricalDayDetailModel }
  | { phase: 'success'; model: HistoricalDayDetailModel }
  | { phase: 'error'; message: string };

export function mapHistoricalDayDetailModelToUiState(
  model: HistoricalDayDetailModel,
): HistoricalDayDetailUiState {
  if (model.trackedDurationMs <= 0 && model.apps.length === 0) {
    return { phase: 'empty', model };
  }
  return { phase: 'success', model };
}
