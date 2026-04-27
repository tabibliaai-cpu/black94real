import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import theme from '../theme';

interface Ad {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  ctr: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  createdAt: string;
}

const AdsManagerScreen: React.FC = () => {
  const uid = auth().currentUser?.uid ?? '';
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAds = useCallback(async () => {
    try {
      const snap = await firestore()
        .collection('ads')
        .where('businessId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const adsData = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title ?? '',
          description: d.description ?? '',
          mediaUrl: d.mediaUrl ?? '',
          budget: d.budget ?? 0,
          spent: d.spent ?? 0,
          clicks: d.clicks ?? 0,
          impressions: d.impressions ?? 0,
          ctr: d.impressions > 0 ? ((d.clicks ?? 0) / d.impressions) * 100 : 0,
          status: d.status ?? 'draft',
          createdAt: d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      });
      setAds(adsData);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const totalSpent = ads.reduce((s, a) => s + a.spent, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const activeAds = ads.filter((a) => a.status === 'active').length;

  const handleToggleStatus = async (ad: Ad) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      await firestore().collection('ads').doc(ad.id).update({
        status: newStatus,
      });
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, status: newStatus } : a)),
      );
    } catch {
      // silent
    }
  };

  const statusStyle = (status: Ad['status']) => {
    switch (status) {
      case 'active':
        return { bg: theme.Colors.success + '20', color: theme.Colors.success, label: 'Active' };
      case 'paused':
        return { bg: theme.Colors.warning + '20', color: theme.Colors.warning, label: 'Paused' };
      case 'completed':
        return { bg: theme.Colors.info + '20', color: theme.Colors.info, label: 'Completed' };
      default:
        return { bg: theme.Colors.white10, color: theme.Colors.textTertiary, label: 'Draft' };
    }
  };

  const renderStatCard = (label: string, value: string, icon: string, color: string) => (
    <View style={styles.statCard} key={label}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderAd = ({ item }: { item: Ad }) => {
    const s = statusStyle(item.status);
    const budgetUsed = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;

    return (
      <View style={styles.adCard}>
        <View style={styles.adHeader}>
          <View style={styles.adTitleRow}>
            <Text style={styles.adTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
              <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
            </View>
          </View>
          {item.description ? (
            <Text style={styles.adDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.adStats}>
          <View style={styles.adStat}>
            <Text style={styles.adStatLabel}>Budget</Text>
            <Text style={styles.adStatValue}>₹{item.budget.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.adStat}>
            <Text style={styles.adStatLabel}>Spent</Text>
            <Text style={styles.adStatValue}>₹{item.spent.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.adStat}>
            <Text style={styles.adStatLabel}>Clicks</Text>
            <Text style={styles.adStatValue}>{item.clicks}</Text>
          </View>
          <View style={styles.adStat}>
            <Text style={styles.adStatLabel}>Impressions</Text>
            <Text style={styles.adStatValue}>{item.impressions.toLocaleString()}</Text>
          </View>
          <View style={styles.adStat}>
            <Text style={styles.adStatLabel}>CTR</Text>
            <Text style={styles.adStatValue}>{item.ctr.toFixed(2)}%</Text>
          </View>
        </View>

        {/* Budget progress */}
        <View style={styles.budgetProgress}>
          <View style={styles.budgetProgressBg}>
            <View
              style={[
                styles.budgetProgressFill,
                {
                  width: `${Math.min(budgetUsed, 100)}%`,
                  backgroundColor: budgetUsed > 80 ? theme.Colors.danger : theme.Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.budgetProgressText}>
            {budgetUsed.toFixed(0)}% of budget used
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.adActions}>
          <TouchableOpacity
            style={styles.adActionBtn}
            onPress={() => handleToggleStatus(item)}>
            <Icon
              name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={18}
              color={theme.Colors.primary}
            />
            <Text style={styles.adActionText}>
              {item.status === 'active' ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Ads Manager</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateAd')}>
          <Icon name="add" size={18} color={theme.Colors.black} />
          <Text style={styles.createBtnText}>Create Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        {renderStatCard('Active Ads', activeAds.toString(), 'megaphone-outline', theme.Colors.primary)}
        {renderStatCard('Total Spent', `₹${totalSpent.toLocaleString('en-IN')}`, 'wallet-outline', theme.Colors.warning)}
        {renderStatCard('Total Clicks', totalClicks.toLocaleString(), 'cursor-outline', theme.Colors.success)}
        {renderStatCard('Impressions', totalImpressions.toLocaleString(), 'eye-outline', theme.Colors.info)}
      </View>

      {/* Ads List */}
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={renderAd}
        contentContainerStyle={styles.adsList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="megaphone-outline" size={48} color={theme.Colors.white20} />
            <Text style={styles.emptyTitle}>No ads yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first ad to reach more customers
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAds();
            }}
            tintColor={theme.Colors.primary}
          />
        }
      />
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createBtnText: {
    color: theme.Colors.black,
    fontSize: theme.FontSize.sm,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.Spacing.lg,
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
    width: '47%',
    gap: theme.Spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  adsList: {
    paddingHorizontal: theme.Spacing.lg,
    paddingBottom: 40,
  },
  separator: {
    height: 12,
  },
  adCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  adHeader: {
    gap: 4,
  },
  adTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
    flex: 1,
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
  adDescription: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  adStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.xs,
  },
  adStat: {
    flex: 1,
    minWidth: '30%',
  },
  adStatLabel: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  adStatValue: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  budgetProgress: {
    gap: 4,
  },
  budgetProgressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.Colors.surfaceBorder,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetProgressText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  adActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.Spacing.xs,
  },
  adActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: theme.Colors.surfaceLight,
  },
  adActionText: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.xs,
    fontWeight: '500',
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
});

export default AdsManagerScreen;
