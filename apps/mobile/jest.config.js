const reactNativePreset = require('@react-native/jest-preset/jest-preset');

module.exports = {
  ...reactNativePreset,
  setupFiles: [...(reactNativePreset.setupFiles ?? []), './jest.setup.js'],
  // pnpm nests deps under .pnpm/.../node_modules/; preset default only whitelists top-level paths.
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-gesture-handler)/)',
  ],
};
