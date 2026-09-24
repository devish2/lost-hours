import type { TodayDashboardModel } from '../../application/models/TodayDashboardModel';

export type TodayUiPhase =
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'
  | 'permission_required'
  | 'tracking_unavailable';

export type TodayUiState =
  | { phase: 'loading' }
  | { phase: 'success'; dashboard: TodayDashboardModel }
  | { phase: 'empty'; dashboard: TodayDashboardModel }
  | { phase: 'error'; message: string }
  | { phase: 'permission_required'; message: string }
  | { phase: 'tracking_unavailable'; message: string };

export function mapRefreshResultToUiState(
  result: import('../../application/today/RefreshTodayDashboard').RefreshTodayDashboardResult,
): TodayUiState {
  if (result.kind === 'success') {
    return { phase: 'success', dashboard: result.dashboard };
  }
  return { phase: 'empty', dashboard: result.dashboard };
}
