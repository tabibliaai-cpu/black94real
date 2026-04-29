/**
 * ExploreScreen.tsx — Explore / Discover screen
 *
 * Featured content, categories grid, trending posts, suggested users, search bar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore, type Post as StorePost } from '../stores/app';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Types ──────────────────────────────────────────────────────────────────

interface ExplorePost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorImage: string;
  caption: string;
  mediaUrl: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface SuggestedUser {
  uid: string;
  username: string;
  displayName: string;
  profileImage: string;
  bio: string;
  isVerified: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'tech', name: 'Technology', icon: 'laptop-outline', color: '#e0e0e0' },
  { id: 'business', name: 'Business', icon: 'briefcase-outline', color: '#22c55e' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'heart-outline', color: '#ec4899' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film-outline', color: '#f59e0b' },
  { id: 'sports', name: 'Sports', icon: 'basketball-outline', color: '#ef4444' },
  { id: 'education', name: 'Education', icon: 'school-outline', color: '#8b5cf6' },
  { id: 'food', name: 'Food', icon: 'restaurant-outline', color: '#f97316' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#06b6d4' },
];

const RANDOM_QUERIES = ['a', 'e', 'i', 'o', 'u', 'r', 's', 't', 'n', 'm'];

// ── Helpers ────────────────────────────────────────────────────────────────

function tsToISO(value: unknown): string {
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Date((value as any).seconds * 1000).toISOString();
  }
  return String(value ?? new Date().toISOString());
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppStore((s) => s.user);

  const [featuredPosts, setFeaturedPosts] = useState<ExplorePost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ExplorePost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      // Fetch trending posts (most liked)
      const postsSnap = await firestore()
        .collection('posts')
        .orderBy('likeCount', 'desc')
        .limit(20)
        .get();

      const allPosts: ExplorePost[] = postsSnap.docs
        .map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            authorId: d.authorId ?? '',
            authorName: d.authorDisplayName ?? 'User',
            authorUsername: d.authorUsername ?? 'user',
            authorImage: d.authorProfileImage ?? '',
            caption: d.caption ?? '',
            mediaUrl: d.mediaUrls ?? '',
            likeCount: d.likeCount ?? 0,
            commentCount: d.commentCount ?? 0,
            createdAt: tsToISO(d.createdAt),
          };
        });

      setFeaturedPosts(allPosts.slice(0, 8));
      setTrendingPosts(allPosts.slice(8, 20));

      // Fetch suggested users (random query)
      const query = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
      try {
        const usersSnap = await firestore()
          .collection('users')
          .where('usernameLower', '>=', query)
          .where('usernameLower', '<=', query + '\uf8ff')
          .limit(10)
          .get();

        const users: SuggestedUser[] = usersSnap.docs
          .map((doc) => {
            const d = doc.data();
            return {
              uid: d.uid ?? doc.id,
              username: d.username ?? '',
              displayName: d.displayName ?? '',
              profileImage: d.profileImage ?? '',
              bio: d.bio ?? '',
              isVerified: d.isVerified ?? false,
            };
          })
          .filter((u) => u.uid !== user?.id);

        setSuggestedUsers(users.slice(0, 6));
      } catch {
        // Composite index may not exist, fallback to empty
        setSuggestedUsers([]);
      }
    } catch (err) {
      console.error('[ExploreScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ── Render featured post card (horizontal scroll) ──────────────────────
  const renderFeaturedCard = ({ item }: { item: ExplorePost }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() =>
        navigation.navigate('PostDetail' as never, { postId: item.id } as never)
      }
      activeOpacity={0.8}>
      {item.mediaUrl ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.featuredImage} resizeMode="cover" />
      ) : (
        <View style={styles.featuredImagePlaceholder}>
          <Icon name="image-outline" size={32} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.featuredOverlay}>
        <Text style={styles.featuredCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <View style={styles.featuredStats}>
          <Text style={styles.featuredStat}><Icon name="heart" size={12} color={Colors.like} /> {formatCount(item.likeCount)}</Text>
          <Text style={styles.featuredStat}><Icon name="chatbubble-outline" size={12} color={Colors.textMuted} /> {formatCount(item.commentCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Render category card ──────────────────────────────────────────────
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('Search' as never, { query: item.name } as never)
      }>
      <View style={[styles.categoryIconBg, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // ── Render trending post ──────────────────────────────────────────────
  const renderTrendingPost = ({ item }: { item: ExplorePost }) => (
    <TouchableOpacity
      style={styles.trendingItem}
      onPress={() =>
        navigation.navigate('PostDetail' as never, { postId: item.id } as never)
      }
      activeOpacity={0.7}>
      {item.mediaUrl ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.trendingThumb} resizeMode="cover" />
      ) : (
        <View style={styles.trendingThumbPlaceholder}>
          <Icon name="image-outline" size={16} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.trendingInfo}>
        <View style={styles.trendingAuthor}>
          <Text style={styles.trendingAuthorName} numberOfLines={1}>
            {item.authorName}
          </Text>
          {item.authorImage ? (
            <Text style={styles.trendingTime}>{timeAgo(item.createdAt)}</Text>
          ) : null}
        </View>
        <Text style={styles.trendingCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <View style={styles.trendingStats}>
          <Text style={styles.trendingStat}><Icon name="heart" size={12} color={Colors.like} /> {formatCount(item.likeCount)}</Text>
          <Text style={styles.trendingStat}><Icon name="chatbubble-outline" size={12} color={Colors.textMuted} /> {formatCount(item.commentCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Render suggested user ─────────────────────────────────────────────
  const renderSuggestedUser = ({ item }: { item: SuggestedUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() =>
        navigation.navigate('UserProfile' as never, { userId: item.uid } as never)
      }
      activeOpacity={0.7}>
      <View style={styles.userAvatarBg}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
        ) : (
          <Text style={styles.userAvatarInitial}>
            {item.displayName[0].toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.isVerified && (
            <Icon name="checkmark-circle" size={14} color={colors.primary} />
          )}
        </View>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.followBtn}
        onPress={() => {
          // Placeholder follow action
        }}
        activeOpacity={0.7}>
        <Text style={styles.followBtnText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      keyExtractor={() => ''}
      ListHeaderComponent={
        <>
          {/* Search bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Search' as never)}
            activeOpacity={0.7}>
            <Icon name="search" size={18} color={colors.textTertiary} />
            <Text style={styles.searchPlaceholder}>Search posts, users, topics...</Text>
          </TouchableOpacity>

          {/* Featured / Trending horizontal scroll */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending</Text>
          </View>
          <FlatList
            data={featuredPosts}
            renderItem={renderFeaturedCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            pagingEnabled
            decelerationRate="fast"
          />

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <View key={cat.id} style={styles.categoryCol}>
                {renderCategory({ item: cat })}
              </View>
            ))}
          </View>

          {/* Suggested users */}
          {suggestedUsers.length > 0 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested for You</Text>
              </View>
              <FlatList
                data={suggestedUsers}
                renderItem={renderSuggestedUser}
                keyExtractor={(item) => item.uid}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.usersList}
              />
            </>
          )}

          {/* Trending posts list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Posts</Text>
          </View>
          {trendingPosts.map((post) => (
            <View key={post.id}>{renderTrendingPost({ item: post })}</View>
          ))}
          {trendingPosts.length === 0 && (
            <View style={styles.emptySmall}>
              <Text style={styles.emptySmallText}>No trending posts right now</Text>
            </View>
          )}
        </>
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 40,
  },
  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: colors.textTertiary,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Featured cards (horizontal)
  featuredList: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
  },
  featuredCard: {
    width: SCREEN_WIDTH * 0.7,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  featuredCaption: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 18,
    marginBottom: 8,
  },
  featuredStats: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredStat: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCol: {
    width: '25%',
    alignItems: 'center',
  },
  categoryCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  categoryIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Suggested users
  usersList: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
  },
  userCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatarBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  userInfo: {
    marginBottom: 10,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  userUsername: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  followBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  // Trending posts
  trendingItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: 12,
  },
  trendingThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
  },
  trendingThumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trendingAuthorName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  trendingTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  trendingCaption: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  trendingStats: {
    flexDirection: 'row',
    gap: 12,
  },
  trendingStat: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Empty small
  emptySmall: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySmallText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
