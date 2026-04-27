import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import {
  fetchNotifications,
  markNotificationRead,
  getCurrentUserId,
  type Black94Notification,
} from '../lib/db';
import NotificationItem from '../components/NotificationItem';
import { colors } from '../theme/colors';

type RootStackParamList = {
  UserProfile: { userId: string };
  ChatRoom: { chatId: string; otherUserId: string; otherUserName: string; otherUserImage?: string };
  PostDetail: { postId: string };
};

export default function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [notifications, setNotifications] = useState<Black94Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const viewedIdsRef = useRef<Set<string>>(new Set());

  // ── Load notifications ─────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      setLoading(true);
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error('[NotificationsScreen] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Real-time listener ─────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const userId = getCurrentUserId();
      if (!userId) return;

      loadNotifications();

      const unsub = firestore()
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(
          () => {
            loadNotifications();
          },
          (err) =>
            console.warn(
              '[NotificationsScreen] listener error:',
              err,
            ),
        );

      return () => unsub();
    }, [loadNotifications]),
  );

  // ── Pull to refresh ────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  // ── Group notifications by time ────────────────────────────────────────
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { title: string; data: Black94Notification[] }[] = [
      { title: 'Today', data: [] },
      { title: 'Earlier', data: [] },
      { title: 'This Week', data: [] },
      { title: 'Earlier This Month', data: [] },
    ];

    notifications.forEach((notif) => {
      const date = new Date(notif.createdAt);

      if (date >= today) {
        groups[0].data.push(notif);
      } else if (date >= yesterday) {
        groups[1].data.push(notif);
      } else if (date >= weekAgo) {
        groups[2].data.push(notif);
      } else {
        groups[3].data.push(notif);
      }
    });

    // Remove empty groups
    return groups.filter((g) => g.data.length > 0);
  }, [notifications]);

  // ── Mark as read on view ───────────────────────────────────────────────
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach((item: any) => {
      const notif = item.item as Black94Notification;
      if (notif && !notif.read && !viewedIdsRef.current.has(notif.id)) {
        viewedIdsRef.current.add(notif.id);
        markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, read: true } : n,
          ),
        );
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
  }).current;

  // ── Handle notification press ──────────────────────────────────────────
  const handleNotificationPress = useCallback(
    (notification: Black94Notification) => {
      // Mark as read
      if (!notification.read) {
        markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
      }

      // Navigate based on type
      switch (notification.type) {
        case 'follow':
          navigation.navigate('UserProfile', {
            userId: notification.actorId,
          });
          break;
        case 'message':
          // Navigate to chat - would need chatId, navigate to ChatList for now
          navigation.navigate('ChatRoom' as never, {
            chatId: '',
            otherUserId: notification.actorId,
            otherUserName: notification.actorName,
            otherUserImage: notification.actorProfileImage,
          } as never);
          break;
        case 'like':
        case 'comment':
        case 'mention':
        case 'repost':
          if (notification.postId) {
            navigation.navigate('PostDetail' as never, {
              postId: notification.postId,
            } as never);
          } else {
            navigation.navigate('UserProfile', {
              userId: notification.actorId,
            });
          }
          break;
        default:
          navigation.navigate('UserProfile', {
            userId: notification.actorId,
          });
          break;
      }
    },
    [navigation],
  );

  // ── Render section header ──────────────────────────────────────────────
  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    [],
  );

  // ── Render notification item ───────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Black94Notification }) => (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
      />
    ),
    [handleNotificationPress],
  );

  // ── Empty state ────────────────────────────────────────────────────────
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="notifications-outline"
          size={64}
          color={colors.textTertiary}
        />
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptySubtitle}>
          When someone interacts with you, you'll see it here
        </Text>
      </View>
    );
  }, [loading]);

  // ── Unread count ───────────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={async () => {
              const userId = getCurrentUserId();
              if (!userId) return;
              const unread = notifications.filter((n) => !n.read);
              await Promise.all(unread.map((n) => markNotificationRead(n.id)));
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true })),
              );
            }}
            style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification list */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : undefined
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginHorizontal: 70,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
