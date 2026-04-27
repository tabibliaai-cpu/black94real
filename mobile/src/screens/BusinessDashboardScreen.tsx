import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import theme from '../theme';
import { ShopOrder, fetchBusinessOrders } from '../lib/shop';

type RootStackParamList = {
  AddProduct: { product?: undefined };
  Storefront: { userId: string };
  CrmLeads: undefined;
  CrmOrders: undefined;
  MyStore: undefined;
};

const BusinessDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth().currentUser?.uid ?? '';

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
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
    loadData();
  }, [loadData]);

  const todayStr = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));
  const weekOrders = orders.filter((o) => o.createdAt >= weekAgo);
  const monthOrders = orders.filter((o) => o.createdAt >= monthAgo);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return theme.Colors.success;
      case 'shipped': return theme.Colors.info;
      case 'processing': return theme.Colors.warning;
      case 'confirmed': return theme.Colors.primary;
      case 'cancelled': return theme.Colors.danger;
      case 'refunded': return theme.Colors.danger;
      default: return theme.Colors.textTertiary;
    }
  };

  const recentOrders = orders.slice(0, 10);

  const renderStatCard = (
    label: string,
    value: string,
    icon: string,
    color: string,
    trend?: string,
  ) => (
    <View style={styles.statCard} key={label}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      {trend && (
        <Text style={[styles.statTrend, { color }]}>
          <Icon name={trend.startsWith('+') ? 'trending-up' : 'trending-down'} size={14} />
          {' '}{trend}
        </Text>
      )}
    </View>
  );

  const renderQuickAction = (
    label: string,
    icon: string,
    color: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={label}
      style={styles.quickAction}
      onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Business Dashboard</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={theme.Colors.primary}
          />
        }>
        {/* Revenue Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.revenueGrid}>
            {renderStatCard('Today', `₹${todayRevenue.toLocaleString('en-IN')}`, 'today-outline', theme.Colors.success)}
            {renderStatCard('This Week', `₹${weekRevenue.toLocaleString('en-IN')}`, 'calendar-outline', theme.Colors.primary, '+12%')}
            {renderStatCard('This Month', `₹${monthRevenue.toLocaleString('en-IN')}`, 'wallet-outline', theme.Colors.warning, '+8%')}
          </View>
        </View>

        {/* Order Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.orderStatCard}>
              <Text style={styles.orderStatValue}>{orders.length}</Text>
              <Text style={styles.orderStatLabel}>Total Orders</Text>
            </View>
            <View style={styles.orderStatCard}>
              <Text style={styles.orderStatValue}>{todayOrders.length}</Text>
              <Text style={styles.orderStatLabel}>Today</Text>
            </View>
            <View style={styles.orderStatCard}>
              <Text style={styles.orderStatValue}>
                {orders.filter((o) => o.status === 'pending').length}
              </Text>
              <Text style={styles.orderStatLabel}>Pending</Text>
            </View>
            <View style={styles.orderStatCard}>
              <Text style={styles.orderStatValue}>
                {orders.filter((o) => o.status === 'delivered').length}
              </Text>
              <Text style={styles.orderStatLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Bar Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Orders</Text>
          <View style={styles.chartContainer}>
            <View style={styles.bars}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const height = Math.random() * 80 + 20;
                return (
                  <View key={day} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        { height: `${height}%` },
                        idx === 4 && styles.barHighlight,
                      ]}
                    />
                    <Text style={styles.barLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('Add Product', 'add-circle-outline', theme.Colors.primary, () => navigation.navigate('AddProduct', {}))}
            {renderQuickAction('View Store', 'storefront-outline', theme.Colors.success, () => navigation.navigate('Storefront', { userId: uid }))}
            {renderQuickAction('CRM Leads', 'people-outline', theme.Colors.warning, () => navigation.navigate('CrmLeads'))}
            {renderQuickAction('Orders', 'list-outline', theme.Colors.info, () => navigation.navigate('CrmOrders'))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => navigation.navigate('CrmOrders')}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Icon name="chevron-forward" size={20} color={theme.Colors.primary} />
          </TouchableOpacity>

          {recentOrders.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No orders yet</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderId}>#{order.id.slice(-8)}</Text>
                  <Text style={styles.orderBuyer}>{order.buyerName}</Text>
                </View>
                <View style={styles.orderItemRight}>
                  <Text style={styles.orderTotal}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor(order.status) }]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  section: {
    padding: theme.Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.md,
  },
  sectionTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    marginBottom: theme.Spacing.md,
  },
  revenueGrid: {
    gap: theme.Spacing.sm,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    gap: theme.Spacing.md,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginTop: 2,
  },
  statTrend: {
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
  },
  orderStatCard: {
    flex: 1,
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    alignItems: 'center',
  },
  orderStatValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.xl,
    fontWeight: '700',
  },
  orderStatLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.lg,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    backgroundColor: theme.Colors.primary + '40',
    marginBottom: 8,
  },
  barHighlight: {
    backgroundColor: theme.Colors.primary,
  },
  barLabel: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.md,
  },
  quickAction: {
    alignItems: 'center',
    width: '30%',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.Spacing.xs,
  },
  quickActionLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderId: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  orderBuyer: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  orderItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTotal: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
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
  emptySection: {
    alignItems: 'center',
    paddingVertical: theme.Spacing.xl,
  },
  emptySectionText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
  },
});

export default BusinessDashboardScreen;
