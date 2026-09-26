export type BaselineProgressErrorCode = 'SESSION_QUERY_FAILED';

export class BaselineProgressError extends Error {
  readonly code: BaselineProgressErrorCode;

  constructor(
    code: BaselineProgressErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'BaselineProgressError';
    this.code = code;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
