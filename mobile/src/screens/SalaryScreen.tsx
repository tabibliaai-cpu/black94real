/**
 * SalaryScreen.tsx — Salary / Income Dashboard
 *
 * Shows earnings, payment history, and payout schedule.
 * Uses placeholder data when no Firestore collection exists.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/app';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Types ──────────────────────────────────────────────────────────────────

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending';
  description: string;
}

// ── Placeholder data ──────────────────────────────────────────────────────

const PLACEHOLDER_PAYMENTS: PaymentRecord[] = [
  { id: '1', date: '2025-01-28', amount: 45000, status: 'Paid', description: 'Monthly salary - January' },
  { id: '2', date: '2025-01-15', amount: 12000, status: 'Paid', description: 'Performance bonus' },
  { id: '3', date: '2024-12-28', amount: 45000, status: 'Paid', description: 'Monthly salary - December' },
  { id: '4', date: '2024-12-10', amount: 8000, status: 'Paid', description: 'Referral bonus' },
  { id: '5', date: '2024-11-28', amount: 45000, status: 'Paid', description: 'Monthly salary - November' },
  { id: '6', date: '2024-11-05', amount: 5000, status: 'Paid', description: 'Content bonus' },
];

const MONTHLY_DATA = [
  { month: 'Aug', amount: 42000 },
  { month: 'Sep', amount: 48000 },
  { month: 'Oct', amount: 51000 },
  { month: 'Nov', amount: 45000 },
  { month: 'Dec', amount: 53000 },
  { month: 'Jan', amount: 57000 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getNextPayoutDate(): string {
  const now = new Date();
  const payoutDay = 28;
  let payout = new Date(now.getFullYear(), now.getMonth(), payoutDay);
  if (payout <= now) {
    payout = new Date(now.getFullYear(), now.getMonth() + 1, payoutDay);
  }
  return payout.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SalaryScreen() {
  const user = useAppStore((s) => s.user);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Placeholder — replace with Firestore fetch when collection exists
      setPayments(PLACEHOLDER_PAYMENTS);
    } catch (err) {
      console.error('[SalaryScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const currentMonthEarnings = 57000;
  const maxBarAmount = Math.max(...MONTHLY_DATA.map((d) => d.amount));

  const renderBarChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Earnings (6 Months)</Text>
      <View style={styles.chartBars}>
        {MONTHLY_DATA.map((item, index) => {
          const barHeight = (item.amount / maxBarAmount) * 120;
          const isCurrentMonth = index === MONTHLY_DATA.length - 1;
          return (
            <View key={item.month} style={styles.chartBarColumn}>
              <Text style={styles.chartBarValue}>
                {(item.amount / 1000).toFixed(0)}k
              </Text>
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(barHeight, 4) },
                  isCurrentMonth && styles.chartBarCurrent,
                ]}
              />
              <Text
                style={[
                  styles.chartBarLabel,
                  isCurrentMonth && styles.chartBarLabelCurrent,
                ]}>
                {item.month}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderPaymentItem = ({ item }: { item: PaymentRecord }) => {
    const isPaid = item.status === 'Paid';
    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentIconBg}>
          <Icon
            name={isPaid ? 'checkmark-circle' : 'time-outline'}
            size={20}
            color={isPaid ? colors.success : colors.warning}
          />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentDescription}>{item.description}</Text>
          <Text style={styles.paymentDate}>
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>{formatINR(item.amount)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' },
            ]}>
            <Text
              style={[
                styles.statusBadgeText,
                { color: isPaid ? colors.success : colors.warning },
              ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Current month earnings card */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>This Month's Earnings</Text>
              <Text style={styles.earningsAmount}>
                {formatINR(currentMonthEarnings)}
              </Text>
              <View style={styles.earningsGrowth}>
                <Icon name="trending-up" size={16} color={colors.success} />
                <Text style={styles.earningsGrowthText}>
                  +12% from last month
                </Text>
              </View>
            </View>

            {/* Bar chart */}
            {renderBarChart()}

            {/* Next payout card */}
            <View style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <Icon name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.payoutTitle}>Next Payout Date</Text>
              </View>
              <Text style={styles.payoutDate}>{getNextPayoutDate()}</Text>
              <Text style={styles.payoutNote}>
                Earnings are credited on the 28th of each month.
              </Text>
            </View>

            {/* Payout schedule */}
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleTitle}>Payout Schedule</Text>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>Payment Cycle</Text>
                <Text style={styles.scheduleValue}>Monthly</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>Payment Method</Text>
                <Text style={styles.scheduleValue}>Bank Transfer (UPI)</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>Minimum Payout</Text>
                <Text style={styles.scheduleValue}>{formatINR(1000)}</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>Processing Time</Text>
                <Text style={styles.scheduleValue}>2-3 Business Days</Text>
              </View>
            </View>

            {/* Payment history header */}
            <Text style={styles.sectionTitle}>Payment History</Text>
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="wallet-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptySubtitle}>
              Your payment history will appear here once you start earning.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  // Earnings card
  earningsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  earningsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  earningsGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsGrowthText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  // Chart
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingHorizontal: 4,
  },
  chartBarColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  chartBarValue: {
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  chartBar: {
    width: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  chartBarCurrent: {
    backgroundColor: colors.primary,
  },
  chartBarLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
  chartBarLabelCurrent: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Payout card
  payoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  payoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  payoutDate: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  payoutNote: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Schedule card
  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  scheduleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scheduleValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  // Payment item
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },
  paymentDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
