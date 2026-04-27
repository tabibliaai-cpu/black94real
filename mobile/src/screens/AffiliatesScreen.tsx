/**
 * AffiliatesScreen.tsx — Affiliate dashboard
 *
 * Shows referral link, stats, leaderboard, referrals list, payout history.
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/app';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Types ──────────────────────────────────────────────────────────────────

interface Referral {
  id: string;
  name: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

interface Payout {
  id: string;
  date: string;
  amount: number;
  method: string;
}

// ── Placeholder data ──────────────────────────────────────────────────────

const PLACEHOLDER_STATS = {
  totalEarnings: 24500,
  totalClicks: 3240,
  conversions: 156,
  conversionRate: 4.8,
};

const PLACEHOLDER_LEADERBOARD = [
  { rank: 1, name: 'Rahul Sharma', earnings: 89000 },
  { rank: 2, name: 'Priya Patel', earnings: 72000 },
  { rank: 3, name: 'Amit Kumar', earnings: 54000 },
  { rank: 4, name: 'Neha Singh', earnings: 38000 },
  { rank: 5, name: 'Vikram Joshi', earnings: 28500 },
];

const PLACEHOLDER_REFERRALS: Referral[] = [
  { id: '1', name: 'Arjun M.', joinDate: '2025-01-20', status: 'active' },
  { id: '2', name: 'Sneha K.', joinDate: '2025-01-15', status: 'active' },
  { id: '3', name: 'Ravi P.', joinDate: '2024-12-28', status: 'active' },
  { id: '4', name: 'Divya S.', joinDate: '2024-12-10', status: 'inactive' },
  { id: '5', name: 'Karan T.', joinDate: '2024-11-22', status: 'active' },
];

const PLACEHOLDER_PAYOUTS: Payout[] = [
  { id: '1', date: '2025-01-15', amount: 12000, method: 'Bank Transfer' },
  { id: '2', date: '2024-12-15', amount: 8500, method: 'Bank Transfer' },
  { id: '3', date: '2024-11-15', amount: 4000, method: 'UPI' },
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

// ── Component ──────────────────────────────────────────────────────────────

export default function AffiliatesScreen() {
  const user = useAppStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = `https://black94.app/ref/${user?.username ?? 'user'}`;

  const loadData = useCallback(async () => {
    try {
      // Placeholder — replace with Firestore fetch
    } catch (err) {
      console.error('[AffiliatesScreen] loadData error:', err);
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

  const handleCopyLink = useCallback(async () => {
    try {
      const { Share } = require('react-native-share');
      await Share.open({
        title: 'Join Black94!',
        message: `Join Black94 using my referral link: ${referralLink}`,
        url: referralLink,
      });
    } catch {
      // Fallback: copy to clipboard
      const { Clipboard } = require('react-native');
      Clipboard.setString(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralLink]);

  const statCards = [
    { label: 'Total Earnings', value: formatINR(PLACEHOLDER_STATS.totalEarnings), icon: 'wallet' },
    { label: 'Total Clicks', value: PLACEHOLDER_STATS.totalClicks.toLocaleString(), icon: 'cursor' },
    { label: 'Conversions', value: PLACEHOLDER_STATS.conversions.toString(), icon: 'people' },
    { label: 'Conv. Rate', value: `${PLACEHOLDER_STATS.conversionRate}%`, icon: 'trending-up' },
  ];

  const renderReferralItem = ({ item }: { item: Referral }) => (
    <View style={styles.referralItem}>
      <View style={styles.referralAvatar}>
        <Text style={styles.referralAvatarInitial}>
          {item.name[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.referralInfo}>
        <Text style={styles.referralName}>{item.name}</Text>
        <Text style={styles.referralDate}>
          Joined {new Date(item.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View
        style={[
          styles.referralStatusBadge,
          {
            backgroundColor: item.status === 'active'
              ? 'rgba(34, 197, 94, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
          },
        ]}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: item.status === 'active' ? colors.success : colors.error,
          }}>
          {item.status}
        </Text>
      </View>
    </View>
  );

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
        data={PLACEHOLDER_REFERRALS}
        renderItem={renderReferralItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Referral link card */}
            <View style={styles.linkCard}>
              <Text style={styles.linkCardTitle}>Your Referral Link</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {referralLink}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyLink}
                  style={styles.copyBtn}>
                  <Icon name={copied ? 'checkmark' : 'copy'} size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.shareLinkBtn}
                onPress={handleCopyLink}
                activeOpacity={0.7}>
                <Icon name="share-social" size={20} color={colors.white} />
                <Text style={styles.shareLinkText}>Share Link</Text>
              </TouchableOpacity>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {statCards.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Icon name={stat.icon as any} size={18} color={colors.primary} style={{ marginBottom: 6 }} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Leaderboard */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top Affiliates</Text>
              {PLACEHOLDER_LEADERBOARD.map((entry) => (
                <View key={entry.rank} style={styles.leaderItem}>
                  <View
                    style={[
                      styles.rankBadge,
                      entry.rank === 1 && styles.rankBadgeGold,
                      entry.rank === 2 && styles.rankBadgeSilver,
                      entry.rank === 3 && styles.rankBadgeBronze,
                    ]}>
                    <Text style={styles.rankText}>#{entry.rank}</Text>
                  </View>
                  <Text style={styles.leaderName}>{entry.name}</Text>
                  <Text style={styles.leaderEarnings}>
                    {formatINR(entry.earnings)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Referrals header */}
            <Text style={styles.listTitle}>Your Referrals</Text>
          </>
        }
        ListFooterComponent={
          <>
            {/* Payout history */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Payout History</Text>
              {PLACEHOLDER_PAYOUTS.map((payout) => (
                <View key={payout.id} style={styles.payoutItem}>
                  <View style={styles.payoutInfo}>
                    <Text style={styles.payoutAmount}>
                      {formatINR(payout.amount)}
                    </Text>
                    <Text style={styles.payoutMethod}>{payout.method}</Text>
                  </View>
                  <Text style={styles.payoutDate}>
                    {new Date(payout.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              ))}
              {PLACEHOLDER_PAYOUTS.length === 0 && (
                <Text style={styles.emptySmallText}>No payouts yet</Text>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No referrals yet</Text>
            <Text style={styles.emptySubtitle}>
              Share your referral link to start earning!
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
    paddingBottom: 40,
  },
  // Link card
  linkCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  linkCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  shareLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  shareLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // Section card
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  // Leaderboard
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeGold: { backgroundColor: 'rgba(251, 191, 36, 0.2)' },
  rankBadgeSilver: { backgroundColor: 'rgba(156, 163, 175, 0.2)' },
  rankBadgeBronze: { backgroundColor: 'rgba(217, 119, 6, 0.2)' },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  leaderEarnings: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  // List title
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  // Referral item
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  referralInfo: {
    flex: 1,
    marginRight: 8,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  referralDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  referralStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  // Payout item
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  payoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
  payoutMethod: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  payoutDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptySmallText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
});
