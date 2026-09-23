/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { UsagePermissionScreen } from './UsagePermissionScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('UsagePermissionScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders usage access placeholder copy', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<UsagePermissionScreen />);
    });
    const content = tree.root
      .findAllByType(Text)
      .map(node =>
        typeof node.props.children === 'string' ? node.props.children : '',
      )
      .join(' ');
    expect(content).toContain('Usage Access');
    expect(content).toContain('Permission is not connected yet');
  });

  it('navigates to Main on Continue', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<UsagePermissionScreen />);
    });
    const button = tree.root.find(
      node =>
        node.props.accessibilityLabel === 'Continue to main app preview' &&
        typeof node.props.onPress === 'function',
    );
    await act(async () => {
      button.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Main');
  });
});
