import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type {
  Post,
  FeedScreenNavigationProp,
} from '../navigation/types';
import type { StoryAuthor } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { fetchFeedPosts, fetchStoryAuthors } from '../lib/db';
import { checkPostInteractions, togglePostLike, togglePostRepost, togglePostBookmark } from '../lib/social';
import PostCard from '../components/PostCard';
import StoryRow from '../components/StoryRow';
import CommentSheet from '../components/CommentSheet';
import EmptyState from '../components/EmptyState';

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const COLORS = {
  bg: '#000000',
  surface: '#111111',
  textPrimary: '#e7e9ea',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  blue: '#3b82f6',
  border: 'rgba(255, 255, 255, 0.06)',
} as const;

// ── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonLine, { width: '40%' }]} />
          <View style={[styles.skeletonLine, { width: '25%', marginTop: 4 }]} />
          <View style={[styles.skeletonLine, { width: '100%', marginTop: 10 }]} />
          <View style={[styles.skeletonLine, { width: '75%' }]} />
          <View style={styles.skeletonActions}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonAction} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const rawUser = useAppStore((s) => s.user);
  const feedRefreshKey = useAppStore((s) => s.feedRefreshKey);
  // The store user is Record<string, unknown>; cast fields we need
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

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // Stories
  const [stories, setStories] = useState<StoryAuthor[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Comment sheet state
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);

  const lastDocRef = useRef<any>(null);
  const userRef = useRef(user);
  userRef.current = user;

  // ── Load stories ──────────────────────────────────────────────────────

  const loadStories = useCallback(async () => {
    setStoriesLoading(true);
    try {
      const authors = await fetchStoryAuthors();
      setStories(authors);
    } catch (err) {
      console.error('[FeedScreen] Failed to load stories:', err);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  // ── Enrich posts with live profile data ───────────────────────────────

  const enrichWithLiveProfile = useCallback((postsList: Post[]): Post[] => {
    const u = userRef.current;
    if (!u) return postsList;
    return postsList.map((p) => {
      if (p.authorId === u.uid) {
        return {
          ...p,
          authorProfileImage: u.profileImage || p.authorProfileImage,
          authorIsVerified: u.isVerified || p.authorIsVerified,
          authorBadge: u.badge || p.authorBadge,
          authorDisplayName: u.displayName || p.authorDisplayName,
          authorUsername: u.username || p.authorUsername,
        };
      }
      return p;
    });
  }, []);

  // ── Load posts ────────────────────────────────────────────────────────

  const loadPosts = useCallback(
    async (reset = false) => {
      if (reset) {
        lastDocRef.current = null;
        setAllLoaded(false);
      }

      try {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const result = await fetchFeedPosts(
          PAGE_SIZE,
          lastDocRef.current ?? undefined,
        );

        if (result.posts.length === 0) {
          if (reset) setPosts([]);
          setAllLoaded(true);
          return;
        }

        lastDocRef.current = result.lastDoc;

        let enriched = enrichWithLiveProfile(result.posts);

        // Check interactions
        const u = userRef.current;
        if (u) {
          try {
            const postIds = enriched.map((p) => p.id);
            const statusMap = await checkPostInteractions(postIds, u.uid);
            enriched = enriched.map((p) => {
              const status = statusMap[p.id];
              if (!status) return p;
              return {
                ...p,
                isLiked: status.isLiked,
                isReposted: status.isReposted,
                isBookmarked: status.isBookmarked,
              };
            });
          } catch (err) {
            console.error('[FeedScreen] Failed to check interactions:', err);
          }
        }

        if (reset) {
          setPosts(enriched);
        } else {
          setPosts((prev) => [...prev, ...enriched]);
        }
      } catch (err) {
        console.error('[FeedScreen] Failed to fetch posts:', err);
        if (reset) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [enrichWithLiveProfile],
  );

  // ── Initial load ──────────────────────────────────────────────────────

  useEffect(() => {
    loadPosts(true);
    loadStories();
  }, [loadPosts, loadStories]);

  // ── Refresh when feedRefreshKey changes (e.g., after creating a post) ─

  useEffect(() => {
    if (feedRefreshKey > 0) {
      loadPosts(true);
    }
  }, [feedRefreshKey, loadPosts]);

  // ── Re-enrich when user data changes ──────────────────────────────────

  useEffect(() => {
    if (!user) return;
    setPosts((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((p) => {
        if (p.authorId === user.uid) {
          return {
            ...p,
            authorProfileImage: user.profileImage || p.authorProfileImage,
            authorIsVerified: user.isVerified || p.authorIsVerified,
            authorBadge: user.badge || p.authorBadge,
            authorDisplayName: user.displayName || p.authorDisplayName,
            authorUsername: user.username || p.authorUsername,
          };
        }
        return p;
      });
    });
  }, [
    user?.uid,
    user?.isVerified,
    user?.badge,
    user?.profileImage,
    user?.displayName,
    user?.username,
  ]);

  // ── Pull to refresh ───────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    loadPosts(true);
    loadStories();
  }, [refreshing, loadPosts, loadStories]);

  // ── Infinite scroll ───────────────────────────────────────────────────

  const handleEndReached = useCallback(() => {
    if (loadingMore || loading || allLoaded) return;
    loadPosts(false);
  }, [loadingMore, loading, allLoaded, loadPosts]);

  // ── Actions ───────────────────────────────────────────────────────────

  const handleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        const nowLiked = await togglePostLike(postId, user.uid);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: nowLiked,
                  likeCount: (p.likeCount ?? 0) + (nowLiked ? 1 : -1),
                }
              : p,
          ),
        );
      } catch (err) {
        console.error('[FeedScreen] Like failed:', err);
      }
    },
    [user],
  );

  const handleRepost = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        const isReposted = await togglePostRepost(postId, user.uid);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isReposted,
                  repostCount: (p.repostCount ?? 0) + (isReposted ? 1 : -1),
                }
              : p,
          ),
        );
      } catch (err) {
        console.error('[FeedScreen] Repost failed:', err);
      }
    },
    [user],
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        const isBookmarked = await togglePostBookmark(postId, user.uid);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isBookmarked } : p,
          ),
        );
      } catch (err) {
        console.error('[FeedScreen] Bookmark failed:', err);
      }
    },
    [user],
  );

  const handleComment = useCallback((postId: string) => {
    setCommentSheetPostId(postId);
  }, []);

  const handleFAB = useCallback(() => {
    (navigation.navigate as any)('CreatePost');
  }, [navigation]);

  // ── Render post item ─────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onRepost={handleRepost}
        onBookmark={handleBookmark}
        onComment={handleComment}
        currentUserId={user?.uid}
      />
    ),
    [handleLike, handleRepost, handleBookmark, handleComment, user?.uid],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  // ── List header with stories ─────────────────────────────────────────

  const ListHeaderComponent = useMemo(
    () => (
      <StoryRow
        stories={stories}
        loading={storiesLoading}
        currentUserId={user?.uid}
      />
    ),
    [stories, storiesLoading, user?.uid],
  );

  // ── List footer ──────────────────────────────────────────────────────

  const ListFooterComponent = useMemo(
    () =>
      loadingMore ? (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.blue} />
        </View>
      ) : allLoaded && posts.length > 0 ? (
        <View style={styles.endOfFeed}>
          <Text style={styles.endOfFeedText}>You're all caught up</Text>
        </View>
      ) : null,
    [loadingMore, allLoaded, posts.length],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loading && posts.length === 0 ? [] : posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="feed"
              title="No posts yet"
              subtitle="When people post, their posts will show up here."
              actionLabel="Create a post"
              onAction={handleFAB}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          loading && posts.length === 0 ? styles.emptyList : undefined
        }
      />

      {/* Loading skeleton overlay */}
      {loading && posts.length === 0 ? (
        <View style={styles.skeletonContainer}>
          <View style={[styles.skeletonStoryRow, { paddingLeft: 16, paddingRight: 16, paddingVertical: 12 }]}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.skeletonStoryItem}>
                <View style={styles.skeletonStoryCircle} />
                <View style={[styles.skeletonStoryLabel, { width: 50, marginTop: 6 }]} />
              </View>
            ))}
          </View>
          {Array.from({ length: 4 }).map((_, i) => (
            <FeedSkeleton key={`skel-${i}`} />
          ))}
        </View>
      ) : null}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFAB}
        activeOpacity={0.8}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Comment Sheet */}
      <CommentSheet
        visible={commentSheetPostId !== null}
        onClose={() => setCommentSheetPostId(null)}
        postId={commentSheetPostId ?? ''}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  emptyList: {
    flexGrow: 1,
  },
  skeletonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    zIndex: 1,
  },
  skeletonStoryRow: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  skeletonStoryItem: {
    alignItems: 'center',
  },
  skeletonStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonStoryLabel: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
  },
  skeletonAction: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfFeed: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingVertical: 32,
    alignItems: 'center',
  },
  endOfFeedText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2,
  },
});

export default FeedScreen;
