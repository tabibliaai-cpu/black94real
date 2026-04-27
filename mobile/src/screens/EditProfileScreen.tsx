import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  getUser,
  updateUser,
  updateUsername,
  checkUsernameAvailability,
  uploadImage,
  Black94User,
} from '../lib/db';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';

type RootStackParamList = {
  EditProfile: undefined;
  Profile: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

type Role = 'personal' | 'creator' | 'professional' | 'business';

const ROLE_OPTIONS: { key: Role; label: string; description: string }[] = [
  { key: 'personal', label: 'Personal', description: 'For personal use' },
  { key: 'creator', label: 'Creator', description: 'Content creators & influencers' },
  { key: 'professional', label: 'Professional', description: 'Professional accounts' },
  { key: 'business', label: 'Business', description: 'For businesses & brands' },
];

const BIO_MAX_LENGTH = 160;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const currentUid = auth().currentUser?.uid ?? '';

  const [user, setUser] = useState<Black94User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [role, setRole] = useState<Role>('personal');
  const [saving, setSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

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
  }, [navigation, saving, displayName, username, bio, profileImage, coverImage, role]);

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUid) return;
      const userData = await getUser(currentUid);
      if (userData) {
        setUser(userData);
        setDisplayName(userData.displayName);
        setUsername(userData.username);
        setBio(userData.bio);
        setProfileImage(userData.profileImage);
        setCoverImage(userData.coverImage);
        setRole(userData.role);
      }
    };
    loadUser();
  }, [currentUid]);

  const checkUsername = useCallback(
    async (value: string) => {
      setUsername(value);
      if (!value || value === user?.username) {
        setUsernameAvailable(null);
        return;
      }
      if (!USERNAME_REGEX.test(value)) {
        setUsernameAvailable(false);
        return;
      }
      setUsernameChecking(true);
      try {
        const available = await checkUsernameAvailability(value, currentUid);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(false);
      }
      setUsernameChecking(false);
    },
    [user?.username, currentUid],
  );

  const pickImage = useCallback(
    async (type: 'profile' | 'cover') => {
      try {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1080,
          maxHeight: 1080,
        });
        if (result.assets && result.assets.length > 0) {
          const uri = result.assets[0].uri ?? '';
          if (type === 'profile') {
            setProfileImage(uri);
          } else {
            setCoverImage(uri);
          }
        }
      } catch (e) {
        console.warn('[EditProfileScreen] image picker error:', e);
      }
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!currentUid) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }
    if (username !== user?.username) {
      if (!USERNAME_REGEX.test(username)) {
        Alert.alert('Error', 'Username must be 3-20 characters (letters, numbers, underscores)');
        return;
      }
      if (!usernameAvailable) {
        Alert.alert('Error', 'This username is not available');
        return;
      }
    }
    if (role === 'business' && user?.role !== 'business') {
      Alert.alert(
        'Warning',
        'Once you switch to Business account, you cannot change back. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: () => performSave() },
        ],
      );
      return;
    }

    performSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUid, displayName, username, bio, profileImage, coverImage, role, user, usernameAvailable]);

  const performSave = useCallback(async () => {
    if (!currentUid) return;
    setSaving(true);
    try {
      let finalProfileImage = profileImage;
      let finalCoverImage = coverImage;

      // Upload images if they are local URIs
      if (profileImage && !profileImage.startsWith('http')) {
        finalProfileImage = await uploadImage(
          profileImage,
          `users/${currentUid}/profile/${Date.now()}.jpg`,
        );
      }
      if (coverImage && !coverImage.startsWith('http')) {
        finalCoverImage = await uploadImage(
          coverImage,
          `users/${currentUid}/cover/${Date.now()}.jpg`,
        );
      }

      // Update username if changed
      if (username !== user?.username) {
        await updateUsername(currentUid, username);
      }

      // Update user profile
      await updateUser(currentUid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        profileImage: finalProfileImage,
        coverImage: finalCoverImage,
        role,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Profile') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    }
    setSaving(false);
  }, [currentUid, displayName, username, bio, profileImage, coverImage, role, user, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={() => pickImage('profile')} activeOpacity={0.8}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : { uri: 'https://via.placeholder.com/200/333/ccc?text=A' }
                }
                style={styles.avatarImage}
              />
              <View style={styles.avatarEditOverlay}>
                <Text style={styles.avatarEditText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Profile Photo</Text>
          </View>

          {/* Cover Image */}
          <View style={styles.coverSection}>
            <TouchableOpacity
              style={styles.coverPicker}
              onPress={() => pickImage('cover')}
              activeOpacity={0.8}
            >
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.coverPlaceholderText}>+ Add Cover Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={Colors.textTertiary}
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          {/* Username */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.usernameInputContainer}>
              <Text style={styles.usernamePrefix}>@</Text>
              <TextInput
                style={[styles.textInput, styles.usernameInput]}
                value={username}
                onChangeText={checkUsername}
                placeholder="username"
                placeholderTextColor={Colors.textTertiary}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {usernameChecking && (
                <ActivityIndicator size="small" color={Colors.textTertiary} style={styles.usernameCheck} />
              )}
              {!usernameChecking && usernameAvailable === true && (
                <Text style={styles.availableText}>✓</Text>
              )}
              {!usernameChecking && usernameAvailable === false && (
                <Text style={styles.takenText}>✗</Text>
              )}
            </View>
            {usernameAvailable === false && (
              <Text style={styles.errorText}>This username is taken or invalid</Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.fieldSection}>
            <View style={styles.bioLabelRow}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <Text style={styles.bioCount}>{bio.length}/{BIO_MAX_LENGTH}</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, BIO_MAX_LENGTH))}
              placeholder="Tell us about yourself"
              placeholderTextColor={Colors.textTertiary}
              maxLength={BIO_MAX_LENGTH}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Role Selector */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Account Type</Text>
            <Text style={styles.roleDescription}>Choose your account type</Text>
            <View style={styles.roleList}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = role === opt.key;
                const isDisabled = user?.role === 'business' && opt.key !== 'business';

                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.roleItem,
                      isSelected && styles.roleItemSelected,
                      isDisabled && styles.roleItemDisabled,
                    ]}
                    onPress={() => !isDisabled && setRole(opt.key)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    disabled={isDisabled}
                  >
                    <View style={[styles.roleRadio, isSelected && styles.roleRadioSelected]}>
                      {isSelected && <View style={styles.roleRadioInner} />}
                    </View>
                    <View style={styles.roleTextContainer}>
                      <Text
                        style={[
                          styles.roleName,
                          isSelected && styles.roleNameSelected,
                          isDisabled && styles.roleNameDisabled,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.roleDesc}>{opt.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {user?.role === 'business' && (
              <Text style={styles.businessWarning}>
                ⚠️ Business accounts cannot be changed to other types
              </Text>
            )}
          </View>

          {/* Badge Display */}
          {user?.badge && (
            <View style={styles.badgeSection}>
              <Text style={styles.fieldLabel}>Current Badge</Text>
              <View style={[styles.badgeDisplay, user.badge === 'gold' ? styles.badgeGold : styles.badgeBlue]}>
                <Text style={styles.badgeEmoji}>{user.badge === 'gold' ? '★' : '●'}</Text>
                <Text style={styles.badgeText}>
                  {user.badge === 'gold' ? 'Gold Verified' : 'Blue Verified'}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  avatarEditText: {
    fontSize: 14,
  },
  avatarLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  coverSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  coverPicker: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 120,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  fieldSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  usernamePrefix: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: Spacing.md,
  },
  usernameCheck: {
    marginRight: 8,
  },
  availableText: {
    fontSize: 16,
    color: Colors.success,
    marginRight: 8,
  },
  takenText: {
    fontSize: 16,
    color: Colors.danger,
    marginRight: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  bioLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  roleDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  roleList: {
    gap: Spacing.sm,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roleItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  roleItemDisabled: {
    opacity: 0.5,
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleRadioSelected: {
    borderColor: Colors.primary,
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roleNameSelected: {
    color: Colors.primary,
  },
  roleNameDisabled: {
    color: Colors.textTertiary,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  businessWarning: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  badgeSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  badgeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  badgeGold: {
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  badgeBlue: {
    borderWidth: 1,
    borderColor: Colors.badgeBlue,
  },
  badgeEmoji: {
    fontSize: 18,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default EditProfileScreen;
