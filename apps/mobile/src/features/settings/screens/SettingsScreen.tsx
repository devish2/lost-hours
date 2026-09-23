import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';

type SettingsRowProps = {
  title: string;
  detail: string;
  colors: ReturnType<typeof useThemedScreenColors>;
};

function SettingsSection({
  heading,
  colors,
  children,
}: {
  heading: string;
  colors: ReturnType<typeof useThemedScreenColors>;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
        {heading}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ title, detail, colors }: SettingsRowProps) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.rowDetail, { color: colors.textMuted }]}>
        {detail}
      </Text>
    </View>
  );
}

export function SettingsScreen() {
  const colors = useThemedScreenColors();

  return (
    <ScreenScaffold scroll>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Settings
      </Text>

      <SettingsSection heading="Tracking" colors={colors}>
        <SettingsRow
          title="Usage access"
          detail="Not connected"
          colors={colors}
        />
      </SettingsSection>

      <SettingsSection heading="Classification" colors={colors}>
        <SettingsRow title="Custom rules" detail="Coming soon" colors={colors} />
      </SettingsSection>

      <SettingsSection heading="Data & Privacy" colors={colors}>
        <Text style={[styles.privacyCopy, { color: colors.textSecondary }]}>
          Usage data is stored locally on this device.
        </Text>
      </SettingsSection>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  rowDetail: {
    fontSize: 15,
  },
  privacyCopy: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
