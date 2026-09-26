import type { BaselineProgress } from './BaselineProgress';

/**
 * MVP first Time Receipt gate: enough observed calendar days (baseline READY).
 * Future eligibility may add requirements; keep callers on this helper.
 */
export function isFirstTimeReceiptEligible(
  progress: BaselineProgress,
): boolean {
  return progress.status === 'READY';
}
