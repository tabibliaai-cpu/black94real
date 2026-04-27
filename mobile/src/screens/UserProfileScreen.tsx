import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import {
  getUser,
  getFollowerCount,
  getFollowingCount,
  fetchUserPosts,
  toggleFollow,
  checkIsFollowing,
  createOrGetChat,
  Black94User,
  Post,
} from '../lib/db';
import { Colors, Spacing, BorderRadius } from '../theme';
import PostCard from '../components/PostCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  UserProfile: { userId: string };
  ChatRoom: { chatId: string };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
  route: RouteProp<RootStackParamList, 'UserProfile'>;
};

type ProfileTab = 'posts' | 'replies' | 'bookmarks';

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = route.params;
  const currentUid = auth().currentUser?.uid ?? '';

  const [user, setUser] = useState<Black94User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [userData, fCount, gCount, isFollow, userPosts] = await Promise.all([
        getUser(userId),
        getFollowerCount(userId),
        getFollowingCount(userId),
        currentUid ? checkIsFollowing(currentUid, userId) : Promise.resolve(false),
        fetchUserPosts(userId),
      ]);
      setUser(userData);
      setFollowerCount(fCount);
      setFollowingCount(gCount);
      setIsFollowing(isFollow);
      setPosts(userPosts);
    } catch (e) {
      console.warn('[UserProfileScreen] load error:', e);
    }
  }, [userId, currentUid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleToggleFollow = useCallback(async () => {
    if (!currentUid || followLoading) return;
    setFollowLoading(true);
    try {
      const nowFollowing = await toggleFollow(currentUid, userId);
      setIsFollowing(nowFollowing);
      setFollowerCount((prev) => (nowFollowing ? prev + 1 : Math.max(0, prev - 1)));
    } catch (e) {
      console.warn('[UserProfileScreen] follow error:', e);
    }
    setFollowLoading(false);
  }, [currentUid, userId, followLoading]);

  const handleMessage = useCallback(async () => {
    if (!currentUid || messageLoading) return;
    setMessageLoading(true);
    try {
      const chat = await createOrGetChat(currentUid, userId);
      navigation.navigate('ChatRoom' as never, { chatId: chat.id } as never);
    } catch (e) {
      console.warn('[UserProfileScreen] message error:', e);
    }
    setMessageLoading(false);
  }, [currentUid, userId, messageLoading, navigation]);

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUid === userId;
  const showPaidChatBadge = user.paidChatEnabled && user.paidChatPrice > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {user.coverImage ? (
            <Image source={{ uri: user.coverImage }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={['#1e3a5f', '#0a1628']}
              style={styles.coverImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.coverGradient} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={
              user.profileImage
                ? { uri: user.profileImage }
                : { uri: 'https://via.placeholder.com/200/333/ccc?text=A' }
            }
            style={styles.profileImage}
          />
        </View>

        {/* User Info */}
        <View style={styles.userInfoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
            {user.badge === 'gold' && (
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>★</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCount(followerCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCount(followingCount)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing ? styles.followingBtn : null]}
                onPress={handleToggleFollow}
                activeOpacity={0.8}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? Colors.textPrimary : Colors.black} />
                ) : (
                  <Text
                    style={[styles.followBtnText, isFollowing ? styles.followingBtnText : null]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleMessage}
                activeOpacity={0.8}
                disabled={messageLoading}
              >
                {messageLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <View style={styles.messageBtnInner}>
                    <Text style={styles.messageBtnText}>Message</Text>
                    {showPaidChatBadge && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>₹{user.paidChatPrice}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(['posts', 'replies'] as ProfileTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'posts' ? 'Posts' : 'Replies'}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts Grid */}
        {activeTab === 'posts' && (
          <View style={styles.postsGrid}>
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onPress={() => {}} compact />
              ))
            )}
          </View>
        )}

        {activeTab === 'replies' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No replies yet</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    height: SCREEN_WIDTH * 9 / 16,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.white,
  },
  profileImageContainer: {
    marginTop: -50,
    marginHorizontal: Spacing.lg,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: Colors.black,
    backgroundColor: Colors.surfaceLight,
  },
  userInfoSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },
  goldBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadgeText: {
    fontSize: 12,
    color: Colors.black,
  },
  username: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.xxl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  followBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: Colors.surfaceLighter,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  followBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  followingBtnText: {
    color: Colors.textPrimary,
  },
  messageBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  messageBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paidBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.black,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    marginTop: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default UserProfileScreen;
