import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useHistoryLiveData } from '../../../app/providers/HistoryLiveDataProvider';
import type { HistoryStackParamList } from '../../../app/navigation/navigationTypes';
import { HistoryRoutes } from '../../../app/navigation/routeNames';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatHistoryDayLabel } from '../../../shared/utils/formatHistoryDayLabel';
import { HistoryBaselineBanner } from '../components/HistoryBaselineBanner';
import { HistoryDayRow } from '../components/HistoryDayRow';

export function HistoryScreen() {
  const colors = useThemedScreenColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const { uiState, isRefreshing, refreshHistory, nowTimestamp } =
    useHistoryLiveData();

  if (uiState.phase === 'loading') {
    return (
      <ScreenScaffold>
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Loading History" />
        </View>
      </ScreenScaffold>
    );
  }

  if (uiState.phase === 'error') {
    return (
      <ScreenScaffold>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          History
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {uiState.message}
        </Text>
        <PrimaryButton
          label="Retry"
          onPress={refreshHistory}
          accessibilityLabel="Retry loading History"
        />
      </ScreenScaffold>
    );
  }

  const model = uiState.model;
  const isEmpty = uiState.phase === 'empty';

  return (
    <ScreenScaffold
      scroll
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshHistory} />
      }>
      <Text style={[styles.title, { color: colors.textPrimary }]}>History</Text>

      <HistoryBaselineBanner baseline={model.baseline} colors={colors} />

      {isEmpty ? (
        <View style={styles.emptyBlock}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No usage history yet
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Lost Hours will show your observed days here as usage data is
            collected.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          {model.days.map(day => (
            <HistoryDayRow
              key={day.dayStartTimestamp}
              label={formatHistoryDayLabel(nowTimestamp, day.dayStartTimestamp)}
              day={day}
              colors={colors}
              onPress={() =>
                navigation.navigate(HistoryRoutes.DayDetail, {
                  dayStartTimestamp: day.dayStartTimestamp,
                })
              }
            />
          ))}
        </View>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyBlock: {
    marginTop: 8,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
