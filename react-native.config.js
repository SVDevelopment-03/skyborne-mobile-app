module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    // IAP is iOS-only (Android pays via Stripe). Linking it on Android pulls in
    // Play Billing 7, which Play Console now rejects.
    'react-native-iap': {
      platforms: {
        android: null,
      },
    },
  },
};
