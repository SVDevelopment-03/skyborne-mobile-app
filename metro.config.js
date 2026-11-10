const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Gradle writes and deletes these during Android builds; watching them
    // crashes Metro on Windows (EPERM).
    blockList: [
      /[\\/]android[\\/](app[\\/])?build[\\/].*/,
      /[\\/]android[\\/](app[\\/])?\.cxx[\\/].*/,
      /[\\/]\.gradle[\\/].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
