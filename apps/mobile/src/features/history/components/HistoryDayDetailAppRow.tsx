import { StyleSheet, Text, View } from 'react-native';

import type { HistoricalDayAppItem } from '../../../application/models/HistoricalDayDetailModel';
import type { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatActivityClassificationLabel } from '../../../shared/utils/formatActivityClassificationLabel';
import { formatDuration } from '../../../shared/utils/formatDuration';

type HistoryDayDetailAppRowProps = {
  item: HistoricalDayAppItem;
  colors: ReturnType<typeof useThemedScreenColors>;
};

export function HistoryDayDetailAppRow({
  item,
  colors,
}: HistoryDayDetailAppRowProps) {
  const label = item.displayName ?? item.packageName;
  const tracked = formatDuration(item.trackedDurationMs);
  const classificationLabel = formatActivityClassificationLabel(
    item.classification,
    item.hasMixedClassification,
    { wasteLabel: 'Lost' },
  );
  const lost =
    item.lostDurationMs > 0 ? formatDuration(item.lostDurationMs) : null;

  return (
    <View
      style={[styles.row, { borderBottomColor: colors.border }]}
      accessibilityRole="text"
      accessibilityLabel={`${label}, ${tracked}, ${classificationLabel}${
        lost != null ? `, ${lost} lost` : ''
      }`}>
      <View style={styles.labelBlock}>
        <Text style={[styles.appLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.valueBlock}>
        <Text style={[styles.duration, { color: colors.textPrimary }]}>
          {tracked}
        </Text>
        <Text style={[styles.classification, { color: colors.textSecondary }]}>
          {classificationLabel}
        </Text>
        {lost != null ? (
          <Text style={[styles.lost, { color: colors.textMuted }]}>
            {`${lost} lost`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  labelBlock: {
    flex: 1,
  },
  appLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  duration: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  classification: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  lost: {
    fontSize: 12,
  },
});
