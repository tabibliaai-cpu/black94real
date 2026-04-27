import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  searchUsers,
  searchPosts,
  searchProducts,
  type Black94User,
  type Post,
  type ShopProduct,
} from '../lib/db';
import UserListItem from '../components/UserListItem';
import { colors } from '../theme/colors';

type RootStackParamList = {
  UserProfile: { userId: string };
  PostDetail: { postId: string };
  ProductDetail: { productId: string };
};

type SearchTab = 'people' | 'posts' | 'products';

const RECENT_SEARCHES_KEY = 'black94_recent_searches';
const DEBOUNCE_MS = 300;

export default function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('people');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userResults, setUserResults] = useState<Black94User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load recent searches on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (err) {
        console.error('[SearchScreen] load recent searches error:', err);
      }
    })();
  }, []);

  // ── Save recent search ─────────────────────────────────────────────────
  const saveRecentSearch = useCallback(async (searchTerm: string) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const existing: string[] = stored ? JSON.parse(stored) : [];
      // Remove duplicate if exists, add to front
      const filtered = existing.filter((s) => s.toLowerCase() !== searchTerm.toLowerCase());
      const updated = [searchTerm, ...filtered].slice(0, 10); // Max 10
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (err) {
      console.error('[SearchScreen] save recent search error:', err);
    }
  }, []);

  // ── Remove recent search ───────────────────────────────────────────────
  const removeRecentSearch = useCallback(async (searchTerm: string) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const existing: string[] = stored ? JSON.parse(stored) : [];
      const updated = existing.filter((s) => s !== searchTerm);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (err) {
      console.error('[SearchScreen] remove recent search error:', err);
    }
  }, []);

  // ── Clear all recent searches ──────────────────────────────────────────
  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (err) {
      console.error('[SearchScreen] clear recent searches error:', err);
    }
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setUserResults([]);
      setPostResults([]);
      setProductResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const [users, posts, products] = await Promise.all([
          searchUsers(query.trim(), 20),
          searchPosts(query.trim(), 20),
          searchProducts(query.trim(), 20),
        ]);

        setUserResults(users);
        setPostResults(posts);
        setProductResults(products);
        setHasSearched(true);
        saveRecentSearch(query.trim());
      } catch (err) {
        console.error('[SearchScreen] search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, saveRecentSearch]);

  // ── Current results based on tab ───────────────────────────────────────
  const currentResults = useMemo(() => {
    switch (activeTab) {
      case 'people':
        return userResults;
      case 'posts':
        return postResults;
      case 'products':
        return productResults;
      default:
        return [];
    }
  }, [activeTab, userResults, postResults, productResults]);

  const totalResults = userResults.length + postResults.length + productResults.length;

  // ── Handle recent search press ─────────────────────────────────────────
  const handleRecentSearchPress = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
  }, []);

  // ── Follow callbacks (no-op placeholders - real implementation in UserListItem) ──
  const handleFollow = useCallback((_userId: string) => {}, []);
  const handleUnfollow = useCallback((_userId: string) => {}, []);

  // ── Render trending section (placeholder) ──────────────────────────────
  const renderTrending = useCallback(() => {
    const trendingTopics = ['Black94', 'Tech', 'Design', 'Crypto', 'Creator Economy'];
    return (
      <View style={styles.trendingContainer}>
        <Text style={styles.sectionTitle}>Trending</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingScroll}>
          {trendingTopics.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={styles.trendingChip}
              onPress={() => setQuery(topic)}>
              <Icon name="trending-up" size={14} color={colors.primary} />
              <Text style={styles.trendingText}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, []);

  // ── Render recent searches ─────────────────────────────────────────────
  const renderRecentSearches = useCallback(() => {
    if (query.trim() || recentSearches.length === 0) return null;

    return (
      <View style={styles.recentContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={clearRecentSearches}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {recentSearches.map((term) => (
          <TouchableOpacity
            key={term}
            style={styles.recentItem}
            onPress={() => handleRecentSearchPress(term)}>
            <Icon name="time" size={18} color={colors.textTertiary} />
            <Text style={styles.recentText} numberOfLines={1}>
              {term}
            </Text>
            <TouchableOpacity
              onPress={() => removeRecentSearch(term)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [query, recentSearches, handleRecentSearchPress, removeRecentSearch, clearRecentSearches]);

  // ── Render user result ─────────────────────────────────────────────────
  const renderUserItem = useCallback(
    ({ item }: { item: Black94User }) => (
      <UserListItem
        user={item}
        showFollow={true}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onPress={() =>
          navigation.navigate('UserProfile', { userId: item.uid })
        }
      />
    ),
    [navigation, handleFollow, handleUnfollow],
  );

  // ── Render post result ─────────────────────────────────────────────────
  const renderPostItem = useCallback(
    ({ item }: { item: Post }) => (
      <TouchableOpacity
        style={styles.postCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('PostDetail' as never, {
            postId: item.id,
          } as never)
        }>
        {/* Post author row */}
        <View style={styles.postHeader}>
          <Image
            source={
              item.authorProfileImage
                ? { uri: item.authorProfileImage }
                : require('../../assets/default-avatar.png')
            }
            style={styles.postAvatar}
          />
          <View style={styles.postAuthorInfo}>
            <View style={styles.postAuthorRow}>
              <Text style={styles.postAuthorName} numberOfLines={1}>
                {item.authorDisplayName}
              </Text>
              {item.authorIsVerified && (
                <Icon
                  name="checkmark-circle"
                  size={14}
                  color={colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text style={styles.postAuthorUsername}>
              @{item.authorUsername}
            </Text>
          </View>
        </View>

        {/* Post media */}
        {item.mediaUrls ? (
          <Image
            source={{ uri: item.mediaUrls.split(',')[0] }}
            style={styles.postMedia}
            resizeMode="cover"
            defaultSource={require('../../assets/image-placeholder.png')}
          />
        ) : null}

        {/* Post caption */}
        <Text style={styles.postCaption} numberOfLines={3}>
          {item.caption}
        </Text>

        {/* Post stats */}
        <View style={styles.postStats}>
          <Icon name="heart-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.postStatText}>{item.likeCount}</Text>
          <Icon
            name="chatbubble-outline"
            size={16}
            color={colors.textSecondary}
            style={{ marginLeft: 16 }}
          />
          <Text style={styles.postStatText}>{item.commentCount}</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  // ── Render product result ──────────────────────────────────────────────
  const renderProductItem = useCallback(
    ({ item }: { item: ShopProduct }) => (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('ProductDetail' as never, {
            productId: item.id,
          } as never)
        }>
        <Image
          source={{
            uri: item.images ? item.images.split(',')[0] : '',
          }}
          style={styles.productImage}
          resizeMode="cover"
          defaultSource={require('../../assets/image-placeholder.png')}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productBusiness} numberOfLines={1}>
            {item.businessName}
          </Text>
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>
              ₹{item.price.toLocaleString()}
            </Text>
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <Text style={styles.productComparePrice}>
                ₹{item.compareAtPrice.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={styles.productRating}>
            <Icon name="star" size={12} color={colors.warning} />
            <Text style={styles.productRatingText}>
              {item.rating.toFixed(1)} ({item.reviewCount})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  // ── Empty results state ────────────────────────────────────────────────
  const renderEmptyResults = useCallback(() => {
    if (isSearching) return null;
    if (!hasSearched) return null;
    return (
      <View style={styles.emptyResults}>
        <Icon name="search" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyResultsTitle}>No results found</Text>
        <Text style={styles.emptyResultsSubtitle}>
          Try a different search term
        </Text>
      </View>
    );
  }, [isSearching, hasSearched]);

  // ── Pick the right render item based on tab ────────────────────────────
  const renderItem = useCallback(
    (props: { item: any }) => {
      switch (activeTab) {
        case 'people':
          return renderUserItem(props as { item: Black94User });
        case 'posts':
          return renderPostItem(props as { item: Post });
        case 'products':
          return renderProductItem(props as { item: ShopProduct });
        default:
          return null;
      }
    },
    [activeTab, renderUserItem, renderPostItem, renderProductItem],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={18}
          color={colors.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, posts, products..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon
              name="close-circle"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {(['people', 'posts', 'products'] as SearchTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={currentResults}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            currentResults.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={renderEmptyResults}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={5}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {renderRecentSearches()}
          {renderTrending()}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Recent searches
  recentContainer: {
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  // Trending
  trendingContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  trendingScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendingText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 12,
  },
  // Empty results
  emptyList: {
    flexGrow: 1,
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyResultsSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  // Post card
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    marginRight: 10,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  postAuthorUsername: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  postMedia: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceElevated,
  },
  postCaption: {
    fontSize: 14,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingTop: 8,
    lineHeight: 20,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postStatText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  // Product card
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.surfaceElevated,
  },
  productInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  productBusiness: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productComparePrice: {
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  productRatingText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
