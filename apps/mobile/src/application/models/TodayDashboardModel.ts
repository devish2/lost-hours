import type { Platform } from '../../domain/platform/Platform';

export interface PlatformLostTimeEntry {
  platform: Platform;
  lostMs: number;
}

/** Presentation-ready dashboard snapshot for a single local day. */
export interface TodayDashboardModel {
  date: string;
  totalTrackedMs: number;
  totalLostMs: number;
  productiveMs: number;
  neutralMs: number;
  leisureMs: number;
  wasteMs: number;
  unknownMs: number;
  lostSessionCount: number;
  /** Platforms with lost time > 0, sorted descending by lostMs. */
  lostByPlatform: readonly PlatformLostTimeEntry[];
}
