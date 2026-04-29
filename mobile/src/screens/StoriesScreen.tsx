import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { fetchStoryGroups, StoryGroup } from '../lib/db';
import { Colors, Spacing, BorderRadius } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';

type RootStackParamList = {
  Stories: undefined;
  StoryViewer: { storyIds: string[]; startIndex: number; storyGroupId: string };
  StoryCreator: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Stories'>;
};

const StoriesScreen: React.FC<Props> = ({ navigation }) => {
  const currentUid = auth().currentUser?.uid ?? '';

  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const storyGroups = await fetchStoryGroups();
      setGroups(storyGroups);
    } catch (e) {
      console.warn('[StoriesScreen] load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleStoryGroupPress = useCallback(
    (group: StoryGroup, index: number) => {
      const storyIds = group.stories.map((s) => s.id);
      navigation.navigate('StoryViewer', {
        storyIds,
        startIndex: index,
        storyGroupId: group.userId,
      });
    },
    [navigation],
  );

  const handleCreateStory = useCallback(() => {
    navigation.navigate('StoryCreator');
  }, [navigation]);

  const handleYourStory = useCallback(() => {
    const myGroup = groups.find((g) => g.userId === currentUid);
    if (myGroup && myGroup.stories.length > 0) {
      handleStoryGroupPress(myGroup, 0);
    } else {
      navigation.navigate('StoryCreator');
    }
  }, [groups, currentUid, handleStoryGroupPress, navigation]);

  const renderStoryGroup = useCallback(
    ({ item, index }: { item: StoryGroup; index: number }) => {
      const hasStory = item.stories.length > 0;
      const isOwn = item.userId === currentUid;
      const latestStory = item.stories[0];
      const timeAgo = latestStory
        ? formatDistanceToNow(new Date(latestStory.createdAt), { addSuffix: false })
        : '';

      return (
        <TouchableOpacity
          style={styles.storyGroup}
          onPress={() => hasStory && handleStoryGroupPress(item, index)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.avatarRing,
              isOwn && styles.avatarRingOwn,
              hasStory && !isOwn && styles.avatarRingActive,
            ]}
          >
            <Image
              source={
                item.profileImage
                  ? { uri: item.profileImage }
                  : { uri: 'https://via.placeholder.com/80/333/ccc?text=A' }
              }
              style={styles.storyAvatar}
            />
            {isOwn && (
              <View style={styles.addStoryBadge}>
                <Text style={styles.addStoryBadgeText}>+</Text>
              </View>
            )}
          </View>
          <Text style={[styles.storyName, isOwn && styles.storyNameOwn]} numberOfLines={1}>
            {isOwn ? 'Your Story' : item.displayName || item.username}
          </Text>
          {!isOwn && hasStory && (
            <Text style={styles.storyTime}>{timeAgo}</Text>
          )}
        </TouchableOpacity>
      );
    },
    [currentUid, handleStoryGroupPress],
  );

  const renderHeader = useCallback(() => {
    const myGroup = groups.find((g) => g.userId === currentUid);
    const hasMyStories = myGroup && myGroup.stories.length > 0;

    return (
      <TouchableOpacity style={styles.createStoryCard} onPress={handleCreateStory} activeOpacity={0.8}>
        <View style={styles.createStoryInner}>
          <View style={styles.createStoryAvatar}>
            <Image
              source={
                myGroup?.profileImage
                  ? { uri: myGroup.profileImage }
                  : { uri: 'https://via.placeholder.com/80/333/ccc?text=A' }
                }
              style={styles.createStoryAvatarImage}
            />
            <View style={styles.createStoryPlus}>
              <Text style={styles.createStoryPlusText}>+</Text>
            </View>
          </View>
          <View style={styles.createStoryTextContainer}>
            <Text style={styles.createStoryTitle}>Create Story</Text>
            <Text style={styles.createStorySubtext}>
              {hasMyStories ? 'Add to your story' : 'Share what you\'re up to'}
            </Text>
          </View>
          <View style={styles.createStoryChevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [groups, currentUid, handleCreateStory]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stories</Text>
        </View>

        {/* Story Groups Horizontal List */}
        <View style={styles.storyListContainer}>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.userId}
            renderItem={renderStoryGroup}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storyListContent}
            ListHeaderComponent={renderHeader}
            ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          />
        </View>

        {/* Recent Stories Feed */}
        <View style={styles.feedContainer}>
          <Text style={styles.feedSectionTitle}>Recent Stories</Text>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="book-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No stories yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first story or follow people to see theirs
              </Text>
              <TouchableOpacity
                style={styles.createFirstStoryBtn}
                onPress={handleCreateStory}
                activeOpacity={0.8}
              >
                <Text style={styles.createFirstStoryBtnText}>Create Story</Text>
              </TouchableOpacity>
            </View>
          ) : (
            groups.map((group) => (
              <TouchableOpacity
                key={group.userId}
                style={styles.feedItem}
                onPress={() => handleStoryGroupPress(group, 0)}
                activeOpacity={0.7}
              >
                <View style={styles.feedItemLeft}>
                  <View style={styles.feedAvatarRing}>
                    <Image
                      source={
                        group.profileImage
                          ? { uri: group.profileImage }
                          : { uri: 'https://via.placeholder.com/80/333/ccc?text=A' }
                      }
                      style={styles.feedAvatar}
                    />
                  </View>
                  <View style={styles.feedItemInfo}>
                    <View style={styles.feedNameRow}>
                      <Text style={styles.feedName}>{group.displayName || group.username}</Text>
                      {group.verified && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.feedStoryCount}>
                      {group.stories.length} storie{group.stories.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.feedItemRight}>
                  <Text style={styles.feedTime}>
                    {formatDistanceToNow(new Date(group.latestCreatedAt), { addSuffix: true })}
                  </Text>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storyListContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingBottom: Spacing.md,
  },
  storyListContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  storyGroup: {
    alignItems: 'center',
    width: 76,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarRingOwn: {
    borderColor: Colors.surfaceBorder,
  },
  avatarRingActive: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  addStoryBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
  storyName: {
    fontSize: 11,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  storyNameOwn: {
    fontWeight: '600',
  },
  storyTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 1,
  },
  createStoryCard: {
    paddingHorizontal: Spacing.sm,
  },
  createStoryInner: {
    alignItems: 'center',
    width: 76,
  },
  createStoryAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  createStoryAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
  },
  createStoryPlus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  createStoryPlusText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '700',
  },
  createStoryTextContainer: {
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  createStoryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  createStorySubtext: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  createStoryChevron: {
    marginTop: 4,
  },
  chevronText: {
    fontSize: 18,
    color: Colors.textTertiary,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  feedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    lineHeight: 20,
  },
  createFirstStoryBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  createFirstStoryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  feedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  feedAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  feedItemInfo: {
    gap: 2,
  },
  feedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '700',
  },
  feedStoryCount: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  feedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  feedTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});

export default StoriesScreen;
