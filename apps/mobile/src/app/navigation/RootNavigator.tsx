import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WelcomeScreen } from '../../features/onboarding/screens/WelcomeScreen';
import { UsagePermissionScreen } from '../../features/permissions/screens/UsagePermissionScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './navigationTypes';
import { RootRoutes } from './routeNames';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Initial route is Welcome until onboarding completion persistence exists.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={RootRoutes.Welcome}
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name={RootRoutes.Welcome} component={WelcomeScreen} />
      <Stack.Screen
        name={RootRoutes.UsagePermission}
        component={UsagePermissionScreen}
      />
      <Stack.Screen name={RootRoutes.Main} component={MainTabNavigator} />
    </Stack.Navigator>
  );
}
