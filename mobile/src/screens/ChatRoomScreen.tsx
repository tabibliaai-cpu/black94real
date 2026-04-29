import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Modal, Image as RNImage } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {
  sendMessage,
  fetchMessages,
  markMessagesAsSeen,
  getCurrentUserId,
  uploadImage,
  type Message,
} from '../lib/db';
import ChatInputBar from '../components/ChatInputBar';
import { colors } from '../theme/colors';
import { Colors } from '../theme';

type RootStackParamList = {
  ChatRoom: {
    chatId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserImage?: string;
  };
  ImageViewer: { imageUrl: string };
};

type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen() {
  const route = useRoute<ChatRoomRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { chatId, otherUserId, otherUserName, otherUserImage } = route.params;
  const currentUserId = getCurrentUserId() ?? '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Set header ─────────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() =>
            navigation.navigate('UserProfile' as never, {
              userId: otherUserId,
            } as never)
          }>
          <Image
            source={
              otherUserImage
                ? { uri: otherUserImage }
                : require('../../assets/default-avatar.png')
            }
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUserName}
              </Text>
            </View>
            <Text style={[styles.headerStatus, { color: isOnline ? colors.success : colors.textTertiary }]}>
              {isTyping
                ? 'typing...'
                : isOnline
                ? 'Online'
                : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#000000', // Match app bg
      },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
      headerBackTitleVisible: false,
    });
  }, [navigation, otherUserId, otherUserName, otherUserImage, isTyping, isOnline]);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await fetchMessages(chatId, 50);
        setMessages(data);
      } catch (err) {
        console.error('[ChatRoomScreen] loadMessages error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Mark messages as seen
    if (currentUserId) {
      markMessagesAsSeen(chatId, currentUserId);
    }
  }, [chatId, currentUserId]);

  // ── Firestore real-time listener for messages ──────────────────────────
  useEffect(() => {
    const unsub = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const newMessages = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              chatId: doc.data().chatId ?? '',
              senderId: doc.data().senderId ?? '',
              receiverId: doc.data().receiverId ?? '',
              content: doc.data().content ?? '',
              messageType: doc.data().messageType ?? 'text',
              mediaUrl: doc.data().mediaUrl ?? null,
              status: doc.data().status ?? 'sent',
              createdAt: (() => {
                const t = doc.data().createdAt;
                if (t && typeof t === 'object' && 'seconds' in t) {
                  const ts = t as { seconds: number; nanoseconds: number };
                  return new Date(ts.seconds * 1000 + ts.nanoseconds / 1_000_000).toISOString();
                }
                if (t instanceof Date) return t.toISOString();
                return String(t ?? new Date().toISOString());
              })(),
            }))
            .reverse();

          setMessages(newMessages);

          // Mark incoming messages as seen
          const hasUnseen = newMessages.some(
            (m) => m.senderId !== currentUserId && m.status !== 'seen',
          );
          if (hasUnseen && currentUserId) {
            markMessagesAsSeen(chatId, currentUserId);
          }
        },
        (err) =>
          console.error('[ChatRoomScreen] message listener error:', err),
      );

    return () => unsub();
  }, [chatId, currentUserId]);

  // ── Listen for typing indicator ────────────────────────────────────────
  useEffect(() => {
    const typingRef = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('typing')
      .doc(otherUserId);

    const unsub = typingRef.onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data?.isTyping === true) {
          setIsTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      unsub();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, otherUserId]);

  // ── Listen for online status (presence) ────────────────────────────────
  useEffect(() => {
    const statusRef = firestore()
      .collection('users')
      .doc(otherUserId);

    const unsub = statusRef.onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data();
          setIsOnline(data?.isOnline ?? false);
        }
      },
      (err) =>
        console.error('[ChatRoomScreen] presence listener error:', err),
    );

    // Set current user online
    if (currentUserId) {
      firestore()
        .collection('users')
        .doc(currentUserId)
        .update({ isOnline: true, lastSeen: firestore.FieldValue.serverTimestamp() })
        .catch(() => {});
    }

    return () => {
      unsub();
      // Set current user offline on unmount
      if (currentUserId) {
        firestore()
          .collection('users')
          .doc(currentUserId)
          .update({ isOnline: false, lastSeen: firestore.FieldValue.serverTimestamp() })
          .catch(() => {});
      }
    };
  }, [chatId, otherUserId, currentUserId]);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure the FlatList has updated
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ── Send message handler ───────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string, messageType: string, mediaUrl?: string) => {
      if (sending) return;
      setSending(true);
      try {
        await sendMessage(
          chatId,
          currentUserId,
          otherUserId,
          text,
          messageType as 'text' | 'image' | 'video',
          mediaUrl ?? null,
        );
      } catch (err) {
        console.error('[ChatRoomScreen] send error:', err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setSending(false);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    },
    [chatId, currentUserId, otherUserId, sending],
  );

  // ── Typing handler ─────────────────────────────────────────────────────
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!currentUserId) return;
      firestore()
        .collection('chats')
        .doc(chatId)
        .collection('typing')
        .doc(currentUserId)
        .set({
          isTyping,
          timestamp: firestore.FieldValue.serverTimestamp(),
        })
        .catch(() => {});
    },
    [chatId, currentUserId],
  );

  // ── Open image viewer ──────────────────────────────────────────────────
  const openImage = useCallback((url: string) => {
    setViewingImageUrl(url);
    setImageViewerVisible(true);
  }, []);

  // ── Format time ────────────────────────────────────────────────────────
  const formatMessageTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return time;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
  }, []);

  // ── Render delivery status icon ────────────────────────────────────────
  const renderStatusIcon = useCallback(
    (status: string, isMine: boolean) => {
      if (!isMine) return null;
      switch (status) {
        case 'sent':
          return (
            <Icon
              name="checkmark"
              size={14}
              color={colors.textTertiary}
              style={styles.statusIcon}
            />
          );
        case 'delivered':
          return (
            <Icon
              name="checkmark-done"
              size={14}
              color={colors.textTertiary}
              style={styles.statusIcon}
            />
          );
        case 'seen':
          return (
            <Icon
              name="checkmark-done"
              size={14}
              color={Colors.primary} // White for seen
              style={styles.statusIcon}
            />
          );
        default:
          return (
            <Icon
              name="time"
              size={12}
              color={colors.textTertiary}
              style={styles.statusIcon}
            />
          );
      }
    },
    [],
  );

  // ── Group messages by date ─────────────────────────────────────────────
  const groupedMessages = useMemo(() => {
    const groups: { title: string; data: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const msgDate = new Date(message.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        const today = new Date().toDateString();
        const yesterday = new Date(
          Date.now() - 86400000,
        ).toDateString();

        let title: string;
        if (msgDate === today) title = 'Today';
        else if (msgDate === yesterday) title = 'Yesterday';
        else
          title = new Date(message.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });

        groups.push({ title, data: [] });
      }
      groups[groups.length - 1].data.push(message);
    });

    return groups;
  }, [messages]);

  // ── Render message bubble ──────────────────────────────────────────────
  const renderMessageBubble = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = item.senderId === currentUserId;
      const isConsecutive = false; // Could implement consecutive grouping
      const showTime = true;

      // Image message
      if (item.messageType === 'image' && item.mediaUrl) {
        return (
          <View
            style={[
              styles.messageWrapper,
              isMine ? styles.mineWrapper : styles.theirsWrapper,
            ]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openImage(item.mediaUrl!)}>
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.messageImage}
                resizeMode="cover"
                defaultSource={require('../../assets/image-placeholder.png')}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.timeRow,
                isMine ? styles.mineTimeRow : styles.theirsTimeRow,
              ]}>
              <Text style={styles.messageTime}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {renderStatusIcon(item.status, isMine)}
            </View>
          </View>
        );
      }

      // Video message
      if (item.messageType === 'video' && item.mediaUrl) {
        return (
          <View
            style={[
              styles.messageWrapper,
              isMine ? styles.mineWrapper : styles.theirsWrapper,
            ]}>
            <TouchableOpacity activeOpacity={0.9}>
              <View style={styles.videoContainer}>
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                  defaultSource={require('../../assets/image-placeholder.png')}
                />
                <View style={styles.playButton}>
                  <Icon name="play" size={28} color={colors.white} />
                </View>
              </View>
            </TouchableOpacity>
            <View
              style={[
                styles.timeRow,
                isMine ? styles.mineTimeRow : styles.theirsTimeRow,
              ]}>
              <Text style={styles.messageTime}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {renderStatusIcon(item.status, isMine)}
            </View>
          </View>
        );
      }

      // Text message
      return (
        <View
          style={[
            styles.messageWrapper,
            isMine ? styles.mineWrapper : styles.theirsWrapper,
          ]}>
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.mineBubble : styles.theirsBubble,
            ]}>
            <Text
              style={[
                styles.messageText,
                isMine ? styles.mineText : styles.theirsText,
              ]}>
              {item.content}
            </Text>
          </View>
          <View
            style={[
              styles.timeRow,
              isMine ? styles.mineTimeRow : styles.theirsTimeRow,
            ]}>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {renderStatusIcon(item.status, isMine)}
          </View>
        </View>
      );
    },
    [currentUserId, formatMessageTime, openImage, renderStatusIcon],
  );

  // ── Render section header (date separator) ─────────────────────────────
  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.dateSeparator}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{section.title}</Text>
        <View style={styles.dateSeparatorLine} />
      </View>
    ),
    [],
  );

  // ── Empty / loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Icon
                name="chatbubble-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>
                No messages yet. Say hi!
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={() => {}}
        />

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
            <Text style={styles.typingText}>{otherUserName} is typing</Text>
          </View>
        )}

        {/* Input bar */}
        <ChatInputBar
          onSend={handleSend}
          onTyping={handleTyping}
          chatId={chatId}
        />
      </KeyboardAvoidingView>

      {/* Image viewer modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <TouchableOpacity
          style={styles.imageViewerOverlay}
          activeOpacity={1}
          onPress={() => setImageViewerVisible(false)}
        >
          <RNImage
            source={{ uri: viewingImageUrl }}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setImageViewerVisible(false)}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Icon name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  // Header
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: colors.surfaceElevated,
  },
  headerInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Message list
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 15,
    marginTop: 12,
  },
  // Date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  // Message wrapper
  messageWrapper: {
    marginBottom: 4,
    maxWidth: Dimensions.get('window').width * 0.78,
  },
  mineWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirsWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  // Message bubble
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  mineBubble: {
    backgroundColor: colors.messageMine, // WHITE (matching web .bubble-sent)
    borderBottomRightRadius: 4,
  },
  theirsBubble: {
    backgroundColor: colors.messageTheirs, // Dark surface (matching web .bubble-received)
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  mineText: {
    color: colors.messageMineText,
  },
  theirsText: {
    color: colors.messageTheirsText,
  },
  // Time + status row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginRight: 4,
  },
  mineTimeRow: {
    justifyContent: 'flex-end',
  },
  theirsTimeRow: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  statusIcon: {
    marginLeft: 4,
  },
  // Image message
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
  },
  // Video message
  videoContainer: {
    width: 220,
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  typingBubble: {
    width: 36,
    height: 28,
    backgroundColor: colors.messageTheirs,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
  typingDot1: {},
  typingDot2: {},
  typingDot3: {},
  // Image viewer
  typingText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  // Image viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
});
