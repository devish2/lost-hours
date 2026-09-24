export type TodayDashboardRefreshErrorCode =
  | 'PERMISSION_REQUIRED'
  | 'TRACKING_UNAVAILABLE'
  | 'SYNC_FAILED'
  | 'QUERY_FAILED'
  | 'ANALYTICS_FAILED';

export class TodayDashboardRefreshError extends Error {
  readonly code: TodayDashboardRefreshErrorCode;

  constructor(
    code: TodayDashboardRefreshErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'TodayDashboardRefreshError';
    this.code = code;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
