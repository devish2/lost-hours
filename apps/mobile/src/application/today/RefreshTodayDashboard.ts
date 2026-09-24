import { GetTodayDashboard } from '../queries/GetTodayDashboard';
import { GetUsageSessionsForRange } from '../queries/GetUsageSessionsForRange';
import type { TodayDashboardModel } from '../models/TodayDashboardModel';
import { clipUsageSessionsToWindow } from '../../domain/session/clipUsageSessionsToWindow';
import type { Clock } from '../../shared/time/Clock';
import {
  getElapsedLocalDayWindow,
  getLocalCalendarDateString,
} from '../../shared/time/localCalendarDay';
import type { SyncUsageSessions } from '../use-cases/SyncUsageSessions';
import { TodayDashboardRefreshError } from './TodayDashboardRefreshError';

export type RefreshTodayDashboardResult =
  | {
      kind: 'success';
      dashboard: TodayDashboardModel;
    }
  | {
      kind: 'empty';
      dashboard: TodayDashboardModel;
    }
  | {
      kind: 'zero_window';
      dashboard: TodayDashboardModel;
    };

export type RefreshTodayDashboardDeps = {
  syncUsageSessions: SyncUsageSessions;
  getUsageSessionsForRange: GetUsageSessionsForRange;
  getTodayDashboard?: GetTodayDashboard;
  clock: Clock;
};

function emptyDashboardForDate(date: string): TodayDashboardModel {
  return {
    date,
    totalTrackedMs: 0,
    totalLostMs: 0,
    productiveMs: 0,
    neutralMs: 0,
    leisureMs: 0,
    wasteMs: 0,
    unknownMs: 0,
    lostSessionCount: 0,
    lostByPlatform: [],
  };
}

/** Sync → SQLite read → clip → existing Today analytics (no demo fallback). */
export class RefreshTodayDashboard {
  private readonly getTodayDashboard: GetTodayDashboard;

  constructor(private readonly deps: RefreshTodayDashboardDeps) {
    this.getTodayDashboard =
      deps.getTodayDashboard ?? new GetTodayDashboard();
  }

  async execute(): Promise<RefreshTodayDashboardResult> {
    const nowMs = this.deps.clock.now();
    const window = getElapsedLocalDayWindow(nowMs);
    if (window == null) {
      return {
        kind: 'zero_window',
        dashboard: emptyDashboardForDate(getLocalCalendarDateString(nowMs)),
      };
    }

    try {
      await this.deps.syncUsageSessions.execute(
        window.fromTimestamp,
        window.toTimestamp,
      );
    } catch (error) {
      throw new TodayDashboardRefreshError(
        'SYNC_FAILED',
        'Could not sync usage sessions',
        error,
      );
    }

    let storedSessions;
    try {
      storedSessions = await this.deps.getUsageSessionsForRange.execute({
        fromTimestamp: window.fromTimestamp,
        toTimestamp: window.toTimestamp,
      });
    } catch (error) {
      throw new TodayDashboardRefreshError(
        'QUERY_FAILED',
        'Could not read stored usage sessions',
        error,
      );
    }

    const clippedSessions = clipUsageSessionsToWindow(
      storedSessions,
      window.fromTimestamp,
      window.toTimestamp,
    );

    let dashboard;
    try {
      dashboard = this.getTodayDashboard.execute(
        window.date,
        clippedSessions,
      );
    } catch (error) {
      throw new TodayDashboardRefreshError(
        'ANALYTICS_FAILED',
        'Could not calculate Today dashboard',
        error,
      );
    }

    if (clippedSessions.length === 0) {
      return { kind: 'empty', dashboard };
    }

    return { kind: 'success', dashboard };
  }
}
