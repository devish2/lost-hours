import type { HistoryModel } from '../../application/models/HistoryModel';

export type HistoryUiState =
  | { phase: 'loading' }
  | { phase: 'empty'; model: HistoryModel }
  | { phase: 'success'; model: HistoryModel }
  | { phase: 'error'; message: string };

export function mapHistoryModelToUiState(model: HistoryModel): HistoryUiState {
  if (model.days.length === 0) {
    return { phase: 'empty', model };
  }
  return { phase: 'success', model };
}
