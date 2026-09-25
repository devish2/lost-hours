import type { RefreshTodayDashboardResult } from './RefreshTodayDashboard';
import { TodayClassificationMutationError } from './TodayAppClassificationActions';

/** Persists classification change, then refreshes Today through the normal pipeline. */
export async function runTodayAppClassificationMutation(params: {
  persist: () => Promise<void>;
  refreshToday: () => Promise<RefreshTodayDashboardResult>;
}): Promise<RefreshTodayDashboardResult> {
  try {
    await params.persist();
  } catch (error) {
    throw new TodayClassificationMutationError(
      'persist',
      false,
      'Could not save classification. Try again.',
      error,
    );
  }

  try {
    return await params.refreshToday();
  } catch (error) {
    throw new TodayClassificationMutationError(
      'refresh',
      true,
      'Classification was saved, but Today could not refresh. Try refreshing again.',
      error,
    );
  }
}
