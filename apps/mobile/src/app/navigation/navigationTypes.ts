import type { NavigatorScreenParams } from '@react-navigation/native';

import { MainTabRoutes, RootRoutes } from './routeNames';

export type MainTabParamList = {
  [MainTabRoutes.Today]: undefined;
  [MainTabRoutes.History]: undefined;
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
