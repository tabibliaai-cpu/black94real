import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import theme from '../theme';

interface CrmDeal {
  id: string;
  title: string;
  value: number;
  stage: 'initial' | 'negotiation' | 'proposal' | 'closing' | 'won' | 'lost';
  leadId: string;
  leadName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STAGES: Array<{ key: CrmDeal['stage']; label: string; color: string }> = [
  { key: 'initial', label: 'Initial', color: '#e0e0e0' },
  { key: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
  { key: 'proposal', label: 'Proposal', color: '#8b5cf6' },
  { key: 'closing', label: 'Closing', color: '#06b6d4' },
  { key: 'won', label: 'Won', color: '#22c55e' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
];

const CrmDealsScreen: React.FC = () => {
  const uid = auth().currentUser?.uid ?? '';
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedDeal, setSelectedDeal] = useState<CrmDeal | null>(null);

  const loadDeals = useCallback(async () => {
    try {
      const snap = await firestore()
        .collection('deals')
        .where('businessId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const dealsData = snap.docs.map((doc) => {
        const d = doc.data();
        const ts = (v: any) => {
          if (v && typeof v === 'object' && 'seconds' in v) {
            return new Date(v.seconds * 1000).toISOString();
          }
          return typeof v === 'string' ? v : new Date().toISOString();
        };
        return {
          id: doc.id,
          title: d.title ?? '',
          value: d.value ?? 0,
          stage: d.stage ?? 'initial',
          leadId: d.leadId ?? '',
          leadName: d.leadName ?? '',
          notes: d.notes ?? '',
          createdAt: ts(d.createdAt),
          updatedAt: ts(d.updatedAt),
        };
      });
      setDeals(dealsData);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    if (activeStage === 'all') {
      setFilteredDeals(deals);
    } else {
      setFilteredDeals(deals.filter((d) => d.stage === activeStage));
    }
  }, [deals, activeStage]);

  const stageColor = (stage: CrmDeal['stage']) => {
    const s = STAGES.find((s) => s.key === stage);
    return s?.color ?? theme.Colors.textTertiary;
  };

  const pipelineTotal = deals
    .filter((d) => d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0);

  const renderDealCard = (deal: CrmDeal) => (
    <TouchableOpacity
      key={deal.id}
      style={styles.dealCard}
      onPress={() => setSelectedDeal(deal)}>
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle}>{deal.title}</Text>
        <Text style={styles.dealValue}>₹{deal.value.toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.dealMeta}>
        {deal.leadName ? (
          <Text style={styles.dealLead}>
            <Icon name="person-outline" size={12} /> {deal.leadName}
          </Text>
        ) : null}
        <View style={[styles.stageBadge, { backgroundColor: stageColor(deal.stage) + '20' }]}>
          <Text style={[styles.stageText, { color: stageColor(deal.stage) }]}>
            {deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderKanbanColumn = (stage: typeof STAGES[number]) => {
    const stageDeals = deals.filter((d) => d.stage === stage.key);
    return (
      <View key={stage.key} style={styles.kanbanColumn}>
        <View style={styles.kanbanColumnHeader}>
          <View style={[styles.kanbanDot, { backgroundColor: stage.color }]} />
          <Text style={styles.kanbanColumnTitle}>{stage.label}</Text>
          <View style={styles.kanbanCount}>
            <Text style={styles.kanbanCountText}>{stageDeals.length}</Text>
          </View>
        </View>
        {stageDeals.map((deal) => (
          <TouchableOpacity
            key={deal.id}
            style={styles.kanbanCard}
            onPress={() => setSelectedDeal(deal)}>
            <Text style={styles.kanbanCardTitle}>{deal.title}</Text>
            <Text style={styles.kanbanCardValue}>
              ₹{deal.value.toLocaleString('en-IN')}
            </Text>
            {deal.leadName && (
              <Text style={styles.kanbanCardLead}>{deal.leadName}</Text>
            )}
          </TouchableOpacity>
        ))}
        {stageDeals.length === 0 && (
          <Text style={styles.kanbanEmpty}>No deals</Text>
        )}
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
        <Text style={styles.headerTitle}>Deals</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'list' && styles.viewToggleActive]}
            onPress={() => setViewMode('list')}>
            <Icon name="list" size={18} color={viewMode === 'list' ? theme.Colors.primary : theme.Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'kanban' && styles.viewToggleActive]}
            onPress={() => setViewMode('kanban')}>
            <Icon name="grid-outline" size={18} color={viewMode === 'kanban' ? theme.Colors.primary : theme.Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pipeline Total */}
      <View style={styles.pipelineBar}>
        <Text style={styles.pipelineLabel}>Pipeline Value</Text>
        <Text style={styles.pipelineValue}>
          ₹{pipelineTotal.toLocaleString('en-IN')}
        </Text>
      </View>

      {viewMode === 'list' ? (
        <>
          {/* Stage Filter */}
          <View style={styles.filterBar}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ key: 'all', label: 'All', color: theme.Colors.textSecondary }, ...STAGES]}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeStage === item.key && {
                      backgroundColor: item.color + '20',
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => setActiveStage(item.key)}>
                  <Text
                    style={[
                      styles.filterPillText,
                      activeStage === item.key && { color: item.color },
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <FlatList
            data={filteredDeals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderDealCard(item)}
            contentContainerStyle={styles.dealsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="briefcase-outline" size={48} color={theme.Colors.white20} />
                <Text style={styles.emptyTitle}>No deals</Text>
                <Text style={styles.emptySubtitle}>
                  {activeStage === 'all'
                    ? 'Create deals to track your sales pipeline'
                    : `No ${activeStage} deals`}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadDeals(); }}
                tintColor={theme.Colors.primary}
              />
            }
          />
        </>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadDeals(); }}
              tintColor={theme.Colors.primary}
            />
          }>
          {STAGES.map(renderKanbanColumn)}
        </ScrollView>
      )}

      {/* Deal Detail Modal */}
      <Modal
        visible={!!selectedDeal}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDeal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDeal && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Deal Details</Text>
                  <TouchableOpacity onPress={() => setSelectedDeal(null)}>
                    <Icon name="close" size={24} color={theme.Colors.white} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalDealTitle}>{selectedDeal.title}</Text>
                  <Text style={styles.modalDealValue}>
                    ₹{selectedDeal.value.toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>Stage</Text>
                    <View style={[styles.stageBadge, { backgroundColor: stageColor(selectedDeal.stage) + '20' }]}>
                      <Text style={[styles.stageText, { color: stageColor(selectedDeal.stage) }]}>
                        {selectedDeal.stage.charAt(0).toUpperCase() + selectedDeal.stage.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {selectedDeal.leadName && (
                    <View style={styles.modalField}>
                      <Text style={styles.modalFieldLabel}>Lead</Text>
                      <Text style={styles.modalFieldValue}>{selectedDeal.leadName}</Text>
                    </View>
                  )}

                  {selectedDeal.notes && (
                    <View style={styles.modalField}>
                      <Text style={styles.modalFieldLabel}>Notes</Text>
                      <Text style={styles.modalFieldValue}>{selectedDeal.notes}</Text>
                    </View>
                  )}

                  <Text style={[styles.modalFieldLabel, { marginTop: theme.Spacing.xl }]}>
                    Move to Stage
                  </Text>
                  <View style={styles.statusActions}>
                    {STAGES.map((s) => (
                      <TouchableOpacity
                        key={s.key}
                        style={[
                          styles.statusActionBtn,
                          selectedDeal.stage === s.key && {
                            backgroundColor: s.color + '20',
                            borderColor: s.color,
                          },
                        ]}
                        onPress={async () => {
                          try {
                            await firestore().collection('deals').doc(selectedDeal.id).update({
                              stage: s.key,
                              updatedAt: firestore.FieldValue.serverTimestamp(),
                            });
                            setDeals((prev) =>
                              prev.map((d) =>
                                d.id === selectedDeal.id ? { ...d, stage: s.key } : d,
                              ),
                            );
                            setSelectedDeal((prev) => prev ? { ...prev, stage: s.key } : null);
                          } catch {
                            // silent
                          }
                        }}>
                        <Text
                          style={[
                            styles.statusActionText,
                            selectedDeal.stage === s.key && { color: s.color },
                          ]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
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
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
  },
  viewToggleActive: {
    borderColor: theme.Colors.primary,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pipelineBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  pipelineLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  pipelineValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  filterList: {
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.sm,
    gap: theme.Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.BorderRadius.lg,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
  },
  filterPillText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  dealsList: {
    padding: theme.Spacing.lg,
  },
  separator: {
    height: 8,
  },
  dealCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dealTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  dealValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
    marginLeft: theme.Spacing.sm,
  },
  dealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.Spacing.sm,
  },
  dealLead: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.BorderRadius.sm,
  },
  stageText: {
    fontSize: theme.FontSize.xs,
    fontWeight: '600',
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
  kanbanContainer: {
    padding: theme.Spacing.lg,
    gap: theme.Spacing.md,
    paddingBottom: 100,
  },
  kanbanColumn: {
    width: 240,
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.sm,
    gap: theme.Spacing.sm,
  },
  kanbanColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  kanbanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kanbanColumnTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  kanbanCount: {
    backgroundColor: theme.Colors.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  kanbanCountText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
    fontWeight: '600',
  },
  kanbanCard: {
    backgroundColor: theme.Colors.black,
    borderRadius: theme.BorderRadius.sm,
    padding: theme.Spacing.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
  },
  kanbanCardTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
  },
  kanbanCardValue: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.md,
    fontWeight: '700',
    marginTop: 4,
  },
  kanbanCardLead: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 4,
  },
  kanbanEmpty: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    textAlign: 'center',
    paddingVertical: theme.Spacing.lg,
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
    maxHeight: '80%',
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
  modalDealTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.xxl,
    fontWeight: '700',
  },
  modalDealValue: {
    color: theme.Colors.success,
    fontSize: theme.FontSize.xxl,
    fontWeight: '800',
    marginTop: theme.Spacing.xs,
  },
  modalField: {
    marginTop: theme.Spacing.lg,
  },
  modalFieldLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
    marginBottom: theme.Spacing.xs,
  },
  modalFieldValue: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
  },
  statusActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
  },
  statusActionText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
});

export default CrmDealsScreen;
