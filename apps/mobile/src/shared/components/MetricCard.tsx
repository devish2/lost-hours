import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemedScreenColors } from '../styles/useThemedScreenColors';

type MetricCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  colors: ThemedScreenColors;
  emphasized?: boolean;
  accessibilityLabel?: string;
};

export function MetricCard({
  label,
  value,
  subtitle,
  colors,
  emphasized = false,
  accessibilityLabel,
}: MetricCardProps) {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? `${label}, ${value}`}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        emphasized ? styles.emphasized : undefined,
      ]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          emphasized ? styles.valueLarge : styles.value,
          { color: emphasized ? colors.heroAccent : colors.textPrimary },
        ]}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

type MetricCardListProps = {
  children: ReactNode;
};

export function MetricCardList({ children }: MetricCardListProps) {
  return <View style={styles.list}>{children}</View>;
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  emphasized: {
    paddingVertical: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  valueLarge: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
});
