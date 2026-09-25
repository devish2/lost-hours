import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TodayAppBreakdownItem } from '../../application/models/TodayAppBreakdownItem';
import type { ThemedScreenColors } from '../styles/useThemedScreenColors';
import { formatActivityClassificationLabel } from '../utils/formatActivityClassificationLabel';
import { formatDuration } from '../utils/formatDuration';

type TodayAppBreakdownRowProps = {
  item: TodayAppBreakdownItem;
  colors: ThemedScreenColors;
  onPressClassification?: (item: TodayAppBreakdownItem) => void;
  classificationMutating?: boolean;
};

export function TodayAppBreakdownRow({
  item,
  colors,
  onPressClassification,
  classificationMutating = false,
}: TodayAppBreakdownRowProps) {
  const label = item.displayName ?? item.packageName;
  const classificationLabel = formatActivityClassificationLabel(
    item.classification,
    item.hasMixedClassification,
  );

  const classificationControlLabel = `Change classification for ${label}. Current classification: ${classificationLabel}.`;

  return (
    <View
      testID={`today-app-row:${item.packageName}`}
      style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.labelBlock}>
        <Text style={[styles.appLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.valueBlock}>
        <Text style={[styles.duration, { color: colors.textPrimary }]}>
          {formatDuration(item.trackedDurationMs)}
        </Text>
        {onPressClassification != null ? (
          <Pressable
            testID={`today-app-classification-control:${item.packageName}`}
            accessibilityRole="button"
            accessibilityLabel={classificationControlLabel}
            accessibilityState={{ disabled: classificationMutating }}
            disabled={classificationMutating}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            onPress={() => onPressClassification(item)}
            style={({ pressed }) => [
              styles.classificationControl,
              pressed && !classificationMutating ? styles.controlPressed : undefined,
            ]}>
            {classificationMutating ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={[styles.classification, { color: colors.textSecondary }]}>
                {`${classificationLabel} ▾`}
              </Text>
            )}
          </Pressable>
        ) : (
          <Text style={[styles.classification, { color: colors.textSecondary }]}>
            {classificationLabel}
          </Text>
        )}
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
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  classificationControl: {
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  controlPressed: {
    opacity: 0.7,
  },
});
