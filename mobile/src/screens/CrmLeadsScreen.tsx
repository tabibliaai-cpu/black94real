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

interface CrmLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  aiScore: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STATUSES: Array<{ key: CrmLead['status']; label: string; color: string }> = [
  { key: 'all', label: 'All', color: theme.Colors.textSecondary },
  { key: 'new', label: 'New', color: theme.Colors.badgeNew },
  { key: 'contacted', label: 'Contacted', color: theme.Colors.badgeContacted },
  { key: 'qualified', label: 'Qualified', color: theme.Colors.badgeQualified },
  { key: 'converted', label: 'Converted', color: theme.Colors.badgeConverted },
  { key: 'lost', label: 'Lost', color: theme.Colors.badgeLost },
];

const CrmLeadsScreen: React.FC = () => {
  const uid = auth().currentUser?.uid ?? '';
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [leadNote, setLeadNote] = useState('');

  const loadLeads = useCallback(async () => {
    try {
      const snap = await firestore()
        .collection('leads')
        .where('businessId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const leadsData = snap.docs.map((doc) => {
        const d = doc.data();
        const ts = (v: any) => {
          if (v && typeof v === 'object' && 'seconds' in v) {
            return new Date(v.seconds * 1000).toISOString();
          }
          return typeof v === 'string' ? v : new Date().toISOString();
        };
        return {
          id: doc.id,
          name: d.name ?? '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          source: d.source ?? '',
          status: d.status ?? 'new',
          aiScore: d.aiScore ?? 0,
          notes: d.notes ?? '',
          createdAt: ts(d.createdAt),
          updatedAt: ts(d.updatedAt),
        };
      });
      setLeads(leadsData);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (activeStatus === 'all') {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter((l) => l.status === activeStatus));
    }
  }, [leads, activeStatus]);

  const handleUpdateStatus = async (leadId: string, newStatus: CrmLead['status']) => {
    try {
      await firestore().collection('leads').doc(leadId).update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
      );
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      // silent
    }
  };

  const handleSaveNote = async () => {
    if (!selectedLead || !leadNote.trim()) return;
    try {
      await firestore().collection('leads').doc(selectedLead.id).update({
        notes: leadNote.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, notes: leadNote.trim() } : l,
        ),
      );
      setSelectedLead((prev) => prev ? { ...prev, notes: leadNote.trim() } : null);
      setLeadNote('');
    } catch {
      // silent
    }
  };

  const statusColor = (status: CrmLead['status']) => {
    const s = STATUSES.find((s) => s.key === status);
    return s?.color ?? theme.Colors.textTertiary;
  };

  const renderLead = ({ item }: { item: CrmLead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => {
        setSelectedLead(item);
        setLeadNote(item.notes);
      }}>
      <View style={styles.leadHeader}>
        <View style={styles.leadAvatar}>
          <Text style={styles.leadAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadEmail}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.leadMeta}>
        <Text style={styles.leadSource}>
          <Icon name="link-outline" size={12} /> {item.source || 'Direct'}
        </Text>
        {item.phone ? (
          <Text style={styles.leadPhone}>
            <Icon name="call-outline" size={12} /> {item.phone}
          </Text>
        ) : null}
      </View>

      {/* AI Score Bar */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>AI Score</Text>
        <View style={styles.scoreBarBg}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${item.aiScore}%`,
                backgroundColor:
                  item.aiScore >= 70
                    ? theme.Colors.success
                    : item.aiScore >= 40
                      ? theme.Colors.warning
                      : theme.Colors.danger,
              },
            ]}
          />
        </View>
        <Text style={styles.scoreValue}>{item.aiScore}%</Text>
      </View>

      {item.notes ? (
        <Text style={styles.leadNotesPreview} numberOfLines={1}>
          {item.notes}
        </Text>
      ) : null}
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
        <Text style={styles.headerTitle}>CRM Leads</Text>
        <Text style={styles.headerCount}>{leads.length} leads</Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUSES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterPill,
                activeStatus === item.key && {
                  backgroundColor: item.color + '20',
                  borderColor: item.color,
                },
              ]}
              onPress={() => setActiveStatus(item.key)}>
              <Text
                style={[
                  styles.filterPillText,
                  activeStatus === item.key && { color: item.color },
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={renderLead}
        contentContainerStyle={styles.leadsList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={48} color={theme.Colors.white20} />
            <Text style={styles.emptyTitle}>No leads</Text>
            <Text style={styles.emptySubtitle}>
              {activeStatus === 'all'
                ? 'Leads will appear when customers show interest'
                : `No ${activeStatus} leads found`}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadLeads();
            }}
            tintColor={theme.Colors.primary}
          />
        }
      />

      {/* Lead Detail Modal */}
      <Modal
        visible={!!selectedLead}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedLead(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedLead && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Lead Details</Text>
                  <TouchableOpacity onPress={() => setSelectedLead(null)}>
                    <Icon name="close" size={24} color={theme.Colors.white} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedLead.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.modalName}>{selectedLead.name}</Text>
                  <Text style={styles.modalEmail}>{selectedLead.email}</Text>
                  {selectedLead.phone && (
                    <Text style={styles.modalPhone}>{selectedLead.phone}</Text>
                  )}

                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>Source</Text>
                    <Text style={styles.modalFieldValue}>
                      {selectedLead.source || 'Direct'}
                    </Text>
                  </View>

                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(selectedLead.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor(selectedLead.status) }]}>
                        {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>AI Score</Text>
                    <View style={styles.scoreRow}>
                      <View style={[styles.scoreBarBg, { flex: 1 }]}>
                        <View
                          style={[
                            styles.scoreBarFill,
                            {
                              width: `${selectedLead.aiScore}%`,
                              backgroundColor:
                                selectedLead.aiScore >= 70
                                  ? theme.Colors.success
                                  : selectedLead.aiScore >= 40
                                    ? theme.Colors.warning
                                    : theme.Colors.danger,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.scoreValue}>{selectedLead.aiScore}%</Text>
                    </View>
                  </View>

                  {/* Notes */}
                  <Text style={styles.modalFieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={leadNote}
                    onChangeText={setLeadNote}
                    placeholder="Add a note..."
                    placeholderTextColor={theme.Colors.textTertiary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNote}>
                    <Text style={styles.saveNoteBtnText}>Save Note</Text>
                  </TouchableOpacity>

                  {/* Status Actions */}
                  <Text style={[styles.modalFieldLabel, { marginTop: theme.Spacing.xl }]}>
                    Update Status
                  </Text>
                  <View style={styles.statusActions}>
                    {STATUSES.filter((s) => s.key !== 'all').map((s) => (
                      <TouchableOpacity
                        key={s.key}
                        style={[
                          styles.statusActionBtn,
                          selectedLead.status === s.key && {
                            backgroundColor: s.color + '20',
                            borderColor: s.color,
                          },
                        ]}
                        onPress={() => handleUpdateStatus(selectedLead.id, s.key)}>
                        <Text
                          style={[
                            styles.statusActionText,
                            selectedLead.status === s.key && { color: s.color },
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
  headerCount: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
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
  leadsList: {
    padding: theme.Spacing.lg,
  },
  separator: {
    height: 8,
  },
  leadCard: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    padding: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  leadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '600',
  },
  leadEmail: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 2,
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
  leadMeta: {
    flexDirection: 'row',
    gap: theme.Spacing.lg,
    marginLeft: 52,
  },
  leadSource: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
  },
  leadPhone: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginLeft: 52,
  },
  scoreLabel: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    width: 55,
  },
  scoreBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.Colors.surfaceBorder,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.xs,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  leadNotesPreview: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginLeft: 52,
    fontStyle: 'italic',
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
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: theme.Spacing.md,
  },
  modalAvatarText: {
    color: theme.Colors.primary,
    fontSize: theme.FontSize.xxxl,
    fontWeight: '700',
  },
  modalName: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: theme.Spacing.md,
  },
  modalEmail: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    textAlign: 'center',
    marginTop: 4,
  },
  modalPhone: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    textAlign: 'center',
    marginTop: 2,
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
  noteInput: {
    backgroundColor: theme.Colors.black,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.md,
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.sm,
    minHeight: 60,
    marginTop: theme.Spacing.xs,
  },
  saveNoteBtn: {
    alignSelf: 'flex-end',
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: theme.Spacing.sm,
  },
  saveNoteBtnText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.sm,
    fontWeight: '600',
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

export default CrmLeadsScreen;
