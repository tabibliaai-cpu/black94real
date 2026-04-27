import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../theme';
import { useCartStore } from '../stores/cartStore';
import {
  ShopProduct,
  ShopReview,
  fetchProductById,
  fetchProductReviews,
} from '../lib/shop';

type RootStackParamList = {
  ProductDetail: { productId: string };
  Cart: undefined;
  Storefront: { userId: string };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { productId } = route.params;

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prod, revs] = await Promise.all([
        fetchProductById(productId),
        fetchProductReviews(productId),
      ]);
      setProduct(prod);
      setReviews(revs);
    } catch {
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const images = product?.images
    ? product.images.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  let parsedVariants: { name: string; options: string[] }[] = [];
  try {
    if (product?.variants) {
      parsedVariants = JSON.parse(product.variants);
      if (!Array.isArray(parsedVariants)) parsedVariants = [];
    }
  } catch {
    parsedVariants = [];
  }

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      const variantLabel = parsedVariants
        .map((v) => v.options[selectedVariant] || '')
        .filter(Boolean)
        .join(' / ');

      addItem({
        productId: product.id,
        productName: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: images[0] || '',
        variant: variantLabel,
        quantity,
        businessId: product.businessId,
        businessName: product.businessName,
        stock: product.stock,
      });
      Alert.alert('Added to cart', `${product.name} added to your cart`);
    } catch {
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart().then(() => {
      navigation.navigate('Cart');
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={16}
          color={i <= Math.round(rating) ? '#f59e0b' : theme.Colors.white20}
        />,
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator color={theme.Colors.primary} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerLoader}>
        <Icon name="alert-circle-outline" size={48} color={theme.Colors.textTertiary} />
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Image Carousel */}
        <View style={styles.carouselWrapper}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                  );
                  setCurrentImageIndex(idx);
                }}>
                {images.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.carouselDots}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === currentImageIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.carouselImage, styles.carouselPlaceholder]}>
              <Icon name="image-outline" size={64} color={theme.Colors.white20} />
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.Colors.white} />
          </TouchableOpacity>

          {/* Discount Badge */}
          {discount > 0 && (
            <View style={styles.carouselDiscount}>
              <Text style={styles.carouselDiscountText}>-{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating & Sold */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>{renderStars(product.rating)}</View>
            <Text style={styles.ratingValue}>
              {product.rating > 0 ? product.rating.toFixed(1) : 'New'}
            </Text>
            <Text style={styles.ratingSep}>•</Text>
            <Text style={styles.soldText}>
              {product.reviewCount} reviews
            </Text>
            <Text style={styles.ratingSep}>•</Text>
            <Text style={styles.soldText}>
              {product.soldCount} sold
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Text style={styles.comparePrice}>
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </Text>
            )}
            {discount > 0 && (
              <View style={styles.discountChip}>
                <Text style={styles.discountChipText}>{discount}% off</Text>
              </View>
            )}
          </View>

          {/* Business */}
          <TouchableOpacity
            style={styles.businessRow}
            onPress={() =>
              navigation.navigate('Storefront', { userId: product.businessId })
            }>
            {product.businessImage ? (
              <Image source={{ uri: product.businessImage }} style={styles.businessImg} />
            ) : (
              <View style={[styles.businessImg, styles.businessImgPlaceholder]}>
                <Icon name="storefront" size={14} color={theme.Colors.white40} />
              </View>
            )}
            <Text style={styles.businessName}>{product.businessName}</Text>
            <Icon name="chevron-forward" size={18} color={theme.Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={descriptionExpanded ? undefined : 3}>
            {product.description || 'No description available.'}
          </Text>
          {product.description && product.description.length > 100 && (
            <TouchableOpacity onPress={() => setDescriptionExpanded(!descriptionExpanded)}>
              <Text style={styles.readMoreBtn}>
                {descriptionExpanded ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Variants */}
        {parsedVariants.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Variants</Text>
              <View style={styles.variantsGrid}>
                {parsedVariants[0]?.options?.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.variantChip,
                      selectedVariant === idx && styles.variantChipActive,
                    ]}
                    onPress={() => setSelectedVariant(idx)}>
                    <Text
                      style={[
                        styles.variantChipText,
                        selectedVariant === idx && styles.variantChipTextActive,
                      ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}>
              <Icon
                name="remove"
                size={20}
                color={quantity <= 1 ? theme.Colors.white20 : theme.Colors.white}
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}>
              <Icon
                name="add"
                size={20}
                color={
                  quantity >= product.stock ? theme.Colors.white20 : theme.Colors.white
                }
              />
            </TouchableOpacity>
            <Text style={styles.stockText}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              Reviews ({reviews.length})
            </Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {review.buyerImage ? (
                    <Image source={{ uri: review.buyerImage }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={styles.reviewAvatarPlaceholder}>
                      <Icon name="person" size={16} color={theme.Colors.white40} />
                    </View>
                  )}
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewName}>{review.buyerName}</Text>
                    <View style={styles.stars}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing for buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <SafeAreaView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.addToCartBtn, addingToCart && styles.disabledBtn]}
            onPress={handleAddToCart}
            disabled={addingToCart || product.stock === 0}>
            {addingToCart ? (
              <ActivityIndicator color={theme.Colors.black} size="small" />
            ) : (
              <>
                <Icon name="cart-outline" size={20} color={theme.Colors.black} />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyNowBtn, product.stock === 0 && styles.disabledBtn]}
            onPress={handleBuyNow}
            disabled={product.stock === 0}>
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.Colors.black,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.black,
  },
  errorText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.lg,
    marginTop: theme.Spacing.lg,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  carouselWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    position: 'relative',
    backgroundColor: theme.Colors.surface,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
  },
  carouselPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.Colors.white40,
  },
  dotActive: {
    backgroundColor: theme.Colors.white,
    width: 18,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselDiscount: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: theme.Colors.danger,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  carouselDiscountText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.sm,
    fontWeight: '700',
  },
  infoSection: {
    padding: theme.Spacing.lg,
  },
  productName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.xxl,
    fontWeight: '700',
    lineHeight: 30,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.sm,
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingValue: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginLeft: 4,
  },
  ratingSep: {
    color: theme.Colors.white20,
    fontSize: theme.FontSize.sm,
  },
  soldText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.md,
    gap: 8,
  },
  price: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xxxl,
    fontWeight: '800',
  },
  comparePrice: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.lg,
    textDecorationLine: 'line-through',
  },
  discountChip: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountChipText: {
    color: theme.Colors.danger,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.lg,
    gap: 8,
  },
  businessImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  businessImgPlaceholder: {
    backgroundColor: theme.Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessName: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.Colors.surfaceBorder,
    marginHorizontal: theme.Spacing.lg,
  },
  section: {
    padding: theme.Spacing.lg,
  },
  sectionTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    marginBottom: theme.Spacing.md,
  },
  descriptionText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.md,
    lineHeight: 22,
  },
  readMoreBtn: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
    marginTop: theme.Spacing.sm,
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  variantChipActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  variantChipText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  variantChipTextActive: {
    color: theme.Colors.white,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.lg,
  },
  quantityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  stockText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
    marginLeft: 'auto',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
  },
  noReviews: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
  },
  reviewCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  reviewComment: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginTop: 8,
    lineHeight: 18,
  },
  reviewDate: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.Spacing.lg,
    backgroundColor: theme.Colors.black,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.surfaceBorder,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.Colors.white,
    borderRadius: theme.BorderRadius.md,
    paddingVertical: 14,
  },
  addToCartText: {
    color: theme.Colors.black,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingVertical: 14,
  },
  buyNowText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.4,
  },
});

export default ProductDetailScreen;
