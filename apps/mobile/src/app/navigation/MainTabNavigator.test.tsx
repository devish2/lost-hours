/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

import { MainTabNavigator } from './MainTabNavigator';
import { MainTabRoutes } from './routeNames';

describe('MainTabNavigator', () => {
  it('shows Today, History, and Settings tabs with Today content initially', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>,
      );
    });

    const content = tree.root
      .findAllByType(Text)
      .map(node =>
        typeof node.props.children === 'string' ? node.props.children : '',
      )
      .join(' ');

    expect(content).toContain(MainTabRoutes.Today);
    expect(content).toContain('Preview data');
    expect(content).toContain('2h 41m');
    expect(content).toContain(MainTabRoutes.History);
    expect(content).toContain(MainTabRoutes.Settings);
  });
});
