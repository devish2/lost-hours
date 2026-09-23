/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { HistoryScreen } from './HistoryScreen';

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

describe('HistoryScreen', () => {
  it('does not imply fake historical records exist', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<HistoryScreen />);
    });

    const content = screenText(tree.root);
    expect(content).toContain('History');
    expect(content).toContain('once tracking starts');
    expect(content).not.toMatch(/March|Yesterday|Monday/i);
  });
});
