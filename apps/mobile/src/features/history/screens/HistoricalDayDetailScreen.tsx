import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useHistoricalDayDetailLiveData } from '../../../app/providers/HistoricalDayDetailLiveDataProvider';
import { ClassificationRow } from '../../../shared/components/ClassificationRow';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatDuration } from '../../../shared/utils/formatDuration';
import { formatHistoricalDayDetailTitle } from '../../../shared/utils/formatHistoricalDayDetailTitle';
import { HistoryDayDetailAppRow } from '../components/HistoryDayDetailAppRow';

const CLASSIFICATION_ROWS = [
  { key: 'productive', label: 'Productive' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'leisure', label: 'Leisure' },
  { key: 'lost', label: 'Lost' },
  { key: 'unknown', label: 'Unknown' },
] as const;

export function HistoricalDayDetailScreen() {
  const colors = useThemedScreenColors();
  const { uiState, isRefreshing, refreshDayDetail, nowTimestamp } =
    useHistoricalDayDetailLiveData();

  if (uiState.phase === 'loading') {
    return (
      <ScreenScaffold>
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Loading day detail" />
        </View>
      </ScreenScaffold>
    );
  }

  if (uiState.phase === 'error') {
    return (
      <ScreenScaffold>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {uiState.message}
        </Text>
        <PrimaryButton
          label="Retry"
          onPress={refreshDayDetail}
          accessibilityLabel="Retry loading day detail"
        />
      </ScreenScaffold>
    );
  }

  const model = uiState.model;
  const title = formatHistoricalDayDetailTitle(
    model.dayStartTimestamp,
    nowTimestamp,
  );
  const isEmpty = uiState.phase === 'empty';

  const classificationValues: Record<
    (typeof CLASSIFICATION_ROWS)[number]['key'],
    string
  > = {
    productive: formatDuration(model.productiveDurationMs),
    neutral: formatDuration(model.neutralDurationMs),
    leisure: formatDuration(model.leisureDurationMs),
    lost: formatDuration(model.lostDurationMs),
    unknown: formatDuration(model.unknownDurationMs),
  };

  return (
    <ScreenScaffold
      scroll
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshDayDetail} />
      }>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      {isEmpty ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          No usage recorded for this day
        </Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>
              {`${formatDuration(model.trackedDurationMs)} tracked`}
            </Text>
            <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>
              {`${formatDuration(model.lostDurationMs)} lost`}
            </Text>
          </View>

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
            ]}>
            {model.apps.map(item => (
              <HistoryDayDetailAppRow
                key={item.packageName}
                item={item}
                colors={colors}
              />
            ))}
          </View>
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  summary: {
    marginBottom: 20,
    gap: 4,
  },
  summaryLine: {
    fontSize: 17,
    fontWeight: '600',
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
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
