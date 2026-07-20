/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApps } from '@react-native-firebase/app';

// Initialize Firebase and background message handler
import messaging from '@react-native-firebase/messaging';

if (getApps().length > 0) {
	// Set up background message handler
	messaging().setBackgroundMessageHandler(async remoteMessage => {
		const data = remoteMessage?.data || {};
		const notificationType =
			data.notificationType ||
			data.type ||
			data.category ||
			data.eventType ||
			data.source ||
			'unknown';

		console.log('[PushNotificationsBootstrap] background message', {
			messageId: remoteMessage?.messageId,
			notificationType,
			data: remoteMessage?.data,
			hasNotificationPayload: !!remoteMessage?.notification,
		});
	});
} else {
	console.warn('Firebase app is not configured. Skipping messaging bootstrap.');
}

AppRegistry.registerComponent(appName, () => App);