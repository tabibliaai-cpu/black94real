import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { fetchBookmarkedPosts, Post } from '../lib/db';
import { Colors, Spacing, BorderRadius } from '../theme';
import PostCard from '../components/PostCard';
import Icon from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Bookmarks: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Bookmarks'>;
};

type ViewMode = 'grid' | 'list';

const BookmarksScreen: React.FC<Props> = ({ navigation }) => {
  const currentUid = auth().currentUser?.uid ?? '';

  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      const posts = await fetchBookmarkedPosts(currentUid);
      setBookmarks(posts);
    } catch (e) {
      console.warn('[BookmarksScreen] load error:', e);
    }
    setLoading(false);
  }, [currentUid]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  }, [loadBookmarks]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
  }, []);

  const renderListItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onPress={() => {}} compact={false} />
    ),
    [],
  );

  const renderGridItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onPress={() => {}} compact />
    ),
    [],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Icon name="bookmark-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No bookmarks yet</Text>
        <Text style={styles.emptySubtext}>
          Save posts you love by tapping the bookmark icon
        </Text>
      </View>
    ),
    [],
  );

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
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <View style={styles.headerRight}>
            <Text style={styles.bookmarkCount}>{bookmarks.length}</Text>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={toggleViewMode}
              activeOpacity={0.7}
            >
              <Text style={styles.viewToggleText}>
                {viewMode === 'list' ? '▦' : '☰'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {viewMode === 'list' ? (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={renderListItem}
            ListEmptyComponent={ListEmptyComponent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={bookmarks.length === 0 ? styles.emptyList : undefined}
          />
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={renderGridItem}
            ListEmptyComponent={ListEmptyComponent}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={bookmarks.length === 0 ? styles.emptyList : styles.gridContent}
            columnWrapperStyle={styles.gridRow}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bookmarkCount: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  viewToggleText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyList: {
    flexGrow: 1,
  },
  gridContent: {
    padding: 1,
  },
  gridRow: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
});

export default BookmarksScreen;
