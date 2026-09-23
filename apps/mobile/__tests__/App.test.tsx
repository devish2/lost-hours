/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import App from '../App';

jest.mock('@react-navigation/native', () => {
  const react = require('react');
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      react.createElement(react.Fragment, null, children),
  };
});

jest.mock('../src/app/navigation/RootNavigator', () => {
  const react = require('react');
  const {
    WelcomeScreen,
  } = require('../src/features/onboarding/screens/WelcomeScreen');
  return {
    RootNavigator: () => react.createElement(WelcomeScreen),
  };
});

function screenText(root: ReactTestRenderer.ReactTestInstance): string {
  return root
    .findAllByType(Text)
    .map(node =>
      typeof node.props.children === 'string' ? node.props.children : '',
    )
    .join(' ');
}

test('renders the Lost Hours app shell inside providers', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  const content = screenText(tree.root);
  expect(content).toContain('Lost Hours');
  expect(content).toContain('Get Started');
});
