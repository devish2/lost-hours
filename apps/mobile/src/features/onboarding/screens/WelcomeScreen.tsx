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
  typeof RootRoutes.Welcome
>;

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemedScreenColors();

  return (
    <ScreenScaffold centered>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Lost Hours
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Understand where your digital time actually goes.
        </Text>
        <PrimaryButton
          label="Get Started"
          accessibilityLabel="Get started"
          onPress={() => navigation.navigate(RootRoutes.UsagePermission)}
        />
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
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
  },
});
