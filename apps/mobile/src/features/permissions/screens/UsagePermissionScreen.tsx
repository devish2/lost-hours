import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboardingStateRepository } from '../../../app/providers/OnboardingStateContext';
import { useUsageTrackingComposition } from '../../../app/providers/UsageTrackingContext';
import { RootRoutes } from '../../../app/navigation/routeNames';
import type { RootStackParamList } from '../../../app/navigation/navigationTypes';
import { PrimaryButton } from '../../../shared/components/PrimaryButton';
import { ScreenScaffold } from '../../../shared/components/ScreenScaffold';
import { useThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { PERMISSION_CHECK_ERROR_MESSAGE } from '../usagePermissionFlow';
import { useUsagePermissionFlow } from '../useUsagePermissionFlow';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof RootRoutes.UsagePermission
>;

export function UsagePermissionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemedScreenColors();
  const composition = useUsageTrackingComposition();
  const onboardingRepository = useOnboardingStateRepository();
  const {
    uiPhase,
    errorMessage,
    isOpeningSettings,
    refreshPermissionStatus,
    openSettings,
    continueToMain,
    canContinue,
  } = useUsagePermissionFlow({
    composition,
    markOnboardingCompleted: () =>
      onboardingRepository.markOnboardingCompleted(),
    onNavigateToMain: () => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: RootRoutes.Main }],
        }),
      );
    },
  });

  const showOpenSettings =
    uiPhase === 'denied' || uiPhase === 'unknown' || uiPhase === 'error';
  const showRetry =
    uiPhase === 'unknown' || uiPhase === 'error' || uiPhase === 'unavailable';

  return (
    <ScreenScaffold centered>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Usage Access
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Lost Hours needs Usage Access to measure how much time you spend in
          apps on this device. Tracking stays on this device. Granting access
          does not identify Reels, Shorts, or other in-app content—you can
          change or revoke access anytime in Android Settings.
        </Text>

        {uiPhase === 'loading' ? (
          <View style={styles.statusRow}>
            <ActivityIndicator accessibilityLabel="Checking Usage Access" />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Checking Usage Access…
            </Text>
          </View>
        ) : null}

        {uiPhase === 'granted' ? (
          <Text
            style={[styles.statusText, styles.statusGranted, { color: colors.textPrimary }]}>
            Usage Access is enabled. You can continue to Lost Hours.
          </Text>
        ) : null}

        {uiPhase === 'denied' ? (
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Usage Access is off. Open Settings and enable Lost Hours under Usage
            access.
          </Text>
        ) : null}

        {uiPhase === 'unknown' ? (
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            We could not confirm Usage Access. Retry, or open Settings to verify.
          </Text>
        ) : null}

        {uiPhase === 'error' ? (
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {errorMessage ?? PERMISSION_CHECK_ERROR_MESSAGE}
          </Text>
        ) : null}

        {uiPhase === 'unavailable' ? (
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Usage tracking is not available in this build. Reinstall the Android
            app or contact support if this continues.
          </Text>
        ) : null}

        {uiPhase === 'unsupported' ? (
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Usage Access is required on Android. This platform does not support
            Android Usage Access settings.
          </Text>
        ) : null}

        {isOpeningSettings ? (
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Opening Settings…
          </Text>
        ) : null}

        {showOpenSettings ? (
          <PrimaryButton
            label="Open Settings"
            accessibilityLabel="Open Android Usage Access settings"
            disabled={isOpeningSettings || composition.provider == null}
            onPress={openSettings}
          />
        ) : null}

        {showRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry Usage Access check"
            onPress={refreshPermissionStatus}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed ? styles.secondaryActionPressed : undefined,
            ]}>
            <Text style={[styles.secondaryActionLabel, { color: colors.textPrimary }]}>
              Retry
            </Text>
          </Pressable>
        ) : null}

        <PrimaryButton
          label="Continue"
          accessibilityLabel="Continue to main app"
          disabled={!canContinue}
          onPress={() => {
            continueToMain().catch(() => {});
          }}
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
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 21,
  },
  statusGranted: {
    fontWeight: '600',
  },
  secondaryAction: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  secondaryActionPressed: {
    opacity: 0.7,
  },
  secondaryActionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
});
