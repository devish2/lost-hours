import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import type { UsageTrackingProvider } from '../../infrastructure/tracking/UsageTrackingProvider';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import {
  ONBOARDING_PERSIST_ERROR_MESSAGE,
  PERMISSION_CHECK_ERROR_MESSAGE,
  SETTINGS_OPEN_ERROR_MESSAGE,
  canContinueFromUiPhase,
  mapPermissionStatusToUiPhase,
  uiPhaseFromCompositionKind,
  type UsagePermissionUiPhase,
} from './usagePermissionFlow';

export type UseUsagePermissionFlowResult = {
  uiPhase: UsagePermissionUiPhase;
  errorMessage: string | null;
  isOpeningSettings: boolean;
  refreshPermissionStatus: () => void;
  openSettings: () => void;
  continueToMain: () => Promise<void>;
  canContinue: boolean;
};

type FlowOptions = {
  composition: UsageTrackingComposition;
  onNavigateToMain: () => void;
  markOnboardingCompleted: () => Promise<void>;
};

async function fetchPermissionPhase(
  provider: UsageTrackingProvider,
): Promise<UsagePermissionUiPhase> {
  const status = await provider.getPermissionStatus();
  return mapPermissionStatusToUiPhase(status);
}

export function useUsagePermissionFlow({
  composition,
  onNavigateToMain,
  markOnboardingCompleted,
}: FlowOptions): UseUsagePermissionFlowResult {
  const provider = composition.provider;
  const [uiPhase, setUiPhase] = useState<UsagePermissionUiPhase>(() =>
    uiPhaseFromCompositionKind(composition.kind),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);
  const checkGenerationRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runPermissionCheck = useCallback(async () => {
    if (
      composition.kind !== UsageTrackingCompositionKind.ANDROID_NATIVE ||
      provider == null
    ) {
      setUiPhase(uiPhaseFromCompositionKind(composition.kind));
      return;
    }

    const generation = ++checkGenerationRef.current;
    setUiPhase('loading');
    setErrorMessage(null);

    try {
      const nextPhase = await fetchPermissionPhase(provider);
      if (!isMountedRef.current || generation !== checkGenerationRef.current) {
        return;
      }
      setUiPhase(nextPhase);
      setErrorMessage(null);
    } catch {
      if (!isMountedRef.current || generation !== checkGenerationRef.current) {
        return;
      }
      setUiPhase('error');
      setErrorMessage(PERMISSION_CHECK_ERROR_MESSAGE);
    }
  }, [composition.kind, provider]);

  useFocusEffect(
    useCallback(() => {
      runPermissionCheck().catch(() => {});
    }, [runPermissionCheck]),
  );

  useEffect(() => {
    if (
      composition.kind !== UsageTrackingCompositionKind.ANDROID_NATIVE ||
      provider == null
    ) {
      return;
    }

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        runPermissionCheck().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [composition.kind, provider, runPermissionCheck]);

  const openSettings = useCallback(() => {
    if (
      composition.kind !== UsageTrackingCompositionKind.ANDROID_NATIVE ||
      provider == null ||
      isOpeningSettings
    ) {
      return;
    }

    setIsOpeningSettings(true);
    provider
      .openPermissionSettings()
      .catch(() => {
        if (isMountedRef.current) {
          setUiPhase('error');
          setErrorMessage(SETTINGS_OPEN_ERROR_MESSAGE);
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsOpeningSettings(false);
        }
      });
  }, [composition.kind, provider, isOpeningSettings]);

  const continueToMain = useCallback(async () => {
    if (
      composition.kind !== UsageTrackingCompositionKind.ANDROID_NATIVE ||
      provider == null
    ) {
      return;
    }

    try {
      const phase = await fetchPermissionPhase(provider);
      if (!isMountedRef.current) {
        return;
      }
      setUiPhase(phase);
      setErrorMessage(null);
      if (!canContinueFromUiPhase(phase)) {
        return;
      }

      try {
        await markOnboardingCompleted();
      } catch {
        if (isMountedRef.current) {
          setUiPhase('error');
          setErrorMessage(ONBOARDING_PERSIST_ERROR_MESSAGE);
        }
        return;
      }

      if (!isMountedRef.current) {
        return;
      }
      onNavigateToMain();
    } catch {
      if (isMountedRef.current) {
        setUiPhase('error');
        setErrorMessage(PERMISSION_CHECK_ERROR_MESSAGE);
      }
    }
  }, [
    composition.kind,
    provider,
    onNavigateToMain,
    markOnboardingCompleted,
  ]);

  return {
    uiPhase,
    errorMessage,
    isOpeningSettings,
    refreshPermissionStatus: () => {
      runPermissionCheck().catch(() => {});
    },
    openSettings,
    continueToMain,
    canContinue: canContinueFromUiPhase(uiPhase),
  };
}

export {
  ONBOARDING_PERSIST_ERROR_MESSAGE,
  PERMISSION_CHECK_ERROR_MESSAGE,
  SETTINGS_OPEN_ERROR_MESSAGE,
};
