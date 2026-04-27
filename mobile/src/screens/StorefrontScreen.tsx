import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import theme from '../theme';
import ProductCard from '../components/ProductCard';
import {
  ShopProduct,
  fetchBusinessProducts,
  fetchFeaturedProducts,
  fetchCategories,
  fetchBusinessProfile,
  BusinessProfile,
} from '../lib/shop';

type RootStackParamList = {
  Storefront: { userId: string };
  ProductDetail: { productId: string };
};

const { width } = Dimensions.get('window');
const GRID_PADDING = 12;
const CARD_GAP = 10;
const CARD_WIDTH = (width - GRID_PADDING * 2 - CARD_GAP) / 2;

const StorefrontScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Storefront'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = route.params;

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<firestore.DocumentSnapshot | null>(null);
  const isFollowingRef = useRef(false);

  const PAGE_SIZE = 10;

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchBusinessProfile(userId);
      setProfile(p);
    } catch {
      // silent
    }
  }, [userId]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(['All', ...cats]);
    } catch {
      // silent
    }
  }, []);

  const loadProducts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        lastDocRef.current = null;
      }
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (!products.length) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const result = await fetchBusinessProducts(
          userId,
          PAGE_SIZE,
          lastDocRef.current ?? undefined,
        );

        if (isRefresh) {
          setProducts(result.products);
        } else {
          setProducts((prev) => [...prev, ...result.products]);
        }

        lastDocRef.current = result.lastDoc;
        setHasMore(result.products.length >= PAGE_SIZE);
      } catch (err) {
        Alert.alert('Error', 'Failed to load products');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId, products.length],
  );

  useEffect(() => {
    loadProfile();
    loadCategories();
    loadProducts();
  }, [loadProfile, loadCategories, loadProducts]);

  const onRefresh = () => {
    loadProducts(true);
  };

  const handleProductPress = (product: ShopProduct) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const renderHeader = () => (
    <View>
      {/* Cover Image */}
      <View style={styles.coverWrapper}>
        {profile?.coverImage ? (
          <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Icon name="storefront" size={48} color={theme.Colors.white40} />
          </View>
        )}
      </View>

      {/* Business Info */}
      <View style={styles.businessInfo}>
        <View style={styles.logoRow}>
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Icon name="business" size={22} color={theme.Colors.white60} />
            </View>
          )}
          <View style={styles.nameCol}>
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>{profile?.displayName || 'Store'}</Text>
              {profile?.isVerified && (
                <Icon name="checkmark-circle" size={20} color={theme.Colors.primary} />
              )}
            </View>
            <Text style={styles.followerCount}>
              {(profile?.followerCount ?? 0).toLocaleString()} followers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, isFollowingRef.current && styles.followingBtn]}
            onPress={() => {
              isFollowingRef.current = !isFollowingRef.current;
              Alert.alert(
                isFollowingRef.current ? 'Following!' : 'Unfollowed',
                isFollowingRef.current
                  ? `You are now following ${profile?.displayName || 'this store'}`
                  : 'You unfollowed this store',
              );
            }}>
            <Text
              style={[
                styles.followBtnText,
                isFollowingRef.current && styles.followingBtnText,
              ]}>
              {isFollowingRef.current ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {profile?.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        ) : null}
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === item && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(item)}>
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === item && styles.categoryPillTextActive,
                ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: ShopProduct }) => (
    <ProductCard
      product={item}
      onPress={handleProductPress}
      style={{ width: CARD_WIDTH }}
    />
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={theme.Colors.primary} size="small" />
        </View>
      );
    }
    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.footerText}>No more products</Text>
        </View>
      );
    }
    return null;
  };

  if (loading && !products.length) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator color={theme.Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Icon name="storefront-outline" size={48} color={theme.Colors.white20} />
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptySubtitle}>
                This store hasn&apos;t listed any products
              </Text>
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading) {
            loadProducts();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.Colors.primary}
          />
        }
        renderItem={renderProduct}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.Colors.black,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: GRID_PADDING,
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  coverWrapper: {
    width: '100%',
    height: 180,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    backgroundColor: theme.Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.Colors.surfaceBorder,
  },
  logoPlaceholder: {
    backgroundColor: theme.Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.xl,
    fontWeight: '700',
  },
  followerCount: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  followingBtn: {
    backgroundColor: theme.Colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.Colors.primary,
  },
  followBtnText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  followingBtnText: {
    color: theme.Colors.primary,
  },
  bio: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginTop: theme.Spacing.md,
    lineHeight: 20,
  },
  categoriesWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
    paddingBottom: theme.Spacing.sm,
  },
  categoriesList: {
    paddingHorizontal: theme.Spacing.lg,
    gap: theme.Spacing.sm,
  },
  categoryPill: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: theme.Colors.primary,
  },
  categoryPillText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: theme.Colors.white,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.black,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.Spacing.xl,
  },
  emptyTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    marginTop: theme.Spacing.lg,
  },
  emptySubtitle: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginTop: theme.Spacing.xs,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
  },
});

export default StorefrontScreen;
