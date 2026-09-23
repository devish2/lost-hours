import { StyleSheet, Text, View } from 'react-native';

import type { ThemedScreenColors } from '../styles/useThemedScreenColors';

type PlatformLostTimeRowProps = {
  platformName: string;
  formattedDuration: string;
  colors: ThemedScreenColors;
};

export function PlatformLostTimeRow({
  platformName,
  formattedDuration,
  colors,
}: PlatformLostTimeRowProps) {
  return (
    <View
      accessibilityRole="text"
      style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {platformName}
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
