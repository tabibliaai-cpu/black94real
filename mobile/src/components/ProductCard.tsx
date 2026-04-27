import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme, { styles as globalStyles } from '../theme';
import { ShopProduct } from '../lib/shop';

interface ProductCardProps {
  product: ShopProduct;
  onPress: (product: ShopProduct) => void;
  style?: ViewStyle;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  const images = product.images ? product.images.split(',').map((s) => s.trim()) : [];
  const firstImage = images[0] || '';

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.container, style]}
      onPress={() => onPress(product)}>
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={firstImage ? { uri: firstImage } : require('../../assets/placeholder.png')}
          style={styles.image}
          resizeMode="cover"
        />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        {product.isFeatured && (
          <View style={[styles.featuredBadge, { position: 'absolute', top: 6, right: 6 }]}>
            <Icon name="star" size={10} color="#f59e0b" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.businessName}>
          {product.businessName}
        </Text>

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
        </View>

        {/* Rating + Sold */}
        <View style={styles.metaRow}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color="#f59e0b" />
            <Text style={styles.metaText}>
              {product.rating > 0 ? product.rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <Text style={styles.soldText}>
            {product.soldCount > 0 ? `${product.soldCount} sold` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: theme.Colors.surfaceLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: theme.Colors.danger,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xs,
    fontWeight: '700',
  },
  featuredBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: theme.Spacing.sm,
  },
  name: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  businessName: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.sm,
    gap: 6,
  },
  price: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  comparePrice: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
  },
  soldText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
});

export default ProductCard;
