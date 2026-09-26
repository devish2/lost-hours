export type HistoricalDayDetailErrorCode =
  | 'INVALID_DAY'
  | 'SESSION_QUERY_FAILED'
  | 'RULE_QUERY_FAILED'
  | 'ANALYTICS_FAILED';

export class HistoricalDayDetailError extends Error {
  readonly code: HistoricalDayDetailErrorCode;

  constructor(
    code: HistoricalDayDetailErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'HistoricalDayDetailError';
    this.code = code;
  }
}
