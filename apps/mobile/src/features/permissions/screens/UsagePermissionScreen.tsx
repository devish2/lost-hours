import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { RootRoutes } from '../../../app/navigation/routeNames';
import type { RootStackParamList } from '../../../app/navigation/navigationTypes';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof RootRoutes.UsagePermission
>;

export function UsagePermissionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemedScreenColors();

  return (
    <ScreenScaffold centered>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Usage Access
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Lost Hours needs Android usage access to measure time in apps. In a
          future release, Continue will open system settings so you can grant
          access.
        </Text>
        <PrimaryButton
          label="Continue"
          accessibilityLabel="Continue to main app preview"
          onPress={() => navigation.navigate(RootRoutes.Main)}
        />
        <Text style={[styles.note, { color: colors.textMuted }]}>
          For now this continues to the preview dashboard. Permission is not
          connected yet.
        </Text>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
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
  note: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
