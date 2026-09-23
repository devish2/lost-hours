import { StyleSheet, Text, View } from 'react-native';

import type { ThemedScreenColors } from '../styles/useThemedScreenColors';

type ClassificationRowProps = {
  label: string;
  formattedDuration: string;
  colors: ThemedScreenColors;
};

export function ClassificationRow({
  label,
  formattedDuration,
  colors,
}: ClassificationRowProps) {
  return (
    <View
      accessibilityRole="text"
      style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {formattedDuration}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
