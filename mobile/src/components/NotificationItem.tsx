import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { Black94Notification } from '../lib/db';
import { colors } from '../theme/colors';

interface NotificationItemProps {
  notification: Black94Notification;
  onPress: (notification: Black94Notification) => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { type, actorName, actorProfileImage, actorUsername, message, read, createdAt } =
    notification;

  // ── Notification icon config ───────────────────────────────────────────
  const iconConfig = useMemo(() => {
    switch (type) {
      case 'like':
        return { name: 'heart' as const, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'comment':
        return { name: 'chatbubble' as const, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
      case 'follow':
        return { name: 'person-add' as const, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' };
      case 'message':
        return { name: 'mail' as const, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' };
      case 'mention':
        return { name: 'at' as const, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'repost':
        return { name: 'repeat' as const, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
      case 'engagement':
        return { name: 'trending-up' as const, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
      default:
        return { name: 'notifications' as const, color: colors.primary, bg: colors.primaryTransparent };
    }
  }, [type]);

  // ── Action text based on type ──────────────────────────────────────────
  const actionText = useMemo(() => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return message ?? 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'message':
        return 'sent you a message';
      case 'mention':
        return 'mentioned you';
      case 'repost':
        return 'shared your post';
      case 'engagement':
        return message ?? 'engaged with your content';
      default:
        return message ?? '';
    }
  }, [type, message]);

  // ── Format relative time ───────────────────────────────────────────────
  const formatRelativeTime = useMemo(() => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [createdAt]);

  return (
    <TouchableOpacity
      style={[styles.container, !read && styles.unreadContainer]}
      activeOpacity={0.7}
      onPress={() => onPress(notification)}>
      {/* Unread indicator dot */}
      {!read && <View style={styles.unreadDot} />}

      {/* Actor avatar */}
      <Image
        source={
          actorProfileImage
            ? { uri: actorProfileImage }
            : require('../../assets/default-avatar.png')
        }
        style={styles.avatar}
      />

      {/* Notification icon */}
      <View
        style={[styles.typeIcon, { backgroundColor: iconConfig.bg }]}>
        <Icon name={iconConfig.name} size={16} color={iconConfig.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={[styles.actorName, !read && styles.actorNameUnread]}>
            {actorName}
          </Text>{' '}
          <Text style={styles.actionText}>{actionText}</Text>
        </Text>

        {/* Comment preview */}
        {type === 'comment' && message && (
          <View style={styles.commentPreview}>
            <Text style={styles.commentText} numberOfLines={1}>
              {message.startsWith('commented:') ? message.slice(10).trim() : message}
            </Text>
          </View>
        )}

        <Text style={styles.timestamp}>{formatRelativeTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
    position: 'relative',
  },
  unreadContainer: {
    backgroundColor: colors.surfaceElevated,
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.unreadDot,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    marginRight: 10,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  actorName: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actorNameUnread: {
    color: colors.white,
  },
  actionText: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  commentPreview: {
    marginTop: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: '90%',
  },
  commentText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
});

export default memo(NotificationItem);
