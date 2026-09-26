import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HistoricalDayDetailLiveDataProvider } from '../../../app/providers/HistoricalDayDetailLiveDataProvider';
import type { HistoryStackParamList } from '../../../app/navigation/navigationTypes';
import { HistoryRoutes } from '../../../app/navigation/routeNames';
import { HistoricalDayDetailScreen } from './HistoricalDayDetailScreen';

type Props = NativeStackScreenProps<
  HistoryStackParamList,
  typeof HistoryRoutes.DayDetail
>;

/** Mounts Day Detail provider for a single dayStartTimestamp route param. */
export function HistoricalDayDetailRouteScreen({ route }: Props) {
  const { dayStartTimestamp } = route.params;

  return (
    <HistoricalDayDetailLiveDataProvider dayStartTimestamp={dayStartTimestamp}>
      <HistoricalDayDetailScreen />
    </HistoricalDayDetailLiveDataProvider>
  );
}
