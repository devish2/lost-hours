import type { ExplicitActivityClassification } from '../../domain/classification/appUserClassificationRule';
import type { RefreshTodayDashboardResult } from './RefreshTodayDashboard';

/** Presentation-facing app classification mutations for Today (D3.10). */
export interface TodayAppClassificationActions {
  getExplicitAppClassification(
    packageName: string,
  ): Promise<ExplicitActivityClassification | null>;

  setClassification(
    packageName: string,
    classification: ExplicitActivityClassification,
  ): Promise<RefreshTodayDashboardResult>;

  clearClassification(
    packageName: string,
  ): Promise<RefreshTodayDashboardResult>;
}

export class TodayClassificationMutationError extends Error {
  readonly stage: 'persist' | 'refresh';
  readonly rulePersisted: boolean;

  constructor(
    stage: 'persist' | 'refresh',
    rulePersisted: boolean,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'TodayClassificationMutationError';
    this.stage = stage;
    this.rulePersisted = rulePersisted;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
