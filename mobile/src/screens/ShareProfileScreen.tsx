/**
 * ShareProfileScreen.tsx — Share profile with QR placeholder + social sharing
 *
 * Shows profile card preview, QR placeholder, share buttons, copyable link.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../stores/app';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Helpers ────────────────────────────────────────────────────────────────

function tsToISO(value: unknown): string {
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Date((value as any).seconds * 1000).toISOString();
  }
  return String(value ?? new Date().toISOString());
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ShareProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUser = useAppStore((s) => s.user);

  const [profile, setProfile] = useState<{
    displayName: string;
    username: string;
    bio: string;
    profileImage: string;
    followerCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const profileLink = `https://black94.app/u/${currentUser?.username ?? 'user'}`;

  useEffect(() => {
    // Use current user's data directly, or fetch from Firestore for profile param
    if (currentUser) {
      setProfile({
        displayName: currentUser.displayName ?? currentUser.username,
        username: currentUser.username,
        bio: currentUser.bio ?? '',
        profileImage: currentUser.profileImage,
        followerCount: currentUser.followerCount ?? 0,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profileLink]);

  const handleShare = useCallback(async () => {
    const { name, username, bio } = profile ?? {};
    try {
      const { Share } = require('react-native-share');
      await Share.open({
        title: `Check out ${name ?? username} on Black94!`,
        message: bio
          ? `${bio}\n\nFollow @${username} on Black94: ${profileLink}`
          : `Follow @${username} on Black94: ${profileLink}`,
        url: profileLink,
      });
    } catch {
      handleCopyLink();
    }
  }, [profile, profileLink, handleCopyLink]);

  const handleShareWhatsApp = useCallback(async () => {
    const msg = encodeURIComponent(
      `Check out @${profile?.username ?? 'user'} on Black94! ${profileLink}`,
    );
    try {
      const { Linking } = require('react-native');
      await Linking.openURL(`whatsapp://send?text=${msg}`);
    } catch {
      Alert.alert('Error', 'Could not open WhatsApp.');
    }
  }, [profile, profileLink]);

  const handleShareTwitter = useCallback(async () => {
    const msg = encodeURIComponent(
      `Check out @${profile?.username ?? 'user'} on Black94!`,
    );
    const url = encodeURIComponent(profileLink);
    try {
      const { Linking } = require('react-native');
      await Linking.openURL(`twitter://post?message=${msg}&url=${url}`);
    } catch {
      Alert.alert('Error', 'Could not open Twitter/X.');
    }
  }, [profile, profileLink]);

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
        contentContainerStyle={styles.scrollContent}>
        {/* Profile card preview */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            {profile?.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.profileAvatar}
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(profile?.displayName ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>
                  {profile?.displayName ?? 'User'}
                </Text>
                {currentUser?.isVerified && (
                  <Icon name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </View>
              <Text style={styles.profileUsername}>
                @{profile?.username ?? 'user'}
              </Text>
              {profile?.bio ? (
                <Text style={styles.profileBio} numberOfLines={2}>
                  {profile.bio}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {profile?.followerCount?.toLocaleString() ?? '0'}
              </Text>
              <Text style={styles.profileStatLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {currentUser?.followingCount?.toLocaleString() ?? '0'}
              </Text>
              <Text style={styles.profileStatLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* QR Code placeholder */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>QR Code</Text>
          <View style={styles.qrPlaceholder}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 7 }).map((_, row) => (
                <View key={row} style={styles.qrRow}>
                  {Array.from({ length: 7 }).map((_, col) => (
                    <View
                      key={col}
                      style={[
                        styles.qrCell,
                        {
                          backgroundColor:
                            Math.random() > 0.45
                              ? colors.textPrimary
                              : 'transparent',
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
            <Text style={styles.qrOverlayText}>QR Code</Text>
          </View>
          <Text style={styles.qrNote}>
            Scan this QR code to visit this profile
          </Text>
        </View>

        {/* Profile link */}
        <View style={styles.linkCard}>
          <Text style={styles.linkLabel}>Profile Link</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={handleCopyLink}
            activeOpacity={0.7}>
            <Text style={styles.linkText} numberOfLines={1}>
              {profileLink}
            </Text>
            <Icon
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={copied ? colors.success : colors.primary}
            />
          </TouchableOpacity>
          {copied && (
            <Text style={styles.copiedText}>Link copied!</Text>
          )}
        </View>

        {/* Share buttons row */}
        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={[styles.shareBtn, styles.shareBtnWhatsapp]}
            onPress={handleShareWhatsApp}
            activeOpacity={0.7}>
            <Icon name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.shareBtnLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, styles.shareBtnTwitter]}
            onPress={handleShareTwitter}
            activeOpacity={0.7}>
            <Icon name="logo-twitter" size={24} color="#1DA1F2" />
            <Text style={styles.shareBtnLabel}>X / Twitter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, styles.shareBtnCopy]}
            onPress={handleCopyLink}
            activeOpacity={0.7}>
            <Icon name="link-outline" size={24} color={colors.primary} />
            <Text style={styles.shareBtnLabel}>Copy Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, styles.shareBtnMore]}
            onPress={handleShare}
            activeOpacity={0.7}>
            <Icon name="share-social-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.shareBtnLabel}>More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Share button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.mainShareBtn}
          onPress={handleShare}
          activeOpacity={0.8}>
          <Icon name="share-social" size={22} color={colors.white} />
          <Text style={styles.mainShareText}>Share Profile</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  // Profile card
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  profileAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileUsername: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  profileBio: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileStatLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.separator,
  },
  // QR Code
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  qrGrid: {
    position: 'absolute',
    width: 160,
    height: 160,
    padding: 16,
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 3,
  },
  qrCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  qrOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qrNote: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 10,
  },
  // Link card
  linkCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  copiedText: {
    fontSize: 12,
    color: colors.success,
    marginTop: 6,
    textAlign: 'center',
  },
  // Share buttons
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  shareBtnWhatsapp: {},
  shareBtnTwitter: {},
  shareBtnCopy: {},
  shareBtnMore: {},
  shareBtnLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    paddingBottom: 30,
  },
  mainShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  mainShareText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
