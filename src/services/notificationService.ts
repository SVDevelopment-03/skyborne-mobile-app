import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;

export type NotificationPlatform = 'ios' | 'android';

type NotificationPreferences = {
  broadcast: boolean;
  session: boolean;
  other: boolean;
};

class NotificationService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';
  private deviceIdKey = '@device_id';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    console.log('[NotificationService] configured', {
      apiBaseUrl: API_BASE_URL,
      isDev: __DEV__,
    });

    this.attachAuthInterceptor(this.api);
  }

  private attachAuthInterceptor(client: AxiosInstance) {
    client.interceptors.request.use(async config => {
      const token = await AsyncStorage.getItem(this.authTokenKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private async postWithFallback(url: string, payload: Record<string, unknown>) {
    return this.api.post(url, payload);
  }

  private getPlatform(): NotificationPlatform {
    return Platform.OS === 'ios' ? 'ios' : 'android';
  }

  async getOrCreateDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(this.deviceIdKey);
    if (existing) {
      return existing;
    }

    const created = `${Platform.OS}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;
    await AsyncStorage.setItem(this.deviceIdKey, created);
    return created;
  }

  async registerDeviceToken(
    token: string,
    preferences: Partial<NotificationPreferences> = {}
  ): Promise<void> {
    const deviceId = await this.getOrCreateDeviceId();
    const resolvedPreferences: NotificationPreferences = {
      broadcast: preferences.broadcast ?? true,
      session: preferences.session ?? true,
      other: preferences.other ?? true,
    };

    console.log('[NotificationService] registerDeviceToken:request', {
      apiBaseUrl: API_BASE_URL,
      tokenPrefix: token.slice(0, 24),
      preferences: resolvedPreferences,
    });

    try {
      await this.postWithFallback('/notifications/device-token/register', {
        token,
        platform: this.getPlatform(),
        deviceId,
        optInBroadcast: resolvedPreferences.broadcast,
        optInSession: resolvedPreferences.session,
        optInOther: resolvedPreferences.other,
      });
    } catch (error) {
      // Backward compatibility: some environments still accept only broadcast flag.
      await this.postWithFallback('/notifications/device-token/register', {
        token,
        platform: this.getPlatform(),
        deviceId,
        optInBroadcast: resolvedPreferences.broadcast,
      });
    }

    console.log('[NotificationService] registerDeviceToken:done', {
      apiBaseUrl: API_BASE_URL,
      tokenPrefix: token.slice(0, 24),
      preferences: resolvedPreferences,
    });
  }

  async unregisterDeviceToken(token: string): Promise<void> {
    await this.postWithFallback('/notifications/device-token/unregister', {
      token,
    });
  }

  async sendTestNotification(payload?: {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<{ message?: string; data?: Record<string, unknown> }> {
    const response = await this.postWithFallback('/notifications/test', payload || {});
    return response.data;
  }
}

export const notificationService = new NotificationService();
