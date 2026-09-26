import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HistoryScreen } from '../../features/history/screens/HistoryScreen';
import { HistoricalDayDetailRouteScreen } from '../../features/history/screens/HistoricalDayDetailRouteScreen';
import type { HistoryStackParamList } from './navigationTypes';
import { HistoryRoutes } from './routeNames';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={HistoryRoutes.HistoryHome}
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name={HistoryRoutes.DayDetail}
        component={HistoricalDayDetailRouteScreen}
        options={{ title: 'Day' }}
      />
    </Stack.Navigator>
  );
}
