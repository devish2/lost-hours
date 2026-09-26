export type HistoryErrorCode =
  | 'INVALID_WINDOW'
  | 'BASELINE_QUERY_FAILED'
  | 'HISTORICAL_QUERY_FAILED';

export class HistoryError extends Error {
  readonly code: HistoryErrorCode;

  constructor(code: HistoryErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'HistoryError';
    this.code = code;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
