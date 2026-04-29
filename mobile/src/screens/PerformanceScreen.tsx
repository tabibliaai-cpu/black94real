/**
 * PerformanceScreen.tsx — Creator Performance Dashboard
 *
 * Shows engagement stats, growth metrics, activity heatmap, and top posts.
 * Uses placeholder data for now.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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

interface TopPost {
  id: string;
  caption: string;
  likes: number;
  comments: number;
  engagement: number;
}

// ── Placeholder data ──────────────────────────────────────────────────────

const STATS = {
  totalLikes: 24_580,
  totalComments: 3_240,
  totalShares: 1_890,
  totalViews: 185_000,
};

const ENGAGEMENT_RATE = 6.8;

const GROWTH = {
  followersThisWeek: 234,
  followersThisMonth: 1_020,
};

const TOP_POSTS: TopPost[] = [
  { id: '1', caption: 'The future of AI in India is here...', likes: 3420, comments: 289, engagement: 8.2 },
  { id: '2', caption: '5 productivity hacks for creators...', likes: 2180, comments: 178, engagement: 7.5 },
  { id: '3', caption: 'How I grew my audience from 0 to 50k...', likes: 1850, comments: 312, engagement: 9.1 },
  { id: '4', caption: 'Why every creator needs a personal brand...', likes: 1560, comments: 124, engagement: 6.4 },
  { id: '5', caption: 'Building in public: month 6 update...', likes: 1340, comments: 98, engagement: 5.8 },
];

// Generate a 7x7 heatmap grid (last 7 weeks)
function generateHeatmapData(): number[][] {
  const data: number[][] = [];
  for (let row = 0; row < 7; row++) {
    const week: number[] = [];
    for (let col = 0; col < 7; col++) {
      week.push(Math.random());
    }
    data.push(week);
  }
  return data;
}

const HEATMAP_DATA = generateHeatmapData();

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PerformanceScreen() {
  const user = useAppStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Placeholder — replace with Firestore fetch
    } catch (err) {
      console.error('[PerformanceScreen] loadData error:', err);
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

  const statCards = [
    { label: 'Total Likes', value: formatCount(STATS.totalLikes), icon: 'heart', color: colors.error },
    { label: 'Total Comments', value: formatCount(STATS.totalComments), icon: 'chatbubble', color: colors.primary },
    { label: 'Total Shares', value: formatCount(STATS.totalShares), icon: 'share-social', color: colors.success },
    { label: 'Total Views', value: formatCount(STATS.totalViews), icon: 'eye', color: colors.warning },
  ];

  const getHeatmapOpacity = (val: number) => {
    if (val < 0.2) return 0.1;
    if (val < 0.4) return 0.25;
    if (val < 0.6) return 0.45;
    if (val < 0.8) return 0.65;
    return 0.9;
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* Stats Grid 2x2 */}
        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: `${stat.color}20` }]}>
                <Icon name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Engagement Rate with circular indicator */}
        <View style={styles.engagementCard}>
          <Text style={styles.cardTitle}>Engagement Rate</Text>
          <View style={styles.engagementRow}>
            <View style={styles.circleContainer}>
              {/* Circular progress using SVG-like approach with View */}
              <View style={styles.circleBg}>
                <View
                  style={[
                    styles.circleProgress,
                    {
                      // Using borderWidth rotation trick for circular progress
                      borderBottomColor: colors.primary,
                      borderLeftColor: colors.primary,
                      transform: [{ rotate: `${ENGAGEMENT_RATE * 3.6 - 180}deg` }],
                    },
                  ]}
                />
              </View>
              <View style={styles.circleCenter}>
                <Text style={styles.engagementPercent}>{ENGAGEMENT_RATE}%</Text>
              </View>
            </View>
            <View style={styles.engagementInfo}>
              <Text style={styles.engagementMain}>
                {ENGAGEMENT_RATE >= 5 ? 'Good' : ENGAGEMENT_RATE >= 3 ? 'Average' : 'Low'} Engagement
              </Text>
              <Text style={styles.engagementSub}>
                {ENGAGEMENT_RATE >= 5
                  ? 'Your audience is highly engaged with your content.'
                  : 'Try posting more interactive content to boost engagement.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Growth metrics */}
        <View style={styles.growthCard}>
          <Text style={styles.cardTitle}>Follower Growth</Text>
          <View style={styles.growthRow}>
            <View style={styles.growthItem}>
              <Text style={styles.growthValue}>+{formatCount(GROWTH.followersThisWeek)}</Text>
              <Text style={styles.growthLabel}>This Week</Text>
              <Icon name="trending-up" size={16} color={colors.success} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.growthDivider} />
            <View style={styles.growthItem}>
              <Text style={styles.growthValue}>+{formatCount(GROWTH.followersThisMonth)}</Text>
              <Text style={styles.growthLabel}>This Month</Text>
              <Icon name="trending-up" size={16} color={colors.success} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>

        {/* Activity heatmap */}
        <View style={styles.heatmapCard}>
          <Text style={styles.cardTitle}>Activity Heatmap</Text>
          <Text style={styles.heatmapSubtitle}>Last 7 weeks</Text>
          <View style={styles.heatmapGrid}>
            {/* Day labels */}
            <View style={styles.heatmapLabels}>
              {['M', '', 'W', '', 'F', '', 'S'].map((day, i) => (
                <Text key={i} style={styles.heatmapLabel}>{day}</Text>
              ))}
            </View>
            {/* Heatmap cells */}
            <View style={styles.heatmapCells}>
              {HEATMAP_DATA.map((week, row) => (
                <View key={row} style={styles.heatmapWeekRow}>
                  {week.map((val, col) => (
                    <View
                      key={col}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: `rgba(34, 197, 94, ${getHeatmapOpacity(val)})` },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Less</Text>
            {[0.1, 0.25, 0.45, 0.65, 0.9].map((opacity, i) => (
              <View
                key={i}
                style={[
                  styles.legendCell,
                  { backgroundColor: `rgba(34, 197, 94, ${opacity})` },
                ]}
              />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        {/* Top performing posts */}
        <View style={styles.topPostsCard}>
          <Text style={styles.cardTitle}>Top Performing Posts</Text>
          {TOP_POSTS.map((post, index) => (
            <View key={post.id} style={styles.topPostItem}>
              <View style={styles.topPostRank}>
                <Text style={styles.topPostRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.topPostContent}>
                <Text style={styles.topPostCaption} numberOfLines={2}>
                  {post.caption}
                </Text>
                <View style={styles.topPostStats}>
                  <Icon name="heart" size={14} color={Colors.like} /> <Text style={styles.topPostStat}>{formatCount(post.likes)}</Text>
                  <Icon name="chatbubble-outline" size={14} color={Colors.textMuted} /> <Text style={styles.topPostStat}>{formatCount(post.comments)}</Text>
                </View>
              </View>
              <View style={styles.topPostEngagement}>
                <Text style={styles.topPostEngagementValue}>{post.engagement}%</Text>
                <Text style={styles.topPostEngagementLabel}>engage</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  // Card common
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  // Engagement
  engagementCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  circleContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  circleBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleProgress: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  circleCenter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagementPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  engagementInfo: {
    flex: 1,
  },
  engagementMain: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  engagementSub: {
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  // Growth
  growthCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthItem: {
    flex: 1,
    alignItems: 'center',
  },
  growthDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.separator,
  },
  growthValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 4,
  },
  growthLabel: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Heatmap
  heatmapCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heatmapSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapLabels: {
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginRight: 4,
  },
  heatmapLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    height: 14,
    lineHeight: 14,
  },
  heatmapCells: {
    flex: 1,
    gap: 3,
  },
  heatmapWeekRow: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'space-between',
  },
  heatmapCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 3,
    maxWidth: 32,
    flex: 1,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  legendText: {
    fontSize: 10,
    color: colors.textTertiary,
    marginHorizontal: 2,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  // Top posts
  topPostsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  topPostRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topPostRankText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  topPostContent: {
    flex: 1,
    marginRight: 12,
  },
  topPostCaption: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  topPostStats: {
    flexDirection: 'row',
    gap: 12,
  },
  topPostStat: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  topPostEngagement: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  topPostEngagementValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  topPostEngagementLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
