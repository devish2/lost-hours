import { createAppUserClassification } from '../../infrastructure/storage/createAppUserClassification';
import type { ExplicitActivityClassification } from '../../domain/classification/appUserClassificationRule';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import type { TodayAppClassificationActions } from './TodayAppClassificationActions';
import { runTodayAppClassificationMutation } from './runTodayAppClassificationMutation';
import { UsageTrackingCompositionKind } from '../../infrastructure/tracking/UsageTrackingComposition';
import type { UsageTrackingComposition } from '../../infrastructure/tracking/UsageTrackingComposition';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import type { UsageEventsPort } from '../../domain/usage/UsageEventsPort';
import { createSyncUsageSessionsPipeline } from '../../infrastructure/storage/createSyncUsageSessionsPipeline';
import { getAppStorage } from '../../infrastructure/storage/getAppStorage';
import type { Clock } from '../../shared/time/Clock';
import { systemClock } from '../../shared/time/Clock';
import {
  RefreshTodayDashboard,
  type RefreshTodayDashboardResult,
} from './RefreshTodayDashboard';
import { TodayDashboardRefreshError } from './TodayDashboardRefreshError';

export type TodayLiveDashboardServiceDeps = {
  composition: UsageTrackingComposition;
  clock?: Clock;
  getStorage?: typeof getAppStorage;
};

export class TodayLiveDashboardService implements TodayAppClassificationActions {
  private readonly clock: Clock;
  private readonly getStorage: typeof getAppStorage;

  constructor(private readonly deps: TodayLiveDashboardServiceDeps) {
    this.clock = deps.clock ?? systemClock;
    this.getStorage = deps.getStorage ?? getAppStorage;
  }

  async refreshToday(): Promise<RefreshTodayDashboardResult> {
    const eventsPort = await this.resolveEventsPort();

    let storage;
    try {
      storage = await this.getStorage();
    } catch (error) {
      throw new TodayDashboardRefreshError(
        'QUERY_FAILED',
        'Local storage is unavailable',
        error,
      );
    }

    const composition = this.deps.composition;
    const appMetadataPort =
      composition.kind === UsageTrackingCompositionKind.ANDROID_NATIVE
        ? composition.appMetadataPort
        : null;

    const syncUsageSessions = createSyncUsageSessionsPipeline({
      usageEventsPort: eventsPort,
      usageSessionRepository: storage.repositories.usageSessions,
      appMetadataPort,
    });
    const getUsageSessionsForRange = new GetUsageSessionsForRange(
      storage.repositories.usageSessions,
    );

    const refresh = new RefreshTodayDashboard({
      clock: this.clock,
      syncUsageSessions,
      getUsageSessionsForRange,
      classificationRuleRepository: storage.repositories.classificationRules,
    });

    try {
      return await refresh.execute();
    } catch (error) {
      if (error instanceof TodayDashboardRefreshError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Today refresh failed';
      throw new TodayDashboardRefreshError('SYNC_FAILED', message, error);
    }
  }

  async getExplicitAppClassification(
    packageName: string,
  ): Promise<ExplicitActivityClassification | null> {
    const appClassification = await this.resolveAppUserClassification();
    return appClassification.getExplicitAppClassification(packageName);
  }

  async setClassification(
    packageName: string,
    classification: ExplicitActivityClassification,
  ): Promise<RefreshTodayDashboardResult> {
    const appClassification = await this.resolveAppUserClassification();
    return runTodayAppClassificationMutation({
      persist: () =>
        appClassification.setClassification(packageName, classification),
      refreshToday: () => this.refreshToday(),
    });
  }

  async clearClassification(
    packageName: string,
  ): Promise<RefreshTodayDashboardResult> {
    const appClassification = await this.resolveAppUserClassification();
    return runTodayAppClassificationMutation({
      persist: () => appClassification.clearClassification(packageName),
      refreshToday: () => this.refreshToday(),
    });
  }

  async openUsageAccessSettings(): Promise<void> {
    const { composition } = this.deps;
    if (composition.kind !== UsageTrackingCompositionKind.ANDROID_NATIVE) {
      throw new TodayDashboardRefreshError(
        'TRACKING_UNAVAILABLE',
        'Usage Access settings are unavailable on this platform',
      );
    }
    await composition.provider.openPermissionSettings();
  }

  private async resolveAppUserClassification() {
    let storage;
    try {
      storage = await this.getStorage();
    } catch (error) {
      throw new TodayDashboardRefreshError(
        'QUERY_FAILED',
        'Local storage is unavailable',
        error,
      );
    }
    return createAppUserClassification(storage.repositories.classificationRules);
  }

  private async resolveEventsPort(): Promise<UsageEventsPort> {
    const { composition } = this.deps;
    if (composition.kind === UsageTrackingCompositionKind.UNSUPPORTED_PLATFORM) {
      throw new TodayDashboardRefreshError(
        'TRACKING_UNAVAILABLE',
        'Usage tracking is unavailable on this platform',
      );
    }
    if (composition.kind === UsageTrackingCompositionKind.ANDROID_NATIVE_UNAVAILABLE) {
      throw new TodayDashboardRefreshError(
        'TRACKING_UNAVAILABLE',
        'Usage tracking native module is unavailable',
      );
    }

    const provider = composition.provider;
    const status = await provider.getPermissionStatus();
    if (status === UsageTrackingPermissionStatus.DENIED) {
      throw new TodayDashboardRefreshError(
        'PERMISSION_REQUIRED',
        'Usage Access permission is required to load Today',
      );
    }
    if (status === UsageTrackingPermissionStatus.UNKNOWN) {
      throw new TodayDashboardRefreshError(
        'PERMISSION_REQUIRED',
        'Usage Access permission could not be verified',
      );
    }

    return provider;
  }
}
