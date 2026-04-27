import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SwipeableListView,
  GestureHandlerRootView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RectButton } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../theme';
import { useCartStore, CartItem } from '../stores/cartStore';

type RootStackParamList = {
  Checkout: undefined;
  Storefront: { userId: string };
};

const SHIPPING_RATE = 49;
const TAX_RATE = 0.18;

const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);

  const subtotal = getSubtotal();
  const shipping = items.length > 0 ? SHIPPING_RATE : 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  const handleRemove = useCallback(
    (productId: string, variant: string, productName: string) => {
      Alert.alert('Remove item', `Remove "${productName}" from cart?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(productId, variant),
        },
      ]);
    },
    [removeItem],
  );

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigation.navigate('Checkout');
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const image = item.image || '';

    return (
      <SwipeableRow
        key={`${item.productId}-${item.variant}`}
        onSwipe={() => handleRemove(item.productId, item.variant, item.productName)}>
        <View style={styles.cartItem}>
          {/* Image */}
          <Image
            source={image ? { uri: image } : require('../../assets/placeholder.png')}
            style={styles.itemImage}
            resizeMode="cover"
          />

          {/* Info */}
          <View style={styles.itemInfo}>
            <Text numberOfLines={2} style={styles.itemName}>
              {item.productName}
            </Text>
            {item.variant ? (
              <Text style={styles.itemVariant}>{item.variant}</Text>
            ) : null}
            <Text style={styles.itemPrice}>
              ₹{item.price.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() =>
                updateQuantity(item.productId, item.variant, item.quantity - 1)
              }>
              <Icon name="remove" size={16} color={theme.Colors.white} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() =>
                updateQuantity(
                  item.productId,
                  item.variant,
                  Math.min(item.stock, item.quantity + 1),
                )
              }>
              <Icon name="add" size={16} color={theme.Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() =>
              handleRemove(item.productId, item.variant, item.productName)
            }>
            <Icon name="trash-outline" size={18} color={theme.Colors.danger} />
          </TouchableOpacity>
        </View>
      </SwipeableRow>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Icon name="cart-outline" size={64} color={theme.Colors.white20} />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven&apos;t added anything to your cart yet.
      </Text>
      <TouchableOpacity
        style={styles.startShoppingBtn}
        onPress={() => navigation.goBack()}>
        <Text style={styles.startShoppingText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Cart ({useCartStore.getState().getItemCount()})
        </Text>
      </View>

      {items.length > 0 ? (
        <>
          <FlatList
            data={items}
            keyExtractor={(item, idx) => `${item.productId}-${item.variant}-${idx}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₹{subtotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                ₹{shipping.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18%)</Text>
              <Text style={styles.summaryValue}>
                ₹{tax.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </GestureHandlerRootView>
  );
};

/* ── Swipeable Row Component ─────────────────────────────────────────────── */

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipe: () => void;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onSwipe }) => {
  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={styles.swipeBackground}>
        <RectButton
          style={styles.swipeAction}
          onPress={onSwipe}>
          <Icon name="trash" size={24} color={theme.Colors.white} />
          <Text style={styles.swipeText}>Delete</Text>
        </RectButton>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.Colors.black,
  },
  header: {
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
  list: {
    paddingHorizontal: theme.Spacing.lg,
    paddingTop: theme.Spacing.md,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: theme.Colors.surfaceBorder,
    marginVertical: 2,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.md,
    backgroundColor: theme.Colors.black,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: theme.BorderRadius.sm,
    backgroundColor: theme.Colors.surface,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  itemVariant: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 1,
  },
  itemPrice: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
    marginTop: 4,
  },
  quantityControls: {
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 8,
  },
  swipeBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  swipeAction: {
    backgroundColor: theme.Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: theme.Spacing.lg,
    marginTop: theme.Spacing.sm,
    padding: theme.Spacing.lg,
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    gap: theme.Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.md,
  },
  summaryValue: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.Colors.surfaceBorder,
    paddingTop: theme.Spacing.md,
    marginTop: theme.Spacing.xs,
  },
  totalLabel: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  totalValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xl,
    fontWeight: '800',
  },
  checkoutBtn: {
    margin: theme.Spacing.lg,
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xxl,
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    marginBottom: theme.Spacing.lg,
  },
  emptyTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.xl,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    textAlign: 'center',
    marginTop: theme.Spacing.sm,
    lineHeight: 20,
  },
  startShoppingBtn: {
    marginTop: theme.Spacing.xxl,
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  startShoppingText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
  },
});

export default CartScreen;
