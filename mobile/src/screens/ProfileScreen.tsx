import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { getUser, getFollowerCount, getFollowingCount, fetchUserPosts, Black94User, Post } from '../lib/db';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import PostCard from '../components/PostCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  UserProfile: { userId: string };
  Bookmarks: undefined;
  FollowersList: { userId: string; type: 'followers' | 'following' };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

type ProfileTab = 'posts' | 'replies' | 'bookmarks';

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const currentUser = auth().currentUser;

  const [user, setUser] = useState<Black94User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const [userData, fCount, gCount, userPosts] = await Promise.all([
        getUser(currentUser.uid),
        getFollowerCount(currentUser.uid),
        getFollowingCount(currentUser.uid),
        fetchUserPosts(currentUser.uid),
      ]);
      setUser(userData);
      setFollowerCount(fCount);
      setFollowingCount(gCount);
      setPosts(userPosts);
    } catch (e) {
      console.warn('[ProfileScreen] load error:', e);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleShareProfile = useCallback(async () => {
    if (!user) return;
    try {
      await Share.share({
        message: `Check out @${user.username} on Black94! https://black94.web.app/s/u/${user.uid}`,
      });
    } catch {}
  }, [user]);

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const tabs: { key: ProfileTab; label: string }[] = useMemo(
    () => [
      { key: 'posts', label: 'Posts' },
      { key: 'replies', label: 'Replies' },
      { key: 'bookmarks', label: 'Bookmarks' },
    ],
    [],
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <View style={styles.loadingSpinner} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
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
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.coverGradient}
          />
        </View>

        {/* Profile Image (overlapping) */}
        <View style={styles.profileImageContainer}>
          <Image
            source={
              user.profileImage
                ? { uri: user.profileImage }
                : { uri: 'https://via.placeholder.com/200/333/ccc?text=A' }
            }
            style={styles.profileImage}
          />
          {/* Edit overlay */}
          <TouchableOpacity
            style={styles.editProfileOverlay}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <View style={styles.editProfileIcon}>
              <Text style={styles.editProfileIconText}>✏️</Text>
            </View>
          </TouchableOpacity>
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
            {user.badge === 'blue' && user.badge !== '' && (
              <View style={styles.blueBadge}>
                <Text style={styles.blueBadgeText}>●</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate('FollowersList', {
                  userId: user.uid,
                  type: 'followers',
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{formatCount(followerCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate('FollowersList', {
                  userId: user.uid,
                  type: 'following',
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{formatCount(followingCount)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.postsGrid}>
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>
                  Share your first post with the world
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPress={() => {}}
                  compact
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'replies' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No replies yet</Text>
          </View>
        )}

        {activeTab === 'bookmarks' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Bookmarks')}
            activeOpacity={0.7}
          >
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>View your bookmarks</Text>
              <Text style={styles.emptySubtext}>Tap to see saved posts</Text>
            </View>
          </TouchableOpacity>
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
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderTopColor: 'transparent',
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
  profileImageContainer: {
    marginTop: -50,
    marginHorizontal: Spacing.lg,
    zIndex: 10,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: Colors.black,
    backgroundColor: Colors.surfaceLight,
  },
  editProfileOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editProfileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  editProfileIconText: {
    fontSize: 14,
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
  blueBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueBadgeText: {
    fontSize: 12,
    color: Colors.white,
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
  editProfileBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  editProfileBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  shareBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});

export default ProfileScreen;
