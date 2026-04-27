import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { checkIsFollowing, toggleFollow, type Black94User } from '../lib/db';
import { getCurrentUserId } from '../lib/db';
import { colors } from '../theme/colors';

interface UserListItemProps {
  user: Black94User;
  showFollow?: boolean;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onPress?: () => void;
  compact?: boolean;
}

function UserListItem({
  user,
  showFollow = false,
  onFollow,
  onUnfollow,
  onPress,
  compact = false,
}: UserListItemProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUserId = getCurrentUserId();

  // ── Check initial follow status ────────────────────────────────────────
  useEffect(() => {
    if (showFollow && currentUserId && currentUserId !== user.uid) {
      checkIsFollowing(currentUserId, user.uid).then(setIsFollowing);
    }
  }, [showFollow, currentUserId, user.uid]);

  // ── Handle follow/unfollow ─────────────────────────────────────────────
  const handleToggleFollow = useCallback(async () => {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollow(currentUserId, user.uid);
      setIsFollowing(result);
      if (result) {
        onFollow?.(user.uid);
      } else {
        onUnfollow?.(user.uid);
      }
    } catch (err) {
      console.error('[UserListItem] toggleFollow error:', err);
    } finally {
      setFollowLoading(false);
    }
  }, [currentUserId, user.uid, followLoading, onFollow, onUnfollow]);

  // ── Determine badge color ──────────────────────────────────────────────
  const badgeColor =
    user.badge === 'gold' ? colors.verifiedGold : colors.verifiedBlue;

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}>
      {/* Avatar */}
      <Image
        source={
          user.profileImage
            ? { uri: user.profileImage }
            : require('../../assets/default-avatar.png')
        }
        style={[styles.avatar, compact && styles.avatarCompact]}
      />

      {/* User info */}
      <View style={[styles.info, compact && styles.infoCompact]}>
        {/* Name row with verified badge */}
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user.displayName}
          </Text>
          {user.isVerified && (
            <Icon
              name="checkmark-circle"
              size={14}
              color={badgeColor}
              style={styles.verifiedBadge}
            />
          )}
          {user.badge !== '' && user.badge !== 'blue' && (
            <Icon
              name="checkmark-circle"
              size={14}
              color={badgeColor}
              style={styles.verifiedBadge}
            />
          )}
        </View>

        {/* Username */}
        <Text style={styles.username} numberOfLines={1}>
          @{user.username}
        </Text>

        {/* Bio (1 line only) */}
        {user.bio && !compact ? (
          <Text style={styles.bio} numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>

      {/* Follow button */}
      {showFollow && currentUserId !== user.uid && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing
              ? styles.followingButton
              : styles.notFollowingButton,
          ]}
          onPress={handleToggleFollow}
          disabled={followLoading}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {followLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? colors.textPrimary : colors.white}
            />
          ) : (
            <Text
              style={[
                styles.followButtonText,
                isFollowing
                  ? styles.followingText
                  : styles.notFollowingText,
              ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  containerCompact: {
    paddingVertical: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  avatarCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  infoCompact: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 4,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  username: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  bio: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: colors.borderLight,
  },
  notFollowingButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  followingText: {
    color: colors.textPrimary,
  },
  notFollowingText: {
    color: colors.white,
  },
});

export default memo(UserListItem);
