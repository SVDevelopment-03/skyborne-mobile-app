import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';

const NOTIFICATION_HISTORY_KEY = '@notification_history';
const MAX_NOTIFICATION_HISTORY = 100;

export type StoredNotification = {
  id: string;
  messageId?: string;
  title: string;
  body: string;
  receivedAt: string;
  source: 'foreground' | 'background' | 'quit';
  read?: boolean;
  data?: Record<string, string>;
};

type NotificationInput = {
  messageId?: string;
  title?: string;
  body?: string;
  source: 'foreground' | 'background' | 'quit';
  data?: Record<string, string>;
};

class NotificationHistoryService {
  private getCurrentUserId(): string | undefined {
    const user = store.getState().auth.user as { id?: string; _id?: string } | undefined;
    return user?.id || user?._id;
  }

  private getScopedKey(userId?: string): string {
    const resolvedUserId = userId || this.getCurrentUserId();
    return resolvedUserId ? `${NOTIFICATION_HISTORY_KEY}:${resolvedUserId}` : NOTIFICATION_HISTORY_KEY;
  }

  private async readHistory(): Promise<StoredNotification[]> {
    try {
      const scopedKey = this.getScopedKey();
      const raw = await AsyncStorage.getItem(scopedKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.filter(Boolean);
      }

      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return [];
      }

      const legacyRaw = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      if (!legacyRaw) {
        return [];
      }

      const legacyParsed = JSON.parse(legacyRaw);
      if (!Array.isArray(legacyParsed)) {
        return [];
      }

      const migrated = legacyParsed.filter(Boolean);
      if (migrated.length > 0) {
        await this.writeHistory(migrated);
        await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
      }

      return migrated;
    } catch {
      return [];
    }
  }

  private async writeHistory(items: StoredNotification[]): Promise<void> {
    await AsyncStorage.setItem(this.getScopedKey(), JSON.stringify(items));
  }

  async getAll(): Promise<StoredNotification[]> {
    return this.readHistory();
  }

  async countUnread(): Promise<number> {
    const history = await this.readHistory();
    return history.filter(item => !item.read).length;
  }

  async markAllRead(): Promise<void> {
    const history = await this.readHistory();
    const updated = history.map(item => ({ ...item, read: true }));
    await this.writeHistory(updated);
  }

  async markRead(id: string): Promise<void> {
    const history = await this.readHistory();
    const updated = history.map(item => (item.id === id ? { ...item, read: true } : item));
    await this.writeHistory(updated);
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(this.getScopedKey());
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
  }

  async clearForUser(userId: string): Promise<void> {
    await AsyncStorage.removeItem(this.getScopedKey(userId));
  }

  async add(input: NotificationInput): Promise<void> {
    const history = await this.readHistory();

    // Avoid storing duplicate notifications when a messageId is present
    if (
      input.messageId &&
      history.some(item => item.messageId && item.messageId === input.messageId)
    ) {
      return;
    }

    const entry: StoredNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      messageId: input.messageId,
      title: input.title?.trim() || 'Skyborne',
      body: input.body?.trim() || 'You have a new notification.',
      receivedAt: new Date().toISOString(),
      source: input.source,
      data: input.data,
    };

    const next = [entry, ...history].slice(0, MAX_NOTIFICATION_HISTORY);
    await this.writeHistory(next);
  }
}

export const notificationHistoryService = new NotificationHistoryService();