import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { Post } from '../navigation/types';
import Avatar from './Avatar';

// ── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAPTION_COLLAPSED_LINES = 4;
const CAPTION_COLLAPSED_LENGTH = 200;

const COLORS = {
  bg: '#000000',
  surface: '#111111',
  textPrimary: '#e7e9ea',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  red: '#f43f5e',
  green: '#10b981',
  blue: '#3b82f6',
  gold: '#f59e0b',
  yellow: '#facc15',
  white: '#ffffff',
  border: 'rgba(255, 255, 255, 0.06)',
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

function formatCount(n?: number): string {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function parseMediaUrls(raw: string): string[] {
  if (!raw) return [];
  if (raw.startsWith('data:')) return [raw];
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

// ── Icons (inline SVG as components) ─────────────────────────────────────────

const HeartIcon = ({ filled, color }: { filled: boolean; color: string }) => (
  <View style={styles.iconWrap}>
    {filled ? (
      <View style={[styles.svgIcon, { width: 18, height: 18 }]}>
        <Text style={{ color, fontSize: 18 }}>♥</Text>
      </View>
    ) : (
      <View style={[styles.svgIcon, { width: 18, height: 18 }]}>
        <Text style={{ color, fontSize: 18 }}>♡</Text>
      </View>
    )}
  </View>
);

const CommentIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrap}>
    <Text style={{ color, fontSize: 18 }}>💬</Text>
  </View>
);

const RepostIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrap}>
    <Text style={{ color, fontSize: 18 }}>🔁</Text>
  </View>
);

const ShareIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrap}>
    <Text style={{ color, fontSize: 18 }}>📤</Text>
  </View>
);

const BookmarkIcon = ({ filled, color }: { filled: boolean; color: string }) => (
  <View style={styles.iconWrap}>
    <Text style={{ color, fontSize: 18 }}>{filled ? '🔖' : '📑'}</Text>
  </View>
);

const VerifiedBadge: React.FC<{ badge?: string }> = ({ badge }) => {
  if (!badge && badge !== 'blue' && badge !== 'gold') return null;
  const color = badge === 'gold' ? COLORS.gold : COLORS.blue;
  return (
    <View style={[styles.badgeCircle, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>✓</Text>
    </View>
  );
};

// ── Props ────────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPress?: (post: Post) => void;
  currentUserId?: string;
  /** Compact grid mode — shows only a thumbnail */
  compact?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onRepost,
  onBookmark,
  onComment,
  onDelete,
  onPress,
  currentUserId,
  compact = false,
}) => {
  const navigation = useNavigation();

  const mediaUrls = useMemo(() => parseMediaUrls(post.mediaUrls), [post.mediaUrls]);

  // ── Compact grid thumbnail ─────────────────────────────────────────────
  if (compact) {
    return (
      <TouchableOpacity
        style={compactStyles.gridItem}
        onPress={() => {
          onPress?.(post);
          (navigation.navigate as any)('PostDetail', { postId: post.id });
        }}
        activeOpacity={0.8}
      >
        {mediaUrls.length > 0 ? (
          <Image
            source={{ uri: mediaUrls[0] }}
            style={compactStyles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[compactStyles.gridImage, compactStyles.placeholder]}>
            <Text style={compactStyles.placeholderText} numberOfLines={4}>
              {post.caption || 'No media'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ── Full card (existing) ────────────────────────────────────────────────

  // Local optimistic state
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isReposted, setIsReposted] = useState(post.isReposted ?? false);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Sync with parent props
  React.useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikeCount(post.likeCount ?? 0);
    setIsReposted(post.isReposted ?? false);
    setRepostCount(post.repostCount ?? 0);
    setIsBookmarked(post.isBookmarked ?? false);
    setCommentCount(post.commentCount ?? 0);
  }, [post.isLiked, post.likeCount, post.isReposted, post.repostCount, post.isBookmarked, post.commentCount]);

  const mediaUrls = useMemo(() => parseMediaUrls(post.mediaUrls), [post.mediaUrls]);
  const isOwnPost = currentUserId === post.authorId;

  const captionNeedsExpand = useMemo(() => {
    return (post.caption?.length ?? 0) > CAPTION_COLLAPSED_LENGTH;
  }, [post.caption]);

  const displayedCaption = useMemo(() => {
    if (captionExpanded || !captionNeedsExpand) return post.caption ?? '';
    return (post.caption ?? '').slice(0, CAPTION_COLLAPSED_LENGTH);
  }, [post.caption, captionExpanded, captionNeedsExpand]);

  const handleLike = useCallback(() => {
    const newVal = !isLiked;
    setIsLiked(newVal);
    setLikeCount((c) => c + (newVal ? 1 : -1));
    onLike?.(post.id);
  }, [isLiked, onLike, post.id]);

  const handleRepost = useCallback(() => {
    const newVal = !isReposted;
    setIsReposted(newVal);
    setRepostCount((c) => c + (newVal ? 1 : -1));
    onRepost?.(post.id);
  }, [isReposted, onRepost, post.id]);

  const handleBookmark = useCallback(() => {
    const newVal = !isBookmarked;
    setIsBookmarked(newVal);
    onBookmark?.(post.id);
  }, [isBookmarked, onBookmark, post.id]);

  const handleComment = useCallback(() => {
    onComment?.(post.id);
  }, [onComment, post.id]);

  const handleAvatarPress = useCallback(() => {
    (navigation.navigate as any)('UserProfile', { userId: post.authorId });
  }, [navigation, post.authorId]);

  const handleMenuPress = useCallback(() => {
    if (isOwnPost && onDelete) {
      onDelete(post.id);
    }
  }, [isOwnPost, onDelete, post.id]);

  return (
    <View style={styles.card}>
      {/* Repost indicator */}
      {isReposted && (
        <View style={styles.repostRow}>
          <Text style={styles.repostText}>🔁 You shared</Text>
        </View>
      )}

      {/* Author row */}
      <View style={styles.authorRow}>
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
          <Avatar
            uri={post.authorProfileImage}
            name={post.authorDisplayName}
            size={44}
          />
        </TouchableOpacity>

        <View style={styles.authorInfo}>
          <View style={styles.authorNameRow}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.7}
              style={styles.nameButton}
            >
              <Text style={styles.displayName} numberOfLines={1}>
                {post.authorDisplayName || post.authorUsername || 'User'}
              </Text>
            </TouchableOpacity>
            {(post.authorIsVerified || !!post.authorBadge) && (
              <VerifiedBadge badge={post.authorBadge} />
            )}
            <Text style={styles.username} numberOfLines={1}>
              @{post.authorUsername || 'user'}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>

        {/* Menu */}
        <TouchableOpacity
          onPress={handleMenuPress}
          style={styles.menuButton}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuDots}>···</Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            {displayedCaption}
            {captionNeedsExpand && !captionExpanded && (
              <Text
                style={styles.captionMore}
                onPress={() => setCaptionExpanded(true)}
              >
                {' '}more
              </Text>
            )}
          </Text>
        </View>
      ) : null}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <View style={styles.mediaSection}>
          {mediaUrls.length === 1 ? (
            <Image
              source={{ uri: mediaUrls[0] }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          ) : (
            <View>
              <Image
                source={{ uri: mediaUrls[imageIndex] }}
                style={styles.pagerImage}
                resizeMode="cover"
              />
              {/* Dots indicator */}
              <View style={styles.dotsRow}>
                {mediaUrls.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dotIndicator,
                      i === imageIndex
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Fact check badge */}
      {post.factCheck ? (
        <View style={styles.factCheckBadge}>
          <Text style={styles.factCheckText}>✅ Fact-checked</Text>
        </View>
      ) : null}

      {/* Action bar */}
      <View style={styles.actionBar}>
        {/* Heart */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <HeartIcon filled={isLiked} color={isLiked ? COLORS.red : COLORS.textSecondary} />
          {likeCount > 0 ? (
            <Text style={[styles.actionCount, isLiked && { color: COLORS.red }]}>
              {formatCount(likeCount)}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleComment}
          activeOpacity={0.7}
        >
          <CommentIcon color={COLORS.textSecondary} />
          {commentCount > 0 ? (
            <Text style={styles.actionCount}>{formatCount(commentCount)}</Text>
          ) : null}
        </TouchableOpacity>

        {/* Repost */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRepost}
          activeOpacity={0.7}
        >
          <RepostIcon color={isReposted ? COLORS.green : COLORS.textSecondary} />
          {repostCount > 0 ? (
            <Text style={[styles.actionCount, isReposted && { color: COLORS.green }]}>
              {formatCount(repostCount)}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <ShareIcon color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Bookmark */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleBookmark}
          activeOpacity={0.7}
        >
          <BookmarkIcon
            filled={isBookmarked}
            color={isBookmarked ? COLORS.yellow : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  repostRow: {
    marginLeft: 56,
    marginBottom: 4,
  },
  repostText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 2,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  nameButton: {
    marginRight: 0,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  username: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  dot: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  timestamp: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingTop: 2,
  },
  menuDots: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  captionContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  caption: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  captionMore: {
    fontSize: 15,
    color: COLORS.blue,
    fontWeight: '600',
  },
  mediaSection: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  singleImage: {
    width: '100%',
    height: Math.min(SCREEN_WIDTH * 0.85, 510),
  },
  pagerImage: {
    width: '100%',
    aspectRatio: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
    backgroundColor: COLORS.bg,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: COLORS.white,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  factCheckBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  factCheckText: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    maxWidth: 440,
    marginLeft: -4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  iconWrap: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

// ── Compact Styles ────────────────────────────────────────────────────────
const compactStyles = StyleSheet.create({
  gridItem: {
    flex: 1,
    margin: 0.5,
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  placeholder: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default React.memo(PostCard);
