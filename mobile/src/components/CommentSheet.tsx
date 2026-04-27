import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import type { CommentData } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { fetchPostComments, addPostComment } from '../lib/db';
import Avatar from './Avatar';

// ── Constants ────────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.75, 580);

const COLORS = {
  bg: '#000000',
  surface: '#111111',
  surfaceLight: '#18181b',
  textPrimary: '#e7e9ea',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  blue: '#3b82f6',
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ── Props ────────────────────────────────────────────────────────────────────

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

// ── Component ────────────────────────────────────────────────────────────────

const CommentSheet: React.FC<CommentSheetProps> = ({
  visible,
  onClose,
  postId,
}) => {
  const rawUser = useAppStore((s) => s.user);
  const user = rawUser
    ? {
        uid: (rawUser.uid as string) ?? '',
        username: (rawUser.username as string) ?? '',
        displayName: (rawUser.displayName as string) ?? '',
        profileImage: (rawUser.profileImage as string) ?? '',
        isVerified: (rawUser.isVerified as boolean) ?? false,
        badge: (rawUser.badge as string) ?? '',
      }
    : null;

  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const translateY = useSharedValue(0);

  // Fetch comments when sheet opens
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchPostComments(postId)
      .then((fetched) => {
        setComments(fetched);
      })
      .catch((err) => {
        console.error('[CommentSheet] Failed to fetch comments:', err);
      })
      .finally(() => {
        setLoading(false);
        // Scroll to bottom after load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });
  }, [visible, postId]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!visible) {
      setComments([]);
      setNewComment('');
      setSending(false);
      translateY.value = 0;
    }
  }, [visible, translateY]);

  // Animated sheet style
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 250 }),
  }));

  // Pan gesture to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        // Dismiss
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
          if (visible) {
            runOnJS(onClose)();
          }
        });
      } else {
        // Snap back
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const handleSend = useCallback(async () => {
    if (!newComment.trim() || sending || !user) return;

    const content = newComment.trim();
    setNewComment('');
    setSending(true);

    // Optimistic add
    const tempId = `temp_${Date.now()}`;
    const optimistic: CommentData = {
      id: tempId,
      postId,
      authorId: user.uid,
      authorUsername: user.username,
      authorDisplayName: user.displayName,
      authorProfileImage: user.profileImage,
      authorIsVerified: user.isVerified,
      authorBadge: user.badge,
      content,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const real = await addPostComment(postId, user.uid, content, {
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        badge: user.badge,
      });

      // Replace optimistic with real
      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? { ...real, postId }
            : c,
        ),
      );
    } catch (err) {
      console.error('[CommentSheet] Failed to add comment:', err);
      // Remove optimistic on error
      setComments((prev) => prev.filter((c) => c.id !== tempId));
    } finally {
      setSending(false);
    }
  }, [newComment, sending, user, postId]);

  const renderItem = useCallback(
    ({ item }: { item: CommentData }) => (
      <View style={styles.commentRow}>
        <Avatar
          uri={item.authorProfileImage}
          name={item.authorDisplayName || item.authorUsername}
          size={32}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentName} numberOfLines={1}>
              {item.authorDisplayName || item.authorUsername}
            </Text>
            {item.authorIsVerified && (
              <View style={styles.verifiedDot}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
            <Text style={styles.commentUsername}>@{item.authorUsername}</Text>
            <Text style={styles.commentDot}>·</Text>
            <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: CommentData) => item.id, []);

  const listEmptyComponent = useMemo(
    () =>
      !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💭</Text>
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share your thoughts
          </Text>
        </View>
      ) : null,
    [loading],
  );

  const listFooter = useMemo(
    () =>
      sending ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.sendingText}>Posting...</Text>
        </View>
      ) : null,
    [sending],
  );

  if (!visible && translateY.value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          style={StyleSheet.absoluteFill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Backdrop */}
          <Animated.View
            style={[styles.backdrop, backdropAnimatedStyle]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={onClose}
            />
          </Animated.View>

          {/* Sheet */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.sheet, sheetAnimatedStyle]}
            >
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handleBar} />
              </View>

              {/* Header */}
              <View style={styles.sheetHeader}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Post</Text>
                <View style={styles.closeButtonPlaceholder} />
              </View>

              {/* Comments list */}
              {loading && comments.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.blue} />
                  <Text style={styles.loadingText}>Loading comments...</Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={comments}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  ListEmptyComponent={listEmptyComponent}
                  ListFooterComponent={listFooter}
                  contentContainerStyle={styles.commentsList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              )}

              {/* Input bar */}
              <View style={styles.inputBar}>
                <Avatar
                  uri={user?.profileImage}
                  name={user?.displayName}
                  size={32}
                />
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Post your reply..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    maxLength={500}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    newComment.trim()
                      ? styles.sendButtonActive
                      : styles.sendButtonInactive,
                  ]}
                  onPress={handleSend}
                  disabled={!newComment.trim() || sending}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sendIcon,
                      newComment.trim()
                        ? styles.sendIconActive
                        : styles.sendIconInactive,
                    ]}
                  >
                    ➤
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderLight,
    borderStyle: 'solid',
    borderBottomWidth: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '400',
  },
  closeButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  commentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  verifiedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  commentUsername: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  commentDot: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  commentTime: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  commentText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  sendingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
    margin: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: COLORS.blue,
  },
  sendButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  sendIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  sendIconActive: {
    color: '#ffffff',
  },
  sendIconInactive: {
    color: COLORS.textMuted,
  },
});

export default React.memo(CommentSheet);
