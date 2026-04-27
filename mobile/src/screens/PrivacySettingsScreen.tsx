import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import {
  getUser,
  updateUser,
  fetchBlockedUsers,
  unblockUser,
  Black94User,
} from '../lib/db';
import { Colors, Spacing, BorderRadius } from '../theme';

type RootStackParamList = {
  PrivacySettings: undefined;
  Settings: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PrivacySettings'>;
};

type NameVisibility = 'public' | 'followers' | 'private';
type DmPermission = 'all' | 'followers' | 'paid';
type SearchVisibility = 'both' | 'username' | 'profileName' | 'hidden';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  profileImage: string;
}

const NAME_VISIBILITY_OPTIONS: { key: NameVisibility; label: string }[] = [
  { key: 'public', label: 'Everyone' },
  { key: 'followers', label: 'Followers Only' },
  { key: 'private', label: 'No One' },
];

const DM_PERMISSION_OPTIONS: { key: DmPermission; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'followers', label: 'Followers Only' },
  { key: 'paid', label: 'No One' },
];

const SEARCH_VISIBILITY_OPTIONS: { key: SearchVisibility; label: string }[] = [
  { key: 'both', label: 'Both' },
  { key: 'username', label: 'Username Only' },
  { key: 'profileName', label: 'Profile Name Only' },
  { key: 'hidden', label: 'Hidden' },
];

const mapDmPermission = (val: string): DmPermission => {
  if (val === 'followers') return 'followers';
  if (val === 'paid') return 'paid';
  return 'all';
};

const PrivacySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const currentUid = auth().currentUser?.uid ?? '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nameVisibility, setNameVisibility] = useState<NameVisibility>('public');
  const [dmPermission, setDmPermission] = useState<DmPermission>('all');
  const [searchVisibility, setSearchVisibility] = useState<SearchVisibility>('both');
  const [paidChatEnabled, setPaidChatEnabled] = useState(false);
  const [paidChatPrice, setPaidChatPrice] = useState('99');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, nameVisibility, dmPermission, searchVisibility, paidChatEnabled, paidChatPrice]);

  useEffect(() => {
    loadData();
  }, [currentUid]);

  const loadData = useCallback(async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      const [userData, blockedIds] = await Promise.all([
        getUser(currentUid),
        fetchBlockedUsers(currentUid),
      ]);

      if (userData) {
        setNameVisibility(
          userData.nameVisibility === 'private'
            ? 'private'
            : userData.nameVisibility === 'followers'
              ? 'followers'
              : 'public',
        );
        setDmPermission(mapDmPermission(userData.dmPermission));
        setPaidChatEnabled(userData.paidChatEnabled);
        setPaidChatPrice(userData.paidChatPrice?.toString() ?? '99');
      }

      // Fetch blocked user profiles
      if (blockedIds.length > 0) {
        const profiles = await Promise.all(
          blockedIds.map(async (id) => {
            const u = await getUser(id);
            if (!u) return null;
            return {
              id: u.uid,
              username: u.username,
              displayName: u.displayName,
              profileImage: u.profileImage,
            };
          }),
        );
        setBlockedUsers(profiles.filter(Boolean) as BlockedUser[]);
      }
    } catch (e) {
      console.warn('[PrivacySettingsScreen] load error:', e);
    }
    setLoading(false);
  }, [currentUid]);

  const handleSave = useCallback(async () => {
    if (!currentUid) return;
    setSaving(true);
    try {
      const price = parseInt(paidChatPrice, 10);
      if (paidChatEnabled && (isNaN(price) || price <= 0)) {
        Alert.alert('Error', 'Please enter a valid paid chat price');
        setSaving(false);
        return;
      }
      await updateUser(currentUid, {
        nameVisibility,
        dmPermission,
        searchVisibility: searchVisibility === 'hidden' ? 'private' : searchVisibility === 'both' ? 'public' : 'public',
        paidChatEnabled,
        paidChatPrice: paidChatEnabled ? price : 0,
      });
      Alert.alert('Success', 'Privacy settings updated');
      navigation.navigate('Settings');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update settings');
    }
    setSaving(false);
  }, [currentUid, nameVisibility, dmPermission, searchVisibility, paidChatEnabled, paidChatPrice, navigation]);

  const handleUnblock = useCallback(
    async (blockedId: string) => {
      setUnblockingId(blockedId);
      try {
        await unblockUser(currentUid, blockedId);
        setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
      } catch (e) {
        Alert.alert('Error', 'Failed to unblock user');
      }
      setUnblockingId(null);
    },
    [currentUid],
  );

  const renderRadioGroup = (
    title: string,
    options: { key: string; label: string }[],
    value: string,
    onSelect: (key: string) => void,
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.radioGroup}>
        {options.map((opt) => {
          const isSelected = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.radioItem, isSelected && styles.radioItemSelected]}
              onPress={() => onSelect(opt.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Visibility */}
          {renderRadioGroup('Name Visibility', NAME_VISIBILITY_OPTIONS, nameVisibility, (v) =>
            setNameVisibility(v as NameVisibility),
          )}

          {/* DM Permission */}
          {renderRadioGroup('DM Permission', DM_PERMISSION_OPTIONS, dmPermission, (v) =>
            setDmPermission(v as DmPermission),
          )}

          {/* Search Visibility */}
          {renderRadioGroup('Search Visibility', SEARCH_VISIBILITY_OPTIONS, searchVisibility, (v) =>
            setSearchVisibility(v as SearchVisibility),
          )}

          {/* Paid Chat */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Paid Chat</Text>
              <Switch
                value={paidChatEnabled}
                onValueChange={setPaidChatEnabled}
                trackColor={{
                  false: Colors.surfaceBorder,
                  true: Colors.primary,
                }}
                thumbColor={Colors.white}
              />
            </View>
            {paidChatEnabled && (
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  value={paidChatPrice}
                  onChangeText={setPaidChatPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={6}
                />
                <Text style={styles.pricePerChat}>per chat</Text>
              </View>
            )}
            <Text style={styles.sectionDescription}>
              Enable paid chat to charge users for messaging you
            </Text>
          </View>

          {/* Blocked Users */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blocked Users</Text>
            {blockedUsers.length === 0 ? (
              <View style={styles.emptyBlocked}>
                <Text style={styles.emptyBlockedText}>No blocked users</Text>
              </View>
            ) : (
              <View style={styles.blockedList}>
                {blockedUsers.map((u) => (
                  <View key={u.id} style={styles.blockedItem}>
                    <View style={styles.blockedUserInfo}>
                      <View style={styles.blockedAvatar}>
                        <Text style={styles.blockedAvatarText}>
                          {u.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.blockedName}>{u.displayName}</Text>
                        <Text style={styles.blockedUsername}>@{u.username}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(u.id)}
                      disabled={unblockingId === u.id}
                      style={styles.unblockButton}
                      activeOpacity={0.7}
                    >
                      {unblockingId === u.id ? (
                        <ActivityIndicator size="small" color={Colors.danger} />
                      ) : (
                        <Text style={styles.unblockText}>Unblock</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  radioGroup: {
    gap: Spacing.sm,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  radioItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  radioLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  currencySymbol: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  pricePerChat: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  emptyBlocked: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyBlockedText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  blockedList: {
    gap: Spacing.sm,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  blockedAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  blockedName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  blockedUsername: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  unblockButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  unblockText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
});

export default PrivacySettingsScreen;
