import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HistoryDayItem } from '../../../application/models/HistoryModel';
import type { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatDuration } from '../../../shared/utils/formatDuration';

type HistoryDayRowProps = {
  label: string;
  day: HistoryDayItem;
  colors: ReturnType<typeof useThemedScreenColors>;
  onPress?: () => void;
};

export function HistoryDayRow({
  label,
  day,
  colors,
  onPress,
}: HistoryDayRowProps) {
  const tracked = formatDuration(day.trackedDurationMs);
  const lost = formatDuration(day.lostDurationMs);

  const content = (
    <>
      <Text style={[styles.date, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>
        {`${tracked} tracked`}
      </Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>
        {`${lost} lost`}
      </Text>
    </>
  );

  if (onPress == null) {
    return (
      <View
        style={[styles.row, { borderColor: colors.border }]}
        accessibilityRole="text"
        accessibilityLabel={`${label}, ${tracked} tracked, ${lost} lost`}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.row, { borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${tracked} tracked, ${lost} lost`}
      onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  date: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  detail: {
    fontSize: 15,
    lineHeight: 22,
  },
});
