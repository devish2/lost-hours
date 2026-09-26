import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TodayScreen } from '../../features/dashboard/screens/TodayScreen';
import { HistoryStackNavigator } from './HistoryStackNavigator';
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
        component={HistoryStackNavigator}
        options={{ title: 'History', headerShown: false }}
      />
      <Tab.Screen
        name={MainTabRoutes.Settings}
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
