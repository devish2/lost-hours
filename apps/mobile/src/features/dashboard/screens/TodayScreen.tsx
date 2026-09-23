import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ClassificationRow } from '../../../shared/components/ClassificationRow';
import { MetricCard, MetricCardList } from '../../../shared/components/MetricCard';
import { PlatformLostTimeRow } from '../../../shared/components/PlatformLostTimeRow';
import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatDuration } from '../../../shared/utils/formatDuration';
import { getPlatformDisplayName } from '../../../shared/utils/platformDisplayName';
import { getDemoTodayDashboard } from '../demo/getDemoTodayDashboard';

const CLASSIFICATION_ROWS = [
  { key: 'productive', label: 'Productive' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'leisure', label: 'Leisure' },
  { key: 'lost', label: 'Lost' },
  { key: 'unknown', label: 'Unknown' },
] as const;

export function TodayScreen() {
  const colors = useThemedScreenColors();
  const dashboard = useMemo(() => getDemoTodayDashboard(), []);

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
    <ScreenScaffold scroll>
      <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
        Today
      </Text>
      <Text style={[styles.previewBadge, { color: colors.textMuted }]}>
        Preview data
      </Text>

      <MetricCardList>
        <MetricCard
          emphasized
          colors={colors}
          label="Lost Hours"
          value={lostHoursFormatted}
          subtitle="Time classified as waste today"
          accessibilityLabel={`Lost Hours, ${lostHoursFormatted}, time classified as waste today`}
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
        {dashboard.lostByPlatform.map(entry => (
          <PlatformLostTimeRow
            key={entry.platform}
            platformName={getPlatformDisplayName(entry.platform)}
            formattedDuration={formatDuration(entry.lostMs)}
            colors={colors}
          />
        ))}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewBadge: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  panel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
});
