import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { firestore } from '../lib/db';
import { fetchChats, deleteChat, getCurrentUserId, type Chat } from '../lib/db';
import { colors } from '../theme/colors';

type RootStackParamList = {
  ChatRoom: { chatId: string; otherUserId: string; otherUserName: string; otherUserImage?: string };
  UserProfile: { userId: string };
};

export default function ChatListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<() => void>(() => {});

  // ── Load chats on focus ─────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      setLoading(true);
      const data = await fetchChats(userId);
      setChats(data);
    } catch (err) {
      console.error('[ChatListScreen] loadChats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Firestore real-time listener ────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const userId = getCurrentUserId();
      if (!userId) return;

      // Initial fetch with other user info
      loadChats();

      // Real-time listener: listen to both user1Id and user2Id
      const unsub1 = firestore()
        .collection('chats')
        .where('user1Id', '==', userId)
        .onSnapshot(
          () => {
            // Re-fetch to get enriched data with otherUser info
            loadChats();
          },
          (err) => console.warn('[ChatListScreen] listener error (user1):', err),
        );

      const unsub2 = firestore()
        .collection('chats')
        .where('user2Id', '==', userId)
        .onSnapshot(
          () => {
            loadChats();
          },
          (err) => console.warn('[ChatListScreen] listener error (user2):', err),
        );

      unsubscribeRef.current = () => {
        unsub1();
        unsub2();
      };

      return () => {
        unsubscribeRef.current();
      };
    }, [loadChats]),
  );

  // ── Pull to refresh ────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  // ── Filtered chats ─────────────────────────────────────────────────────
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      const name =
        chat.otherUser?.displayName?.toLowerCase() ??
        chat.otherUser?.username?.toLowerCase() ??
        '';
      return name.includes(q);
    });
  }, [chats, searchQuery]);

  // ── Format timestamp ───────────────────────────────────────────────────
  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // ── Get last message preview ───────────────────────────────────────────
  const getLastMessage = useCallback(
    (chat: Chat) => {
      if (chat.lastMessage) {
        const text = chat.lastMessage.content;
        if (chat.lastMessage.messageType === 'image') return '📷 Photo';
        if (chat.lastMessage.messageType === 'video') return '🎥 Video';
        return text.length > 45 ? text.slice(0, 45) + '...' : text;
      }
      return 'No messages yet';
    },
    [],
  );

  // ── Swipe to delete ────────────────────────────────────────────────────
  const handleDeleteChat = useCallback(
    (chatId: string) => {
      Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChat(chatId);
            setChats((prev) => prev.filter((c) => c.id !== chatId));
          },
        },
      ]);
    },
    [],
  );

  // ── Navigate to chat room ──────────────────────────────────────────────
  const openChat = useCallback(
    (chat: Chat) => {
      const otherUserId =
        chat.user1Id === getCurrentUserId() ? chat.user2Id : chat.user1Id;
      navigation.navigate('ChatRoom', {
        chatId: chat.id,
        otherUserId,
        otherUserName:
          chat.otherUser?.displayName ?? chat.otherUser?.username ?? 'User',
        otherUserImage: chat.otherUser?.profileImage,
      });
    },
    [navigation],
  );

  // ── Render chat item ───────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item: chat }: { item: Chat }) => {
      const otherUser = chat.otherUser;
      const displayName = otherUser?.displayName ?? otherUser?.username ?? 'Unknown';
      const profileImage = otherUser?.profileImage;

      return (
        <SwipeableRow onDelete={() => handleDeleteChat(chat.id)}>
          <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.7}
            onPress={() => openChat(chat)}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require('../../assets/default-avatar.png')
                }
                style={styles.avatar}
              />
              {/* Online indicator would need real-time presence; showing offline dot */}
              <View style={[styles.onlineDot, styles.offlineDot]} />
            </View>

            {/* Content */}
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.chatName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {otherUser?.isVerified && (
                    <Icon
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                      style={styles.verifiedBadge}
                    />
                  )}
                </View>
                <Text style={styles.chatTime}>
                  {formatTime(chat.updatedAt)}
                </Text>
              </View>

              <View style={styles.messageRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {getLastMessage(chat)}
                </Text>
                {chat.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </SwipeableRow>
      );
    },
    [formatTime, getLastMessage, handleDeleteChat, openChat],
  );

  // ── Empty state ────────────────────────────────────────────────────────
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubble-ellipses-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a chat by visiting someone's profile
        </Text>
      </View>
    );
  }, [loading]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat list */}
      <FlatList
        data={filteredChats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredChats.length === 0 ? styles.emptyList : undefined
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        windowSize={10}
        maxToRenderPerBatch={5}
        initialNumToRender={10}
      />
    </View>
  );
}

// ── Swipeable row component ─────────────────────────────────────────────────

import {
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const [translateX, setTranslateX] = useState(0);
  const SWIPE_THRESHOLD = -80;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        setTranslateX(Math.max(e.translationX, -200));
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        setTranslateX(-100);
      } else {
        setTranslateX(0);
      }
    });

  return (
    <View style={styles.swipeContainer}>
      {/* Delete action background */}
      <View style={styles.deleteAction}>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Icon name="trash-outline" size={22} color={colors.white} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground content */}
      <GestureDetector gesture={panGesture}>
        <AnimatedView
          style={[
            styles.foregroundContent,
            { transform: [{ translateX }] },
          ]}>
          {children}
        </AnimatedView>
      </GestureDetector>
    </View>
  );
}

// Quick Animated wrapper since we can't use Reanimated in a simple import
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function AnimatedView({ style, children }: { style: any; children: React.ReactNode }) {
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  offlineDot: {
    backgroundColor: colors.textTertiary,
  },
  chatContent: {
    flex: 1,
    marginLeft: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
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
  },
  // Swipe styles
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  foregroundContent: {
    backgroundColor: colors.background,
  },
});
