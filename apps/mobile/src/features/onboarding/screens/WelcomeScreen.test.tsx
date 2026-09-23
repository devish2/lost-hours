/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { WelcomeScreen } from './WelcomeScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

describe('WelcomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders Lost Hours and intro copy', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<WelcomeScreen />);
    });
    const content = screenText(tree.root);
    expect(content).toContain('Lost Hours');
    expect(content).toContain('Understand where your digital time actually goes.');
  });

  it('navigates to UsagePermission on Get Started', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<WelcomeScreen />);
    });
    const button = tree.root.find(
      node =>
        node.props.accessibilityLabel === 'Get started' &&
        typeof node.props.onPress === 'function',
    );
    await act(async () => {
      button.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('UsagePermission');
  });
});
