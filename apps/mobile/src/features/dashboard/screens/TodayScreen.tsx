import { useCallback, useEffect, useState } from 'react';
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
import type { TodayAppBreakdownItem } from '../../../application/models/TodayAppBreakdownItem';
import type { TodayDashboardModel } from '../../../application/models/TodayDashboardModel';
import type { ExplicitActivityClassification } from '../../../domain/classification/appUserClassificationRule';
import { TodayAppClassificationChooserModal } from '../components/TodayAppClassificationChooserModal';
import { ClassificationRow } from '../../../shared/components/ClassificationRow';
import { MetricCard, MetricCardList } from '../../../shared/components/MetricCard';
import { PlatformLostTimeRow } from '../../../shared/components/PlatformLostTimeRow';
import { TodayAppBreakdownRow } from '../../../shared/components/TodayAppBreakdownRow';
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
  onPressAppClassification,
  classifyingPackageName,
}: {
  dashboard: TodayDashboardModel;
  colors: ReturnType<typeof useThemedScreenColors>;
  onPressAppClassification?: (item: TodayAppBreakdownItem) => void;
  classifyingPackageName?: string | null;
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

      <SectionHeader title="Apps" colors={colors} />
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        accessibilityLabel="Today apps breakdown">
        {dashboard.apps.length === 0 ? (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            No app usage recorded yet today.
          </Text>
        ) : (
          dashboard.apps.map(item => (
            <TodayAppBreakdownRow
              key={item.packageName}
              item={item}
              colors={colors}
              onPressClassification={onPressAppClassification}
              classificationMutating={classifyingPackageName === item.packageName}
            />
          ))
        )}
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
  const {
    uiState,
    isRefreshing,
    refreshToday,
    openUsageAccessSettings,
    getExplicitAppClassification,
    setAppClassification,
    clearAppClassification,
    classifyingPackageName,
    classificationMutationError,
    clearClassificationMutationError,
  } = useTodayLiveData();

  const [chooserItem, setChooserItem] = useState<TodayAppBreakdownItem | null>(
    null,
  );
  const [explicitAppClassification, setExplicitAppClassification] =
    useState<ExplicitActivityClassification | null>(null);
  const [loadingExplicitState, setLoadingExplicitState] = useState(false);

  const openClassificationChooser = useCallback(
    (item: TodayAppBreakdownItem) => {
      clearClassificationMutationError();
      setChooserItem(item);
      setExplicitAppClassification(null);
      setLoadingExplicitState(true);
      getExplicitAppClassification(item.packageName)
        .then(rule => {
          setExplicitAppClassification(rule);
        })
        .catch(() => {
          setExplicitAppClassification(null);
        })
        .finally(() => {
          setLoadingExplicitState(false);
        });
    },
    [clearClassificationMutationError, getExplicitAppClassification],
  );

  const closeClassificationChooser = useCallback(() => {
    if (classifyingPackageName != null) {
      return;
    }
    setChooserItem(null);
    setExplicitAppClassification(null);
    setLoadingExplicitState(false);
  }, [classifyingPackageName]);

  const handleSelectClassification = useCallback(
    async (classification: ExplicitActivityClassification) => {
      if (chooserItem == null) {
        return;
      }
      const packageName = chooserItem.packageName;
      const saved = await setAppClassification(packageName, classification);
      if (saved) {
        setChooserItem(current =>
          current?.packageName === packageName ? null : current,
        );
      }
    },
    [chooserItem, setAppClassification],
  );

  const handleClearClassification = useCallback(async () => {
    if (chooserItem == null) {
      return;
    }
    const packageName = chooserItem.packageName;
    const cleared = await clearAppClassification(packageName);
    if (cleared) {
      setChooserItem(current =>
        current?.packageName === packageName ? null : current,
      );
    }
  }, [chooserItem, clearAppClassification]);

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
    <>
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

      {classificationMutationError != null ? (
        <View style={styles.statusBlock}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {classificationMutationError}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={clearClassificationMutationError}>
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      ) : null}

      {uiState.phase === 'empty' ? (
        <>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            No app usage recorded yet today on this device.
          </Text>
          <TodayDashboardContent
            dashboard={uiState.dashboard}
            colors={colors}
            onPressAppClassification={
              uiState.dashboard.apps.length > 0 ? openClassificationChooser : undefined
            }
            classifyingPackageName={classifyingPackageName}
          />
        </>
      ) : null}

      {uiState.phase === 'success' ? (
        <TodayDashboardContent
          dashboard={uiState.dashboard}
          colors={colors}
          onPressAppClassification={openClassificationChooser}
          classifyingPackageName={classifyingPackageName}
        />
      ) : null}
    </ScreenScaffold>
    <TodayAppClassificationChooserModal
      visible={chooserItem != null}
      item={chooserItem}
      explicitAppClassification={explicitAppClassification}
      loadingExplicitState={loadingExplicitState}
      mutating={classifyingPackageName === chooserItem?.packageName}
      colors={colors}
      onSelect={classification => {
        handleSelectClassification(classification).catch(() => {});
      }}
      onClear={() => {
        handleClearClassification().catch(() => {});
      }}
      onCancel={closeClassificationChooser}
    />
    </>
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
