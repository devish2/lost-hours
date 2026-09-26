import type { NavigatorScreenParams } from '@react-navigation/native';

import { HistoryRoutes, MainTabRoutes, RootRoutes } from './routeNames';

export type HistoryStackParamList = {
  [HistoryRoutes.HistoryHome]: undefined;
  [HistoryRoutes.DayDetail]: { dayStartTimestamp: number };
};

export type MainTabParamList = {
  [MainTabRoutes.Today]: undefined;
  [MainTabRoutes.History]: NavigatorScreenParams<HistoryStackParamList>;
  [MainTabRoutes.Settings]: undefined;
};

export type RootStackParamList = {
  [RootRoutes.Welcome]: undefined;
  [RootRoutes.UsagePermission]: undefined;
  [RootRoutes.Main]: NavigatorScreenParams<MainTabParamList> | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
