import { NavigationContainer } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingStateProvider } from './OnboardingStateContext';
import { HistoryLiveDataProvider } from './HistoryLiveDataProvider';
import { TodayLiveDataProvider } from './TodayLiveDataProvider';
import { UsageTrackingProvider } from './UsageTrackingContext';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <OnboardingStateProvider>
          <UsageTrackingProvider>
            <TodayLiveDataProvider>
              <HistoryLiveDataProvider>
                <NavigationContainer>
                  <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                  />
                  {children}
                </NavigationContainer>
              </HistoryLiveDataProvider>
            </TodayLiveDataProvider>
          </UsageTrackingProvider>
        </OnboardingStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
