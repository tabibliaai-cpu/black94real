import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import theme from '../theme';
import {
  ShopOrder,
  fetchBusinessOrders,
  updateOrderStatus,
} from '../lib/shop';

type RootStackParamList = {
  OrderTracking: { orderId: string };
};

const STATUS_TABS: Array<{
  key: string;
  label: string;
  color: string;
}> = [
  { key: 'all', label: 'All', color: theme.Colors.textSecondary },
  { key: 'pending', label: 'Pending', color: theme.Colors.warning },
  { key: 'confirmed', label: 'Confirmed', color: theme.Colors.primary },
  { key: 'processing', label: 'Processing', color: theme.Colors.info },
  { key: 'shipped', label: 'Shipped', color: '#8b5cf6' },
  { key: 'delivered', label: 'Delivered', color: theme.Colors.success },
  { key: 'cancelled', label: 'Cancelled', color: theme.Colors.danger },
];

const CrmOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth().currentUser?.uid ?? '';

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const result = await fetchBusinessOrders(uid);
      setOrders(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.status === activeTab));
    }
  }, [orders, activeTab]);

  const statusColor = (status: string) => {
    const s = STATUS_TABS.find((t) => t.key === status);
    return s?.color ?? theme.Colors.textTertiary;
  };

  const handleUpdateStatus = (order: ShopOrder) => {
    const nextStatuses: Record<string, ShopOrder['status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
      refunded: [],
    };

    const options = nextStatuses[order.status] || [];

    if (options.length === 0) {
      Alert.alert('Info', 'No further actions available for this order.');
      return;
    }

    Alert.alert(
      'Update Status',
      `Current: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...options.map((status) => ({
          text: status.charAt(0).toUpperCase() + status.slice(1),
          onPress: async () => {
            try {
              await updateOrderStatus(order.id, status);
              setOrders((prev) =>
                prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
              );
              setSelectedOrder((prev) => (prev?.id === order.id ? { ...prev, status } : prev));
            } catch {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        })),
      ],
    );
  };

  const parseItems = (itemsJson: string) => {
    try {
      return JSON.parse(itemsJson) || [];
    } catch {
      return [];
    }
  };

  const parseAddress = (addrJson: string) => {
    try {
      return JSON.parse(addrJson) || {};
    } catch {
      return {};
    }
  };

  const renderOrder = ({ item }: { item: ShopOrder }) => {
    const items = parseItems(item.items);
    const itemCount = Array.isArray(items) ? items.length : 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setSelectedOrder(item)}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item.id.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderBuyer}>
              <Icon name="person-outline" size={14} /> {item.buyerName}
            </Text>
            <Text style={styles.orderItems}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>
              ₹{item.total.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator color={theme.Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerCount}>{orders.length} orders</Text>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === item.key && {
                  backgroundColor: item.color + '20',
                  borderColor: item.color,
                },
              ]}
              onPress={() => setActiveTab(item.key)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.key && { color: item.color },
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.ordersList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="receipt-outline" size={48} color={theme.Colors.white20} />
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all'
                ? 'Orders will appear when customers purchase'
                : `No ${activeTab} orders`}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            tintColor={theme.Colors.primary}
          />
        }
      />

      {/* Order Detail Modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Order #{selectedOrder.id.slice(-8)}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <Icon name="close" size={24} color={theme.Colors.white} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Status */}
                  <View style={styles.modalStatusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(selectedOrder.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor(selectedOrder.status) }]}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.modalDate}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Buyer */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Buyer</Text>
                    <Text style={styles.modalText}>{selectedOrder.buyerName}</Text>
                    <Text style={styles.modalSubtext}>{selectedOrder.buyerEmail}</Text>
                  </View>

                  {/* Items */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Items</Text>
                    {parseItems(selectedOrder.items).map((item: any, idx: number) => (
                      <View key={idx} style={styles.modalItem}>
                        <Text style={styles.modalItemName}>
                          {item.productName} x{item.quantity}
                        </Text>
                        <Text style={styles.modalItemPrice}>
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Totals */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Summary</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Subtotal</Text>
                      <Text style={styles.modalValue}>
                        ₹{selectedOrder.subtotal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Shipping</Text>
                      <Text style={styles.modalValue}>
                        ₹{selectedOrder.shipping.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Tax</Text>
                      <Text style={styles.modalValue}>
                        ₹{selectedOrder.tax.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.modalRow, styles.modalTotalRow]}>
                      <Text style={styles.modalTotalLabel}>Total</Text>
                      <Text style={styles.modalTotalValue}>
                        ₹{selectedOrder.total.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Shipping */}
                  {selectedOrder.trackingNumber && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Shipping</Text>
                      <Text style={styles.modalText}>
                        Partner: {selectedOrder.trackingPartner}
                      </Text>
                      <Text style={styles.modalText}>
                        Tracking: {selectedOrder.trackingNumber}
                      </Text>
                    </View>
                  )}

                  {/* Address */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Shipping Address</Text>
                    {(() => {
                      const addr = parseAddress(selectedOrder.shippingAddress);
                      return (
                        <>
                          <Text style={styles.modalText}>{addr.name}</Text>
                          <Text style={styles.modalSubtext}>{addr.line1}</Text>
                          {addr.line2 && <Text style={styles.modalSubtext}>{addr.line2}</Text>}
                          <Text style={styles.modalSubtext}>
                            {addr.city}, {addr.state} - {addr.pincode}
                          </Text>
                          <Text style={styles.modalSubtext}>{addr.phone}</Text>
                        </>
                      );
                    })()}
                  </View>

                  {/* Action */}
                  <TouchableOpacity
                    style={styles.updateStatusBtn}
                    onPress={() => handleUpdateStatus(selectedOrder)}>
                    <Text style={styles.updateStatusText}>Update Status</Text>
                  </TouchableOpacity>
                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  headerCount: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  tabList: {
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.sm,
    gap: theme.Spacing.sm,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.BorderRadius.lg,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
  },
  tabText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  ordersList: {
    padding: theme.Spacing.lg,
  },
  separator: {
    height: 8,
  },
  orderCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  orderId: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.BorderRadius.sm,
  },
  statusText: {
    fontSize: theme.FontSize.xs,
    fontWeight: '600',
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderBuyer: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  orderItems: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  orderDate: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.Colors.surface,
    borderTopLeftRadius: theme.BorderRadius.xl,
    borderTopRightRadius: theme.BorderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  modalTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
  },
  modalBody: {
    padding: theme.Spacing.lg,
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  modalDate: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
  },
  modalSection: {
    marginBottom: theme.Spacing.lg,
  },
  modalSectionTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
    marginBottom: theme.Spacing.xs,
  },
  modalText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  modalSubtext: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
    marginTop: 2,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalItemName: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  modalItemPrice: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  modalValue: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  modalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.Colors.surfaceBorder,
    paddingTop: theme.Spacing.sm,
    marginTop: theme.Spacing.xs,
  },
  modalTotalLabel: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  modalTotalValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '800',
  },
  updateStatusBtn: {
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.Spacing.md,
  },
  updateStatusText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
});

export default CrmOrdersScreen;
