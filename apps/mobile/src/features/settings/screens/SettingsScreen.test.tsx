/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { SettingsScreen } from './SettingsScreen';

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

describe('SettingsScreen', () => {
  it('communicates local storage and non-connected tracking', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<SettingsScreen />);
    });

    const content = screenText(tree.root);
    expect(content).toContain('Settings');
    expect(content).toContain('Usage access');
    expect(content).toContain('Not connected');
    expect(content).toContain('stored locally on this device');
  });
});
