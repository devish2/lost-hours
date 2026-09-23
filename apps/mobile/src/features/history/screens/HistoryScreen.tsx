import { StyleSheet, Text, View } from 'react-native';

import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';

export function HistoryScreen() {
  const colors = useThemedScreenColors();

  return (
    <ScreenScaffold scroll>
      <Text style={[styles.title, { color: colors.textPrimary }]}>History</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Your daily Lost Hours history will appear here once tracking starts.
      </Text>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        Possible future metrics
      </Text>
      <View style={[styles.list, { borderColor: colors.border }]}>
        {['Daily tracked time', 'Lost Hours', 'Classification breakdown'].map(
          item => (
            <Text
              key={item}
              style={[styles.listItem, { color: colors.textSecondary }]}>
              {item}
            </Text>
          ),
        )}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 28,
  },
});
