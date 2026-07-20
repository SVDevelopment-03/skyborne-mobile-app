import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notificationService';

/**
 * Development/Testing component for push notifications
 * Add to a hidden dev menu or remove before production
 */
export default function PushNotificationDebugger() {
  const [token, setToken] = React.useState<string>('');
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const getToken = async () => {
    try {
      const messaging = require('@react-native-firebase/messaging').default;
      const fcmToken = await messaging().getToken();
      setToken(fcmToken);
      addLog(`Token retrieved: ${fcmToken.slice(0, 30)}...`);
    } catch (error) {
      addLog(`Error getting token: ${error}`);
    }
  };

  const registerToken = async () => {
    try {
      await notificationService.registerDeviceToken(token);
      addLog(`Token registered with backend`);
    } catch (error) {
      addLog(`Error registering token: ${error}`);
    }
  };

  const triggerBackendTestPush = async () => {
    try {
      const result = await notificationService.sendTestNotification({
        title: 'SkyBorne Push Test',
        body: 'Backend-triggered test push notification',
        data: { screen: 'Home', source: 'mobile-debugger' },
      });
      addLog(`Backend test push requested: ${result?.message || 'OK'}`);
    } catch (error) {
      addLog(`Error triggering backend test push: ${error}`);
    }
  };

  const testForeground = () => {
    const remoteMessage = {
      notification: {
        title: 'Test Foreground',
        body: 'This is a test notification',
      },
      data: { screen: 'Home' },
    };
    addLog(`Simulated foreground message received`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  React.useEffect(() => {
    getToken();
    addLog('Debug component mounted');
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notification Debugger</Text>

      <View style={styles.section}>
        <Text style={styles.label}>FCM Token:</Text>
        <Text style={styles.tokenText}>{token.slice(0, 50)}...</Text>
        <TouchableOpacity style={styles.button} onPress={getToken}>
          <Text style={styles.buttonText}>Get Token</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.button} onPress={registerToken}>
          <Text style={styles.buttonText}>Register with Backend</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={triggerBackendTestPush}>
          <Text style={styles.buttonText}>Trigger Backend Test Push</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={testForeground}>
          <Text style={styles.buttonText}>Test Foreground</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Logs:</Text>
        <View style={styles.logContainer}>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logText}>
              {log}
            </Text>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  logContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    maxHeight: 200,
    marginBottom: 12,
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
});
