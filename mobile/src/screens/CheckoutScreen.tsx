import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../theme';
import { useCartStore, CartItem } from '../stores/cartStore';
import {
  createOrder,
  OrderItem,
  ShippingPartner,
  fetchShippingPartners,
  calculateShipping,
} from '../lib/shop';

type RootStackParamList = {
  OrderTracking: { orderId: string };
  Cart: undefined;
};

interface AddressForm {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);

  const [address, setAddress] = useState<AddressForm>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [partners, setPartners] = useState<ShippingPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Partial<AddressForm>>({});

  const subtotal = getSubtotal();
  const partner = partners.find((p) => p.id === selectedPartner);
  const shipping = partner ? calculateShipping(partner) : 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  useEffect(() => {
    fetchShippingPartners().then(setPartners).catch(() => {
      // fallback partners
      setPartners([
        {
          id: 'shiprocket',
          name: 'ShipRocket',
          logo: '',
          isActive: true,
          baseRate: 49,
          perKgRate: 15,
          estimatedDays: '3-5',
          supportsCOD: true,
          supportsPrepaid: true,
        },
        {
          id: 'delhivery',
          name: 'Delhivery',
          logo: '',
          isActive: true,
          baseRate: 59,
          perKgRate: 18,
          estimatedDays: '2-4',
          supportsCOD: true,
          supportsPrepaid: true,
        },
      ]);
    });
  }, []);

  useEffect(() => {
    if (partners.length > 0 && !selectedPartner) {
      setSelectedPartner(partners[0].id);
    }
  }, [partners, selectedPartner]);

  const validate = (): boolean => {
    const e: Partial<AddressForm> = {};
    if (!address.name.trim()) e.name = 'Required';
    if (!address.phone.trim()) e.phone = 'Required';
    else if (!/^\d{10}$/.test(address.phone.trim())) e.phone = 'Invalid phone';
    if (!address.line1.trim()) e.line1 = 'Required';
    if (!address.city.trim()) e.city = 'Required';
    if (!address.state.trim()) e.state = 'Required';
    if (!address.pincode.trim()) e.pincode = 'Required';
    else if (!/^\d{6}$/.test(address.pincode.trim())) e.pincode = 'Invalid pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = useCallback(async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    setPlacing(true);
    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variant: item.variant,
      }));

      const order = await createOrder({
        buyerId: '',
        buyerName: address.name,
        buyerEmail: '',
        businessId: items[0].businessId,
        businessName: items[0].businessName,
        items: JSON.stringify(orderItems),
        subtotal,
        shipping,
        tax,
        total,
        shippingAddress: JSON.stringify(address),
        trackingNumber: '',
        trackingPartner: partner?.name ?? '',
        notes: `Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}`,
      });

      clearCart();
      Alert.alert('Order Placed!', `Order #${order.id} has been placed successfully.`, [
        {
          text: 'Track Order',
          onPress: () => navigation.replace('OrderTracking', { orderId: order.id }),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [
    address, items, subtotal, shipping, tax, total, partner, paymentMethod,
    clearCart, navigation, validate,
  ]);

  const renderInput = (
    field: keyof AddressForm,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'phone-number' | 'numeric' = 'default',
    multiline = false,
  ) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={theme.Colors.textTertiary}
        value={address[field]}
        onChangeText={(text) => {
          setAddress((prev) => ({ ...prev, [field]: text }));
          if (errors[field]) {
            setErrors((prev) => {
              const copy = { ...prev };
              delete copy[field];
              return copy;
            });
          }
        }}
        keyboardType={keyboardType}
        returnKeyType="next"
        autoCapitalize="none"
        multiline={multiline}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={64} color={theme.Colors.white20} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.emptyBtnText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="location-outline" size={18} color={theme.Colors.primary} />{' '}
            Shipping Address
          </Text>
          {renderInput('name', 'Full Name *', 'John Doe')}
          {renderInput('phone', 'Phone *', '9876543210', 'phone-number')}
          {renderInput('line1', 'Address Line 1 *', 'House/Flat no., Street')}
          {renderInput('line2', 'Address Line 2', 'Area, Landmark (optional)')}
          {renderInput('city', 'City *', 'Mumbai')}
          {renderInput('state', 'State *', 'Maharashtra')}
          {renderInput('pincode', 'Pincode *', '400001', 'numeric')}
        </View>

        {/* Shipping Partner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="truck-outline" size={18} color={theme.Colors.primary} />{' '}
            Shipping Partner
          </Text>
          {partners.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.partnerCard,
                selectedPartner === p.id && styles.partnerCardSelected,
              ]}
              onPress={() => setSelectedPartner(p.id)}>
              <View style={styles.partnerRadio}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPartner === p.id && styles.radioOuterActive,
                  ]}>
                  {selectedPartner === p.id && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{p.name}</Text>
                <Text style={styles.partnerMeta}>
                  {p.estimatedDays} days • ₹{p.baseRate} + ₹{p.perKgRate}/kg
                </Text>
              </View>
              <Text style={styles.partnerPrice}>
                ₹{calculateShipping(p).toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="card-outline" size={18} color={theme.Colors.primary} />{' '}
            Payment Method
          </Text>
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'cod' && styles.paymentCardSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'cod' && styles.radioOuterActive,
              ]}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Cash on Delivery</Text>
              <Text style={styles.paymentMeta}>Pay when you receive</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'online' && styles.paymentCardSelected,
            ]}
            onPress={() => setPaymentMethod('online')}>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'online' && styles.radioOuterActive,
              ]}>
              {paymentMethod === 'online' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Online Payment</Text>
              <Text style={styles.paymentMeta}>UPI, Cards, Net Banking</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="receipt-outline" size={18} color={theme.Colors.primary} />{' '}
            Order Summary
          </Text>
          <View style={styles.summaryCard}>
            {items.map((item, idx) => (
              <View key={`${item.productId}-${idx}`} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.productName} x{item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
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
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, placing && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={placing}>
          {placing ? (
            <ActivityIndicator color={theme.Colors.white} size="small" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: theme.Spacing.lg,
  },
  sectionTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    marginBottom: theme.Spacing.lg,
  },
  fieldWrapper: {
    marginBottom: theme.Spacing.md,
  },
  fieldLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginBottom: theme.Spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.md,
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
  },
  inputError: {
    borderColor: theme.Colors.danger,
  },
  errorText: {
    color: theme.Colors.danger,
    fontSize: theme.FontSize.xs,
    marginTop: 4,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.sm,
    gap: theme.Spacing.md,
  },
  partnerCardSelected: {
    borderColor: theme.Colors.primary,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  partnerRadio: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.Colors.white20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: theme.Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
  },
  partnerMeta: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  partnerPrice: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.sm,
    gap: theme.Spacing.md,
  },
  paymentCardSelected: {
    borderColor: theme.Colors.primary,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
  },
  paymentMeta: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.Spacing.xs,
  },
  summaryItemName: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    flex: 1,
  },
  summaryItemPrice: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
    marginLeft: theme.Spacing.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.Colors.surfaceBorder,
    marginVertical: theme.Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  summaryValue: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.Colors.surfaceBorder,
    paddingTop: theme.Spacing.sm,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.Spacing.lg,
    backgroundColor: theme.Colors.black,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.surfaceBorder,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomTotalLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  bottomTotalValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xxl,
    fontWeight: '800',
  },
  placeOrderBtn: {
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  placeOrderText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.lg,
    marginTop: theme.Spacing.lg,
  },
  emptyBtn: {
    marginTop: theme.Spacing.xl,
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
