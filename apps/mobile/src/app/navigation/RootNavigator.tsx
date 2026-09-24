import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AppBootstrapDestination } from '../../application/bootstrap/AppBootstrapDestination';
import { WelcomeScreen } from '../../features/onboarding/screens/WelcomeScreen';
import { UsagePermissionScreen } from '../../features/permissions/screens/UsagePermissionScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './navigationTypes';
import { rootDestinationToRoute } from './rootDestinationToRoute';
import { RootRoutes } from './routeNames';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  initialDestination: AppBootstrapDestination;
};

/** Mount only after bootstrap resolves to avoid Welcome/Main flash. */
export function RootNavigator({ initialDestination }: RootNavigatorProps) {
  const initialRouteName = rootDestinationToRoute(initialDestination);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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
