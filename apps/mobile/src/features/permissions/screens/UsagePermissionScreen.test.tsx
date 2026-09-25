/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, Text } from 'react-native';

import { OnboardingStateProvider } from '../../../app/providers/OnboardingStateContext';
import { UsageTrackingProvider } from '../../../app/providers/UsageTrackingContext';
import { InMemoryOnboardingStateRepository } from '../../../infrastructure/preferences/testSupport/InMemoryOnboardingStateRepository';
import { MockUsageTrackingProvider } from '../../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../../infrastructure/tracking/UsageTrackingComposition';
import { noOpAppMetadataPort } from '../../../infrastructure/tracking/testSupport/noOpAppMetadataPort';
import { UsagePermissionScreen } from './UsagePermissionScreen';

const mockDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    reset: (payload: unknown) => ({ type: 'RESET', payload }),
  },
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
  useFocusEffect: (callback: () => void) => {
    const ReactLib = require('react');
    ReactLib.useLayoutEffect(() => {
      callback();
    }, [callback]);
  },
}));

function renderScreen(composition: UsageTrackingComposition) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(
      <OnboardingStateProvider repository={new InMemoryOnboardingStateRepository()}>
        <UsageTrackingProvider composition={composition}>
          <UsagePermissionScreen />
        </UsageTrackingProvider>
      </OnboardingStateProvider>,
    );
  });
  return tree;
}

function androidComposition(
  provider: MockUsageTrackingProvider,
): UsageTrackingComposition {
  return {
    kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
    provider,
    appMetadataPort: noOpAppMetadataPort,
  };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('UsagePermissionScreen', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows granted state and navigates on Continue after permission check', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.GRANTED,
    });
    const tree = renderScreen(androidComposition(provider));
    await flushPromises();

    const content = tree.root
      .findAllByType(Text)
      .map(node =>
        typeof node.props.children === 'string' ? node.props.children : '',
      )
      .join(' ');
    expect(content).toContain('Usage Access is enabled');

    const button = tree.root.find(
      node =>
        node.props.accessibilityLabel === 'Continue to main app' &&
        typeof node.props.onPress === 'function',
    );
    expect(button.props.disabled).not.toBe(true);

    await act(async () => {
      button.props.onPress();
      await flushPromises();
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
        payload: expect.objectContaining({
          routes: [{ name: 'Main' }],
        }),
      }),
    );
  });

  it('keeps Continue disabled when permission is denied', async () => {
    const provider = new MockUsageTrackingProvider({
      permissionStatus: UsageTrackingPermissionStatus.DENIED,
    });
    const tree = renderScreen(androidComposition(provider));
    await flushPromises();

    const button = tree.root.find(
      node => node.props.accessibilityLabel === 'Continue to main app',
    );
    expect(button.props.disabled).toBe(true);

    const openSettings = tree.root.find(
      node => node.props.accessibilityLabel === 'Open Android Usage Access settings',
    );
    expect(openSettings).toBeDefined();
  });
});
