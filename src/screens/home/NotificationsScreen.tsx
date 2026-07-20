import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import {
  notificationHistoryService,
  StoredNotification,
} from '../../services/notificationHistoryService';
import { notificationEvents } from '../../utils/notificationEvents';
import { useFocusEffect } from '@react-navigation/native';

type NotificationsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Notifications'
>;

type NotificationsScreenProps = {
  navigation: NotificationsNavigationProp;
};

const getRelativeTime = (isoDate: string): string => {
  const value = new Date(isoDate).getTime();
  if (Number.isNaN(value)) {
    return 'Just now';
  }

  const diffMs = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
};

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [items, setItems] = React.useState<StoredNotification[]>([]);

  const loadNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const notifications = await notificationHistoryService.getAll();
      setItems(notifications);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        // Mark all as read when opening notifications screen
        await notificationHistoryService.markAllRead();
        // notify subscribers that there are zero unread
        try {
          notificationEvents.emit(0);
        } catch {}
        await loadNotifications();
      })();
    }, [loadNotifications]),
  );

  const handleClearAll = React.useCallback(async () => {
    await notificationHistoryService.clear();
    setItems([]);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#494949" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {items.length > 0 ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#B95E82" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Bell size={22} color="#8E8E8E" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications Yet</Text>
          <Text style={styles.emptySubtitle}>
            Notifications you receive will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardTime}>{getRelativeTime(item.receivedAt)}</Text>
              </View>
              <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F6F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#494949',
  },
  headerSpacer: {
    width: 36,
  },
  clearButton: {
    width: 48,
    alignItems: 'flex-end',
  },
  clearButtonText: {
    fontFamily: 'Satoshi-Medium',
    color: '#B95E82',
    fontSize: 14,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: 'Satoshi-Bold',
    color: '#3F3F3F',
    fontSize: 20,
    flex: 1,
    paddingRight: 12,
  },
  cardTime: {
    fontFamily: 'Satoshi-Regular',
    color: '#A0A0A0',
    fontSize: 13,
  },
  cardBody: {
    fontFamily: 'Satoshi-Regular',
    color: '#606060',
    fontSize: 15,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#494949',
  },
  emptySubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8C8C8C',
  },
});

export default NotificationsScreen;