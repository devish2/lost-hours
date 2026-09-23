import { GetTodayDashboard } from '../../../application/queries/GetTodayDashboard';
import type { TodayDashboardModel } from '../../../application/models/TodayDashboardModel';
import { DEMO_DASHBOARD_DATE } from './demoConstants';
import { createDemoUsageSessions } from './createDemoUsageSessions';

const getTodayDashboard = new GetTodayDashboard();

export function getDemoTodayDashboard(): TodayDashboardModel {
  return getTodayDashboard.execute(
    DEMO_DASHBOARD_DATE,
    createDemoUsageSessions(),
  );
}
