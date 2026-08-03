/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { Alert, AppState, AppStateStatus, Linking, PermissionsAndroid, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY as STRIPE_PUBLISHABLE_KEY_ENV } from '@env';
import { LinkingOptions, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import {
  AuthorizationStatus,
  getInitialNotification,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging/lib/modular';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AppNavigator from './src/navigation/AppNavigator';
import { RootStackParamList } from './src/navigation/AppNavigator';
import { store, persistor, RootState } from './src/store';
import { notificationService } from './src/services/notificationService';
import { profileService } from './src/services/profileService';
import { notificationSoundService } from './src/services/notificationSoundService';
import { notificationHistoryService } from './src/services/notificationHistoryService';
import { notificationEvents } from './src/utils/notificationEvents';
import { clearAllAppCache } from './src/store/clearCache';

const STRIPE_PUBLISHABLE_KEY =
  (STRIPE_PUBLISHABLE_KEY_ENV || '').trim() ||
  'pk_test_51SjzaC39om0H69ZJ9T1qXTBNWJMMEfttBETG1aROccPGueJ5muJ4BKZf89d65adlPGOFGLNpc3t26i66vQ6KRo6900tfCMqzNS';

if (!STRIPE_PUBLISHABLE_KEY_ENV?.trim()) {
  console.warn(
    'Stripe publishable key env is missing. Using fallback test publishable key. Ensure the app publishable key matches the backend Stripe account.',
  );
}

const APP_CHECKOUT_CALLBACK_PREFIXES = [
  'skybornedrop://shop-checkout-result',
  'skybornedrop://payment-processing',
];
const navigationRef = createNavigationContainerRef<RootStackParamList>();

type ParsedDeepLinkTarget =
  | { screen: 'ClassDetails'; classId: string }
  | { screen: 'ProductDetails'; productId: string }
  | null;

function parseDeepLinkTarget(url?: string | null): ParsedDeepLinkTarget {
  if (!url) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const firstSegment = host || pathSegments[0]?.toLowerCase() || '';
  const pathId = host ? pathSegments[0] : pathSegments[1];
  const queryId =
    parsedUrl.searchParams.get('id') ||
    parsedUrl.searchParams.get('classId') ||
    parsedUrl.searchParams.get('meetingId') ||
    parsedUrl.searchParams.get('productId');
  const resolvedId = decodeURIComponent(pathId || queryId || '');

  if (!resolvedId) {
    return null;
  }

  if (firstSegment === 'class' || firstSegment === 'meeting') {
    return { screen: 'ClassDetails', classId: resolvedId };
  }

  if (firstSegment === 'product') {
    return { screen: 'ProductDetails', productId: resolvedId };
  }

  return null;
}

function PushNotificationsBootstrap() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);
  const registeredTokenRef = React.useRef<string | null>(null);
  const hasForcedLogoutRef = React.useRef(false);
  const [messagingInstance, setMessagingInstance] = React.useState<any | null>(null);

  const forceLogoutForDeletedAccount = React.useCallback(async () => {
    if (hasForcedLogoutRef.current) {
      return;
    }

    hasForcedLogoutRef.current = true;

    await clearAllAppCache();
    await persistor.purge();

    if (navigationRef.isReady()) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }

    Alert.alert(
      'Account Deleted',
      'Your account deletion request has been approved. Your Account has been Deleted Successfully.',
    );
  }, []);

  const validateCurrentSession = React.useCallback(async () => {
    if (!isLoggedIn || hasForcedLogoutRef.current) {
      return;
    }

    try {
      const response = await profileService.getProfile();
      const user = response?.data?.user;

      if (user && user.isActive === false) {
        await forceLogoutForDeletedAccount();
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = String(error?.response?.data?.message || error?.message || '').toLowerCase();

      const shouldForceLogout =
        status === 401 ||
        status === 403 ||
        status === 404 ||
        message.includes('invalid or expired token') ||
        message.includes('user not found') ||
        message.includes('user not authenticated') ||
        message.includes('no token provided');

      if (shouldForceLogout) {
        await forceLogoutForDeletedAccount();
      }
    }
  }, [forceLogoutForDeletedAccount, isLoggedIn]);

  const extractNotificationType = React.useCallback(
    (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
      const data = remoteMessage?.data || {};
      return (
        data.notificationType ||
        data.type ||
        data.category ||
        data.eventType ||
        data.source ||
        'unknown'
      );
    },
    []
  );

  React.useEffect(() => {
    let isMounted = true;

    const initMessaging = async () => {
      try {
        const [{ getApps }, { getMessaging }] = await Promise.all([
          import('@react-native-firebase/app/lib/modular'),
          import('@react-native-firebase/messaging/lib/modular'),
        ]);

        if (!isMounted) {
          return;
        }

        const firebaseApps = getApps();
        if (!firebaseApps.length) {
          console.warn('Firebase Messaging initialization skipped: no default Firebase app is configured on this platform.');
          setMessagingInstance(null);
          return;
        }

        setMessagingInstance(getMessaging(firebaseApps[0]));
      } catch (error) {
        console.warn('Firebase Messaging initialization failed:', error);
        if (isMounted) {
          setMessagingInstance(null);
        }
      }
    };

    initMessaging();

    return () => {
      isMounted = false;
    };
  }, []);

  const promptOpenSettings = React.useCallback(() => {
    Alert.alert(
      'Enable Notifications',
      'Please allow notification permission in phone settings to receive updates.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings().catch(() => {
              // no-op
            });
          },
        },
      ]
    );
  }, []);

  const requestPushPermissions = React.useCallback(async (): Promise<boolean> => {
    try {
      if (!messagingInstance) {
        return false;
      }

      await registerDeviceForRemoteMessages(messagingInstance);

      if (Platform.OS === 'ios') {
        const authorizationStatus = await requestPermission(messagingInstance, {
          alert: true,
          announcement: true,
          badge: true,
          carPlay: false,
          provisional: false,
          sound: true,
        });

        const granted =
          authorizationStatus === AuthorizationStatus.AUTHORIZED ||
          authorizationStatus === AuthorizationStatus.PROVISIONAL;

        if (!granted) {
          promptOpenSettings();
        }

        return granted;
      }

      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const androidPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (androidPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          promptOpenSettings();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('Push permission request failed:', error);
      return false;
    }
  }, [messagingInstance, promptOpenSettings]);

  const tryRegisterCurrentFcmToken = React.useCallback(async () => {
    try {
      if (!messagingInstance) {
        return;
      }

      const fcmToken = await getToken(messagingInstance);
      if (!fcmToken || fcmToken === registeredTokenRef.current) {
        return;
      }

      console.log('[PushNotificationsBootstrap] registering FCM token', {
        tokenPrefix: fcmToken.slice(0, 24),
        isLoggedIn,
      });

      await notificationService.registerDeviceToken(fcmToken);
      registeredTokenRef.current = fcmToken;

      console.log('[PushNotificationsBootstrap] FCM token registered successfully');
    } catch (error) {
      console.warn('FCM token registration failed:', error);
    }
  }, [messagingInstance]);

  const navigateFromNotification = React.useCallback(
    (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
      if (!navigationRef.isReady()) {
        return;
      }

      const targetScreen = remoteMessage?.data?.screen as keyof RootStackParamList | undefined;
      const classId = remoteMessage?.data?.classId;
      const meetingId = remoteMessage?.data?.meetingId;
      const productId = remoteMessage?.data?.productId;
      const deeplink = remoteMessage?.data?.deeplink;

      // Handle class/meeting navigation with params
      if (targetScreen === 'ClassDetails' && (classId || meetingId)) {
        navigationRef.navigate('ClassDetails', { classId: String(classId || meetingId) });
        return;
      }

      // Handle product navigation with params
      if (targetScreen === 'ProductDetails' && productId) {
        navigationRef.navigate('ProductDetails', { productId: String(productId) });
        return;
      }

      // Handle direct deeplink parsing
      if (deeplink && typeof deeplink === 'string') {
        const parsedTarget = parseDeepLinkTarget(deeplink);
        if (parsedTarget?.screen === 'ClassDetails') {
          navigationRef.navigate('ClassDetails', { classId: parsedTarget.classId });
          return;
        }

        if (parsedTarget?.screen === 'ProductDetails') {
          navigationRef.navigate('ProductDetails', { productId: parsedTarget.productId });
          return;
        }
      }

      // Generic screen navigation without params
      if (targetScreen) {
        navigationRef.navigate(targetScreen as never);
        return;
      }

      // Default to Home if logged in
      if (isLoggedIn) {
        navigationRef.navigate('Home');
      }
    },
    [isLoggedIn]
  );

  const persistIncomingNotification = React.useCallback(
    async (
      remoteMessage: FirebaseMessagingTypes.RemoteMessage | null,
      source: 'foreground' | 'background' | 'quit',
    ) => {
      if (!remoteMessage) {
        return;
      }
      await notificationHistoryService.add({
        messageId: remoteMessage.messageId,
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        source,
        data: remoteMessage.data as Record<string, string> | undefined,
      });

      try {
        const unread = await notificationHistoryService.countUnread();
        notificationEvents.emit(unread);
      } catch (e) {
        // no-op
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!messagingInstance) {
      return;
    }

    const unsubscribeOnMessage = onMessage(
      messagingInstance,
      async remoteMessage => {
        await persistIncomingNotification(remoteMessage, 'foreground');

        const notificationType = extractNotificationType(remoteMessage);
        const title = remoteMessage.notification?.title || 'New notification';
        const body = remoteMessage.notification?.body || '';
        const hasVisibleNotificationPayload =
          !!remoteMessage.notification?.title || !!remoteMessage.notification?.body;

        console.log('[PushNotificationsBootstrap] foreground message', {
          messageId: remoteMessage?.messageId,
          notificationType,
          data: remoteMessage?.data,
          hasVisibleNotificationPayload,
        });

        // Play notification sound
        await notificationSoundService.playNotificationSound();

        if (Platform.OS === 'ios' && hasVisibleNotificationPayload) {
          return;
        }

        Toast.show({
          type: 'info',
          text1: title,
          text2: body,
        });
      }
    );

    const unsubscribeOnOpened = onNotificationOpenedApp(
      messagingInstance,
      async remoteMessage => {
        await persistIncomingNotification(remoteMessage, 'background');

        console.log('[PushNotificationsBootstrap] notification opened from background', {
          messageId: remoteMessage?.messageId,
          notificationType: extractNotificationType(remoteMessage),
          data: remoteMessage?.data,
        });
        navigateFromNotification(remoteMessage);
      }
    );

    getInitialNotification(messagingInstance)
      .then(async remoteMessage => {
        if (remoteMessage) {
          await persistIncomingNotification(remoteMessage, 'quit');

          console.log('[PushNotificationsBootstrap] app opened from quit state notification', {
            messageId: remoteMessage?.messageId,
            notificationType: extractNotificationType(remoteMessage),
            data: remoteMessage?.data,
          });
          setTimeout(() => navigateFromNotification(remoteMessage), 600);
        }
      })
      .catch(() => {
        // no-op
      });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpened();
    };
  }, [
    extractNotificationType,
    messagingInstance,
    navigateFromNotification,
    persistIncomingNotification,
  ]);

  React.useEffect(() => {
    let isCancelled = false;

    const setupPush = async () => {
      if (!isLoggedIn) {
        registeredTokenRef.current = null;
        return;
      }

      const hasPermission = await requestPushPermissions();
      if (!hasPermission || isCancelled) {
        return;
      }

      await tryRegisterCurrentFcmToken();
    };

    setupPush();

    const appStateListener = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (nextState !== 'active' || !isLoggedIn || isCancelled) {
        return;
      }

      await tryRegisterCurrentFcmToken();
    });

    if (!messagingInstance) {
      return () => {
        isCancelled = true;
        appStateListener.remove();
      };
    }

    const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async token => {
      if (!isLoggedIn) {
        return;
      }

      try {
        await notificationService.registerDeviceToken(token);
        registeredTokenRef.current = token;
      } catch (error) {
        console.warn('FCM refreshed token registration failed:', error);
      }
    });

    return () => {
      isCancelled = true;
      appStateListener.remove();
      unsubscribeTokenRefresh();
    };
  }, [isLoggedIn, messagingInstance, requestPushPermissions, tryRegisterCurrentFcmToken]);

  React.useEffect(() => {
    if (!isLoggedIn) {
      hasForcedLogoutRef.current = false;
      return;
    }

    validateCurrentSession();

    const intervalId = setInterval(() => {
      validateCurrentSession();
    }, 30000);

    const appStateListener = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        validateCurrentSession();
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateListener.remove();
    };
  }, [isLoggedIn, validateCurrentSession]);

  return null;
}

export default function App() {
  const pendingCallbackUrlRef = React.useRef<string | null>(null);
  const pendingDeepLinkUrlRef = React.useRef<string | null>(null);
  const lastHandledUrlRef = React.useRef<string | null>(null);

  const getQueryParam = React.useCallback((url: string, key: string): string | null => {
    const [, queryString = ''] = url.split('?');
    if (!queryString) {
      return null;
    }
    const params = queryString.split('&');
    const match = params.find(part => part.split('=')[0] === key);
    if (!match) {
      return null;
    }
    const value = match.split('=').slice(1).join('=');
    return decodeURIComponent(value || '');
  }, []);

  const navigateFromDeepLink = React.useCallback((url?: string | null) => {
    if (!url) {
      return false;
    }

    if (url === lastHandledUrlRef.current) {
      return true;
    }

    const parsedTarget = parseDeepLinkTarget(url);

    if (parsedTarget?.screen === 'ClassDetails') {
      if (!navigationRef.isReady()) {
        pendingDeepLinkUrlRef.current = url;
        return true;
      }

      lastHandledUrlRef.current = url;
      pendingDeepLinkUrlRef.current = null;
      navigationRef.navigate('ClassDetails', { classId: parsedTarget.classId });
      return true;
    }

    if (parsedTarget?.screen === 'ProductDetails') {
      if (!navigationRef.isReady()) {
        pendingDeepLinkUrlRef.current = url;
        return true;
      }

      lastHandledUrlRef.current = url;
      pendingDeepLinkUrlRef.current = null;
      navigationRef.navigate('ProductDetails', { productId: parsedTarget.productId });
      return true;
    }

    return false;
  }, []);

  const handleCheckoutCallback = React.useCallback((url?: string | null) => {
    const isCheckoutCallback =
      !!url && APP_CHECKOUT_CALLBACK_PREFIXES.some(prefix => url.startsWith(prefix));

    if (!url || !isCheckoutCallback || url === lastHandledUrlRef.current) {
      return false;
    }

    if (!navigationRef.isReady()) {
      pendingCallbackUrlRef.current = url;
      return true;
    }

    lastHandledUrlRef.current = url;
    pendingCallbackUrlRef.current = null;

    const status = (getQueryParam(url, 'status') || '').toLowerCase();
    if (status === 'success') {
      navigationRef.navigate('MyOrders');
      Toast.show({ type: 'success', text1: 'Payment successful', text2: 'Your order has been placed.' });
      return true;
    }

    if (status === 'cancelled' || status === 'failed') {
      navigationRef.navigate('Checkout');
      Toast.show({ type: 'error', text1: 'Payment not completed' });
      return true;
    }

    navigationRef.navigate('MyOrders');
    return true;
  }, [getQueryParam]);

  const linking = React.useMemo<LinkingOptions<RootStackParamList>>(
    () => ({
      prefixes: ['skybornedrop://', 'https://skybornedrop.com', 'https://www.skybornedrop.com'],
      config: {
        screens: {
          Home: 'home',
          Explore: 'explore',
          Schedule: 'schedule',
          Profile: 'profile',
          ClassDetails: 'class/:classId',
          Products: 'shop/products',
          ProductDetails: 'shop/product/:productId',
          Cart: 'shop/cart',
          Checkout: 'shop/checkout',
          MyOrders: 'shop/orders',
          Support: 'support',
          Feedback: 'feedback',
        },
      },
      async getInitialURL() {
        const url = await Linking.getInitialURL();
        if (handleCheckoutCallback(url)) {
          return null;
        }

        if (navigateFromDeepLink(url)) {
          return null;
        }

        return url;
      },
      subscribe(listener) {
        const onReceiveURL = ({ url }: { url: string }) => {
          if (handleCheckoutCallback(url)) {
            return;
          }

          if (navigateFromDeepLink(url)) {
            return;
          }

          listener(url);
        };

        const subscription = Linking.addEventListener('url', onReceiveURL);

        return () => {
          subscription.remove();
        };
      },
    }),
    [handleCheckoutCallback]
  );

  if (__DEV__) {
    require("./ReactotronConfig");
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="skybornedrop">
            <PushNotificationsBootstrap />
            <StatusBar barStyle={'dark-content'} />
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              onReady={() => {
                if (pendingCallbackUrlRef.current) {
                  handleCheckoutCallback(pendingCallbackUrlRef.current);
                }

                if (pendingDeepLinkUrlRef.current) {
                  navigateFromDeepLink(pendingDeepLinkUrlRef.current);
                }
              }}
            >
              <View style={styles.container}>
                <AppNavigator />
              </View>
            </NavigationContainer>
            <Toast />
          </StripeProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
