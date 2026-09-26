import { StyleSheet, Text, View } from 'react-native';

import type { BaselineProgress } from '../../../domain/baseline/BaselineProgress';
import type { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';

type HistoryBaselineBannerProps = {
  baseline: BaselineProgress;
  colors: ReturnType<typeof useThemedScreenColors>;
};

export function HistoryBaselineBanner({
  baseline,
  colors,
}: HistoryBaselineBannerProps) {
  const isReady = baseline.status === 'READY';

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      accessibilityRole="summary">
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {isReady ? 'Baseline ready' : 'Learning your routine'}
      </Text>
      <Text style={[styles.metric, { color: colors.textSecondary }]}>
        {isReady
          ? `${baseline.observedCalendarDays} observed days`
          : `${baseline.observedCalendarDays} of ${baseline.targetCalendarDays} observed days`}
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        {isReady
          ? 'Your first Time Receipt will be available when that feature ships.'
          : 'Your first Time Receipt will be available after enough activity has been observed.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  metric: {
    fontSize: 15,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
