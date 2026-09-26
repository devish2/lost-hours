export type HistoricalUsageAnalyticsErrorCode =
  | 'INVALID_WINDOW'
  | 'SESSION_QUERY_FAILED'
  | 'RULE_QUERY_FAILED'
  | 'ANALYTICS_FAILED';

export class HistoricalUsageAnalyticsError extends Error {
  readonly code: HistoricalUsageAnalyticsErrorCode;

  constructor(
    code: HistoricalUsageAnalyticsErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'HistoricalUsageAnalyticsError';
    this.code = code;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
