import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import theme from '../theme';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  topProducts: Array<{ name: string; revenue: number; sold: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  leadFunnel: Array<{ stage: string; count: number; color: string }>;
}

const CrmAnalyticsScreen: React.FC = () => {
  const uid = auth().currentUser?.uid ?? '';
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      // Fetch orders for revenue data
      const ordersSnap = await firestore()
        .collection('orders')
        .where('businessId', '==', uid)
        .get();

      const orders = ordersSnap.docs.map((d) => d.data());
      const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by month (last 6 months)
      const monthMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        monthMap[key] = 0;
      }
      orders.forEach((o) => {
        if (o.createdAt) {
          const date = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          const key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          if (monthMap[key] !== undefined) {
            monthMap[key] += o.total ?? 0;
          }
        }
      });
      const revenueByMonth = Object.entries(monthMap).map(([month, revenue]) => ({
        month,
        revenue,
      }));
      const maxRevenue = Math.max(...revenueByMonth.map((r) => r.revenue), 1);

      // Fetch leads for funnel
      const leadsSnap = await firestore()
        .collection('leads')
        .where('businessId', '==', uid)
        .get();

      const leads = leadsSnap.docs.map((d) => d.data());
      const totalLeads = leads.length;
      const convertedLeads = leads.filter((l) => l.status === 'converted').length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const leadFunnel = [
        { stage: 'New', count: leads.filter((l) => l.status === 'new').length, color: theme.Colors.badgeNew },
        { stage: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length, color: theme.Colors.badgeContacted },
        { stage: 'Qualified', count: leads.filter((l) => l.status === 'qualified').length, color: theme.Colors.badgeQualified },
        { stage: 'Converted', count: convertedLeads, color: theme.Colors.badgeConverted },
        { stage: 'Lost', count: leads.filter((l) => l.status === 'lost').length, color: theme.Colors.badgeLost },
      ];

      // Top products (from orders items)
      const productMap: Record<string, { name: string; revenue: number; sold: number }> = {};
      orders.forEach((o) => {
        try {
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (!productMap[item.productId]) {
                productMap[item.productId] = { name: item.productName, revenue: 0, sold: 0 };
              }
              productMap[item.productId].revenue += item.price * item.quantity;
              productMap[item.productId].sold += item.quantity;
            });
          }
        } catch {
          // skip
        }
      });
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setData({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalLeads,
        convertedLeads,
        conversionRate,
        topProducts,
        revenueByMonth,
        leadFunnel,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

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
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAnalytics();
            }}
            tintColor={theme.Colors.primary}
          />
        }>
        {/* KPI Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Icon name="wallet-outline" size={20} color={theme.Colors.success} />
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiValue}>
                  ₹{(data?.totalRevenue ?? 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.kpiLabel}>Total Revenue</Text>
              </View>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="receipt-outline" size={20} color={theme.Colors.primary} />
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiValue}>{data?.totalOrders ?? 0}</Text>
                <Text style={styles.kpiLabel}>Total Orders</Text>
              </View>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="analytics-outline" size={20} color={theme.Colors.warning} />
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiValue}>
                  ₹{Math.round(data?.avgOrderValue ?? 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.kpiLabel}>Avg Order Value</Text>
              </View>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="people-outline" size={20} color={theme.Colors.info} />
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiValue}>{data?.totalLeads ?? 0}</Text>
                <Text style={styles.kpiLabel}>Total Leads</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Revenue Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend (Last 6 Months)</Text>
          <View style={styles.chartCard}>
            {data?.revenueByMonth.map((item) => {
              const barHeight = (item.revenue / (data ? Math.max(...data.revenueByMonth.map((r) => r.revenue), 1) : 1)) * 100;
              return (
                <View key={item.month} style={styles.chartBarCol}>
                  <Text style={styles.chartBarValue}>
                    {item.revenue > 0 ? `₹${(item.revenue / 1000).toFixed(1)}k` : ''}
                  </Text>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { height: `${Math.max(barHeight, 4)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>{item.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          <View style={styles.card}>
            {(data?.topProducts.length ?? 0) === 0 ? (
              <Text style={styles.emptyText}>No product data yet</Text>
            ) : (
              data?.topProducts.map((product, idx) => (
                <View key={idx} style={styles.productRow}>
                  <View style={styles.productRank}>
                    <Text style={styles.productRankText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productSold}>
                      {product.sold} sold
                    </Text>
                  </View>
                  <Text style={styles.productRevenue}>
                    ₹{product.revenue.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Lead Conversion Funnel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Conversion Funnel</Text>
          <View style={styles.card}>
            {data?.leadFunnel.map((stage) => {
              const maxWidth = data.totalLeads > 0 ? (stage.count / data.totalLeads) * 100 : 0;
              return (
                <View key={stage.stage} style={styles.funnelStage}>
                  <View style={styles.funnelLabelRow}>
                    <Text style={styles.funnelStageLabel}>{stage.stage}</Text>
                    <Text style={styles.funnelStageCount}>{stage.count}</Text>
                  </View>
                  <View style={styles.funnelBarBg}>
                    <View
                      style={[
                        styles.funnelBarFill,
                        {
                          width: `${Math.max(maxWidth, 2)}%`,
                          backgroundColor: stage.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
            <View style={styles.conversionSummary}>
              <Text style={styles.conversionLabel}>Conversion Rate</Text>
              <Text style={styles.conversionValue}>
                {data?.conversionRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Demographics Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Demographics</Text>
          <View style={styles.card}>
            <View style={styles.demographicRow}>
              <Text style={styles.demographicLabel}>Total Customers</Text>
              <Text style={styles.demographicValue}>
                {data?.totalOrders ?? 0}
              </Text>
            </View>
            <View style={styles.demographicRow}>
              <Text style={styles.demographicLabel}>Repeat Customers</Text>
              <Text style={styles.demographicValue}>—</Text>
            </View>
            <View style={styles.demographicRow}>
              <Text style={styles.demographicLabel}>Top Region</Text>
              <Text style={styles.demographicValue}>—</Text>
            </View>
            <Text style={styles.demographicNote}>
              Detailed demographics coming soon with enhanced tracking
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  sectionTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    marginBottom: theme.Spacing.md,
  },
  kpiGrid: {
    gap: theme.Spacing.sm,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    gap: theme.Spacing.md,
  },
  kpiInfo: {
    flex: 1,
  },
  kpiValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  kpiLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginTop: 2,
  },
  chartCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    height: 180,
    gap: 6,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    color: theme.Colors.textTertiary,
    fontSize: 9,
    marginBottom: 4,
  },
  chartBarTrack: {
    width: '80%',
    height: '70%',
    backgroundColor: theme.Colors.surfaceBorder,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: theme.Colors.primary,
  },
  chartBarLabel: {
    color: theme.Colors.textTertiary,
    fontSize: 9,
    marginTop: 6,
  },
  card: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
  },
  emptyText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
    textAlign: 'center',
    paddingVertical: theme.Spacing.lg,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRankText: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.sm,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginLeft: theme.Spacing.md,
  },
  productName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  productSold: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
  },
  productRevenue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  funnelStage: {
    marginBottom: theme.Spacing.md,
  },
  funnelLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  funnelStageLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  funnelStageCount: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  funnelBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.surfaceBorder,
    overflow: 'hidden',
  },
  funnelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  conversionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.Spacing.md,
    paddingTop: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.surfaceBorder,
  },
  conversionLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.md,
    fontWeight: '500',
  },
  conversionValue: {
    color: theme.Colors.success,
    fontSize: theme.FontSize.xxl,
    fontWeight: '800',
  },
  demographicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  demographicLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  demographicValue: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  demographicNote: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    textAlign: 'center',
    marginTop: theme.Spacing.md,
    fontStyle: 'italic',
  },
});

export default CrmAnalyticsScreen;
