/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';

import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import {
  ONBOARDING_PERSIST_ERROR_MESSAGE,
  PERMISSION_CHECK_ERROR_MESSAGE,
  SETTINGS_OPEN_ERROR_MESSAGE,
} from './usagePermissionFlow';
import {
  useUsagePermissionFlow,
  type UseUsagePermissionFlowResult,
} from './useUsagePermissionFlow';

const mockNavigateToMain = jest.fn();
const mockMarkOnboardingCompleted = jest.fn(async () => {});
let appStateListener: ((state: string) => void) | undefined;

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const ReactLib = require('react');
    ReactLib.useLayoutEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
  appStateListener = listener as (state: string) => void;
  return { remove: jest.fn() };
});

function androidComposition(
  provider: MockUsageTrackingProvider,
): UsageTrackingComposition {
  return {
    kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
    provider,
  };
}

function renderFlow(composition: UsageTrackingComposition) {
  const holder: { current: UseUsagePermissionFlowResult | null } = {
    current: null,
  };

  function Probe() {
    holder.current = useUsagePermissionFlow({
      composition,
      onNavigateToMain: mockNavigateToMain,
      markOnboardingCompleted: mockMarkOnboardingCompleted,
    });
    return null;
  }

  act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  return holder as { current: UseUsagePermissionFlowResult };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useUsagePermissionFlow', () => {
  beforeEach(() => {
    mockNavigateToMain.mockClear();
    mockMarkOnboardingCompleted.mockClear();
    mockMarkOnboardingCompleted.mockResolvedValue(undefined);
    appStateListener = undefined;
  });

  it('checks permission on focus and enables Continue when GRANTED', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.GRANTED,
    });
    const flow = renderFlow(androidComposition(provider));
    expect(flow.current.uiPhase).toBe('loading');

    await flushPromises();
    expect(flow.current.uiPhase).toBe('granted');
    expect(flow.current.canContinue).toBe(true);
  });

  it('blocks Continue when permission is DENIED and exposes Open Settings', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    expect(flow.current.uiPhase).toBe('denied');
    expect(flow.current.canContinue).toBe(false);

    await act(async () => {
      flow.current.openSettings();
      await flushPromises();
    });
    expect(provider.getPermissionSettingsOpened()).toBe(true);
    expect(flow.current.uiPhase).toBe('denied');
  });

  it('blocks Continue when permission is UNKNOWN', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.UNKNOWN,
    });
    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    expect(flow.current.uiPhase).toBe('unknown');
    expect(flow.current.canContinue).toBe(false);
  });

  it('re-checks permission when app becomes active', async () => {
    let status = UsageTrackingPermissionStatus.DENIED;
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    jest.spyOn(provider, 'getPermissionStatus').mockImplementation(async () => status);

    const flow = renderFlow(androidComposition(provider));
    await flushPromises();
    expect(flow.current.uiPhase).toBe('denied');

    status = UsageTrackingPermissionStatus.GRANTED;
    await act(async () => {
      appStateListener?.('active');
      await flushPromises();
    });
    expect(flow.current.uiPhase).toBe('granted');
  });

  it('surfaces recoverable error when permission check fails', async () => {
    const provider = new MockUsageTrackingProvider();
    jest
      .spyOn(provider, 'getPermissionStatus')
      .mockRejectedValue(new Error('native failure'));

    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    expect(flow.current.uiPhase).toBe('error');
    expect(flow.current.errorMessage).toBe(PERMISSION_CHECK_ERROR_MESSAGE);
    expect(flow.current.canContinue).toBe(false);
  });

  it('does not navigate to Main when Continue is pressed without GRANTED', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    await act(async () => {
      await flow.current.continueToMain();
    });
    expect(mockNavigateToMain).not.toHaveBeenCalled();
  });

  it('persists onboarding before navigating when GRANTED', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.GRANTED,
    });
    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    await act(async () => {
      await flow.current.continueToMain();
    });

    expect(mockMarkOnboardingCompleted).toHaveBeenCalledTimes(1);
    expect(mockNavigateToMain).toHaveBeenCalledTimes(1);
    expect(mockMarkOnboardingCompleted.mock.invocationCallOrder[0]).toBeLessThan(
      mockNavigateToMain.mock.invocationCallOrder[0],
    );
  });

  it('does not navigate when onboarding persistence fails', async () => {
    mockMarkOnboardingCompleted.mockRejectedValue(new Error('write failed'));
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.GRANTED,
    });
    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    await act(async () => {
      await flow.current.continueToMain();
    });

    expect(mockNavigateToMain).not.toHaveBeenCalled();
    expect(flow.current.uiPhase).toBe('error');
    expect(flow.current.errorMessage).toBe(ONBOARDING_PERSIST_ERROR_MESSAGE);
  });

  it('re-checks permission on Continue and navigates only when GRANTED', async () => {
    let status = UsageTrackingPermissionStatus.DENIED;
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    jest.spyOn(provider, 'getPermissionStatus').mockImplementation(async () => status);

    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    status = UsageTrackingPermissionStatus.GRANTED;
    await act(async () => {
      await flow.current.continueToMain();
    });
    expect(mockNavigateToMain).toHaveBeenCalledTimes(1);
  });

  it('sets settings error without marking permission granted when settings fail', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    jest.spyOn(provider, 'openPermissionSettings').mockRejectedValue(new Error('fail'));

    const flow = renderFlow(androidComposition(provider));
    await flushPromises();

    await act(async () => {
      flow.current.openSettings();
      await flushPromises();
    });

    expect(flow.current.uiPhase).toBe('error');
    expect(flow.current.errorMessage).toBe(SETTINGS_OPEN_ERROR_MESSAGE);
    expect(flow.current.canContinue).toBe(false);
  });
});
