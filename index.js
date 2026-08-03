/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApp, getApps } from '@react-native-firebase/app/lib/modular';
import '@react-native-firebase/messaging';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging/lib/modular';


if (getApps().length > 0) {
	const app = getApp();

	setBackgroundMessageHandler(getMessaging(app), async remoteMessage => {
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