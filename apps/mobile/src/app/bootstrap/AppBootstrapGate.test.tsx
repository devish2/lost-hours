/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';

import { resolveAppBootstrap } from '../../application/bootstrap/resolveAppBootstrap';
import { InMemoryOnboardingStateRepository } from '../../infrastructure/preferences/testSupport/InMemoryOnboardingStateRepository';
import { MockUsageTrackingProvider } from '../../infrastructure/tracking/mock/MockUsageTrackingProvider';
import { UsageTrackingPermissionStatus } from '../../infrastructure/tracking/UsageTrackingPermissionStatus';
import {
  UsageTrackingCompositionKind,
  type UsageTrackingComposition,
} from '../../infrastructure/tracking/UsageTrackingComposition';
import { OnboardingStateProvider } from '../providers/OnboardingStateContext';
import { UsageTrackingProvider } from '../providers/UsageTrackingContext';
import { AppBootstrapGate } from './AppBootstrapGate';

jest.mock('../navigation/RootNavigator', () => ({
  RootNavigator: ({ initialDestination }: { initialDestination: string }) => {
    const { Text } = require('react-native');
    return <Text>{`ROOT:${initialDestination}`}</Text>;
  },
}));

jest.mock('../../application/bootstrap/resolveAppBootstrap', () => ({
  resolveAppBootstrap: jest.fn(),
}));

const mockedResolve = resolveAppBootstrap as jest.MockedFunction<
  typeof resolveAppBootstrap
>;

function renderGate(
  composition: UsageTrackingComposition,
  repository: InMemoryOnboardingStateRepository,
) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(
      <OnboardingStateProvider repository={repository}>
        <UsageTrackingProvider composition={composition}>
          <AppBootstrapGate />
        </UsageTrackingProvider>
      </OnboardingStateProvider>,
    );
  });
  return tree;
}

describe('AppBootstrapGate', () => {
  beforeEach(() => {
    mockedResolve.mockReset();
  });

  it('shows bootstrapping indicator until destination resolves', async () => {
    let resolvePromise!: (value: 'ready') => void;
    mockedResolve.mockReturnValue(
      new Promise<'ready'>(resolve => {
        resolvePromise = resolve;
      }),
    );

    const tree = renderGate(
      {
        kind: UsageTrackingCompositionKind.ANDROID_NATIVE,
        provider: new MockUsageTrackingProvider({
          permissionStatus: UsageTrackingPermissionStatus.GRANTED,
        }),
      },
      new InMemoryOnboardingStateRepository(),
    );

    expect(tree.root.findByType(ActivityIndicator)).toBeTruthy();

    await act(async () => {
      resolvePromise('ready');
      await Promise.resolve();
    });

    const text = tree.root
      .findAllByType(require('react-native').Text)
      .map(node => node.props.children)
      .join('');
    expect(text).toContain('ROOT:ready');
  });
});
