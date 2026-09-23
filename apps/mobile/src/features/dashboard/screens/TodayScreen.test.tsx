/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { TodayScreen } from './TodayScreen';

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

describe('TodayScreen', () => {
  it('renders demo dashboard metrics from domain composition', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<TodayScreen />);
    });

    const content = screenText(tree.root);
    expect(content).toContain('Today');
    expect(content).toContain('Preview data');
    expect(content).toContain('Lost Hours');
    expect(content).toContain('2h 41m');
    expect(content).toContain('Total Tracked');
    expect(content).toContain('5h 12m');
    expect(content).toContain('Productive');
    expect(content).toContain('Neutral');
    expect(content).toContain('Leisure');
    expect(content).toContain('Lost');
    expect(content).toContain('Unknown');
    expect(content).toContain('Lost by platform');
    expect(content).toContain('Instagram');
    expect(content).toContain('YouTube');
    expect(content).toContain('Reddit');
  });
});
