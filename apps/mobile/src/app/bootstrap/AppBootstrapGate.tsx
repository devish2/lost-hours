import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { resolveAppBootstrap } from '../../application/bootstrap/resolveAppBootstrap';
import type { AppBootstrapDestination } from '../../application/bootstrap/AppBootstrapDestination';
import { RootNavigator } from '../navigation/RootNavigator';
import { useOnboardingStateRepository } from '../providers/OnboardingStateContext';
import { useUsageTrackingComposition } from '../providers/UsageTrackingContext';

type BootstrapState =
  | { phase: 'bootstrapping' }
  | { phase: 'resolved'; destination: AppBootstrapDestination };

export function AppBootstrapGate() {
  const composition = useUsageTrackingComposition();
  const onboardingRepository = useOnboardingStateRepository();
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    phase: 'bootstrapping',
  });
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;
    resolveAppBootstrap({ onboardingRepository, composition })
      .then(destination => {
        if (generation !== generationRef.current) {
          return;
        }
        setBootstrapState({ phase: 'resolved', destination });
      })
      .catch(() => {
        if (generation !== generationRef.current) {
          return;
        }
        setBootstrapState({
          phase: 'resolved',
          destination: 'welcome_required',
        });
      });

    return () => {
      generationRef.current += 1;
    };
  }, [composition, onboardingRepository]);

  if (bootstrapState.phase === 'bootstrapping') {
    return (
      <View style={styles.bootstrapping}>
        <ActivityIndicator accessibilityLabel="Starting Lost Hours" />
      </View>
    );
  }

  return <RootNavigator initialDestination={bootstrapState.destination} />;
}

const styles = StyleSheet.create({
  bootstrapping: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
