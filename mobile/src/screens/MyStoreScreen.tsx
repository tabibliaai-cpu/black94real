import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import theme from '../theme';
import { ScrollView } from 'react-native';
import {
  ShopProduct,
  fetchBusinessProducts,
  deleteProduct,
} from '../lib/shop';

type RootStackParamList = {
  AddProduct: { product?: ShopProduct };
  Storefront: { userId: string };
  ProductDetail: { productId: string };
};

const MyStoreScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth().currentUser?.uid ?? '';

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'stats'>('active');

  const loadProducts = useCallback(async () => {
    try {
      const result = await fetchBusinessProducts(uid, 50);
      setProducts(result.products);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = (product: ShopProduct) => {
    Alert.alert('Delete Product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
          } catch {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const totalRevenue = products.reduce((sum, p) => sum + p.price * p.soldCount, 0);
  const avgRating =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.rating, 0) / products.length
      : 0;

  const renderStat = (label: string, value: string, icon: string, color: string) => (
    <View style={styles.statCard} key={label}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ShopProduct }) => {
    const images = item.images ? item.images.split(',').map((s) => s.trim()) : [];
    const firstImage = images[0] || '';

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
        <Image
          source={firstImage ? { uri: firstImage } : require('../../assets/placeholder.png')}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>
            ₹{item.price.toLocaleString('en-IN')}
          </Text>
          <View style={styles.productMeta}>
            <Text style={styles.productStock}>
              {item.stock} in stock
            </Text>
            <Text style={styles.productSold}>
              {item.soldCount} sold
            </Text>
          </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AddProduct', { product: item })}>
            <Icon name="create-outline" size={18} color={theme.Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}>
            <Icon name="trash-outline" size={18} color={theme.Colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Store</Text>
        <TouchableOpacity
          style={styles.viewStoreBtn}
          onPress={() => navigation.navigate('Storefront', { userId: uid })}>
          <Icon name="storefront-outline" size={18} color={theme.Colors.primary} />
          <Text style={styles.viewStoreText}>View Store</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}>
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'stats' ? (
        <ScrollView
          contentContainerStyle={styles.statsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} />
          }>
          {renderStat('Products', products.length.toString(), 'cube-outline', theme.Colors.primary)}
          {renderStat('Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, 'wallet-outline', theme.Colors.success)}
          {renderStat('Orders', products.reduce((s, p) => s + p.soldCount, 0).toString(), 'cart-outline', theme.Colors.warning)}
          {renderStat('Rating', avgRating.toFixed(1), 'star-outline', '#f59e0b')}

          <View style={styles.statsNote}>
            <Text style={styles.statsNoteText}>
              Stats are calculated from your product data. Detailed analytics available in the Business Dashboard.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Icon name="cube-outline" size={48} color={theme.Colors.white20} />
                <Text style={styles.emptyTitle}>No products yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap + to add your first product
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadProducts();
              }}
              tintColor={theme.Colors.primary}
            />
          }
        />
      )}

      {loading && products.length === 0 ? (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator color={theme.Colors.primary} size="large" />
        </View>
      ) : null}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={theme.Colors.black}
        onPress={() => navigation.navigate('AddProduct', {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  headerTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.xl,
    fontWeight: '700',
  },
  viewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  viewStoreText: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.Spacing.lg,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.Colors.primary,
  },
  tabText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.md,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: theme.Spacing.lg,
    paddingTop: theme.Spacing.md,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: theme.Colors.surfaceBorder,
    marginVertical: 2,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: theme.BorderRadius.sm,
    backgroundColor: theme.Colors.surface,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  productPrice: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    marginTop: 4,
  },
  productStock: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  productSold: {
    color: theme.Colors.success,
    fontSize: theme.FontSize.xs,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    padding: theme.Spacing.lg,
    paddingBottom: 100,
  },
  statCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.lg,
    marginBottom: theme.Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    flex: 1,
    color: theme.Colors.white,
    fontSize: theme.FontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  statsNote: {
    marginTop: theme.Spacing.lg,
    padding: theme.Spacing.md,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: theme.BorderRadius.md,
  },
  statsNoteText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: theme.Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
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
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default MyStoreScreen;
