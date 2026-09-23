import { StyleSheet, Text, View } from 'react-native';

import type { ThemedScreenColors } from '../styles/useThemedScreenColors';

type SectionHeaderProps = {
  title: string;
  colors: ThemedScreenColors;
};

export function SectionHeader({ title, colors }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
