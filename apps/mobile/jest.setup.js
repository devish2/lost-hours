/* eslint-env jest */

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  const defaultInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  const defaultFrame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(defaultInsets);
  const SafeAreaFrameContext = React.createContext(defaultFrame);

  function SafeAreaProvider({ children }) {
    return React.createElement(
      SafeAreaInsetsContext.Provider,
      { value: defaultInsets },
      React.createElement(
        SafeAreaFrameContext.Provider,
        { value: defaultFrame },
        children,
      ),
    );
  }

  return {
    SafeAreaProvider,
    SafeAreaView: View,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    useSafeAreaInsets: () => defaultInsets,
    useSafeAreaFrame: () => defaultFrame,
  };
});

jest.mock('react-native-screens', () => {
  const { View } = require('react-native');

  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => false),
    Screen: View,
    ScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    FullWindowOverlay: View,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');

  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
  };
});
