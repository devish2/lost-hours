import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HistoryScreen } from '../../features/history/screens/HistoryScreen';
import { TodayScreen } from '../../features/dashboard/screens/TodayScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import type { MainTabParamList } from './navigationTypes';
import { MainTabRoutes } from './routeNames';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={MainTabRoutes.Today}
      screenOptions={{
        headerShown: true,
      }}>
      <Tab.Screen
        name={MainTabRoutes.Today}
        component={TodayScreen}
        options={{ title: 'Today' }}
      />
      <Tab.Screen
        name={MainTabRoutes.History}
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name={MainTabRoutes.Settings}
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
