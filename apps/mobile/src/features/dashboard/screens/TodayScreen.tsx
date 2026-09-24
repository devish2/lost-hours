import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { useTodayLiveData } from '../../../app/providers/TodayLiveDataProvider';
import type { TodayDashboardModel } from '../../../application/models/TodayDashboardModel';
import { ClassificationRow } from '../../../shared/components/ClassificationRow';
import { MetricCard, MetricCardList } from '../../../shared/components/MetricCard';
import { PlatformLostTimeRow } from '../../../shared/components/PlatformLostTimeRow';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatDuration } from '../../../shared/utils/formatDuration';
import { getPlatformDisplayName } from '../../../shared/utils/platformDisplayName';

const CLASSIFICATION_ROWS = [
  { key: 'productive', label: 'Productive' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'leisure', label: 'Leisure' },
  { key: 'lost', label: 'Lost' },
  { key: 'unknown', label: 'Unknown' },
] as const;

function TodayDashboardContent({
  dashboard,
  colors,
}: {
  dashboard: TodayDashboardModel;
  colors: ReturnType<typeof useThemedScreenColors>;
}) {
  const classificationValues: Record<
    (typeof CLASSIFICATION_ROWS)[number]['key'],
    string
  > = {
    productive: formatDuration(dashboard.productiveMs),
    neutral: formatDuration(dashboard.neutralMs),
    leisure: formatDuration(dashboard.leisureMs),
    lost: formatDuration(dashboard.wasteMs),
    unknown: formatDuration(dashboard.unknownMs),
  };

  const lostHoursFormatted = formatDuration(dashboard.totalLostMs);
  const trackedFormatted = formatDuration(dashboard.totalTrackedMs);

  return (
    <>
      <MetricCardList>
        <MetricCard
          emphasized
          colors={colors}
          label="Lost Hours"
          value={lostHoursFormatted}
          subtitle="Only WASTE classification counts as Lost Time"
          accessibilityLabel={`Lost Hours, ${lostHoursFormatted}`}
        />
        <MetricCard
          colors={colors}
          label="Total Tracked"
          value={trackedFormatted}
        />
      </MetricCardList>

      <SectionHeader title="Classification" colors={colors} />
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        {CLASSIFICATION_ROWS.map(row => (
          <ClassificationRow
            key={row.key}
            label={row.label}
            formattedDuration={classificationValues[row.key]}
            colors={colors}
          />
        ))}
      </View>

      <SectionHeader title="Lost by platform" colors={colors} />
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        {dashboard.lostByPlatform.length === 0 ? (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            No Lost Time recorded yet (UNKNOWN sessions do not count).
          </Text>
        ) : (
          dashboard.lostByPlatform.map(entry => (
            <PlatformLostTimeRow
              key={entry.platform}
              platformName={getPlatformDisplayName(entry.platform)}
              formattedDuration={formatDuration(entry.lostMs)}
              colors={colors}
            />
          ))
        )}
      </View>
    </>
  );
}

export function TodayScreen() {
  const colors = useThemedScreenColors();
  const isFocused = useIsFocused();
  const { uiState, isRefreshing, refreshToday, openUsageAccessSettings } =
    useTodayLiveData();

  useFocusEffect(
    useCallback(() => {
      refreshToday();
    }, [refreshToday]),
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshToday();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [isFocused, refreshToday]);

  const refreshControl = (
    <RefreshControl refreshing={isRefreshing} onRefresh={refreshToday} />
  );

  return (
    <ScreenScaffold scroll refreshControl={refreshControl}>
      <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
        Today
      </Text>

      {uiState.phase === 'loading' ? (
        <View style={styles.statusRow}>
          <ActivityIndicator accessibilityLabel="Loading Today dashboard" />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Loading usage from this device…
          </Text>
        </View>
      ) : null}

      {uiState.phase === 'permission_required' ? (
        <View style={styles.statusBlock}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {uiState.message}
          </Text>
          <PrimaryButton
            label="Open Usage Access Settings"
            accessibilityLabel="Open Usage Access settings"
            onPress={openUsageAccessSettings}
          />
          <Pressable accessibilityRole="button" onPress={refreshToday}>
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {uiState.phase === 'tracking_unavailable' ? (
        <View style={styles.statusBlock}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {uiState.message}
          </Text>
          <Pressable accessibilityRole="button" onPress={refreshToday}>
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {uiState.phase === 'error' ? (
        <View style={styles.statusBlock}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {uiState.message}
          </Text>
          <Pressable accessibilityRole="button" onPress={refreshToday}>
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {uiState.phase === 'empty' ? (
        <>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            No app usage recorded yet today on this device.
          </Text>
          <TodayDashboardContent dashboard={uiState.dashboard} colors={colors} />
        </>
      ) : null}

      {uiState.phase === 'success' ? (
        <TodayDashboardContent dashboard={uiState.dashboard} colors={colors} />
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusBlock: {
    gap: 12,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 15,
    lineHeight: 21,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
  },
  panel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
});
