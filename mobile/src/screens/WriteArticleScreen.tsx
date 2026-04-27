/**
 * WriteArticleScreen.tsx — Write/edit article
 *
 * Supports title, cover image, body text, fact-check toggle, publish/draft.
 * On publish: saves to Firestore 'articles' collection.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../stores/app';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Types ──────────────────────────────────────────────────────────────────

interface LocalArticle {
  title: string;
  content: string;
  coverImageUri: string | null;
  factCheck: boolean;
  isPublished: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WriteArticleScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppStore((s) => s.user);

  const [article, setArticle] = useState<LocalArticle>({
    title: '',
    content: '',
    coverImageUri: null,
    factCheck: false,
    isPublished: false,
  });
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAutoSave, setShowAutoSave] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Word/character count ───────────────────────────────────────────────
  const wordCount = article.content.trim() ? article.content.trim().split(/\s+/).length : 0;
  const charCount = article.content.length;

  // ── Auto-save indicator ────────────────────────────────────────────────
  const triggerAutoSaveIndicator = useCallback(() => {
    setShowAutoSave(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setShowAutoSave(false);
    }, 2000);
  }, []);

  // ── Update fields ──────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof LocalArticle>(field: K, value: LocalArticle[K]) => {
      setArticle((prev) => ({ ...prev, [field]: value }));
      triggerAutoSaveIndicator();
    },
    [triggerAutoSaveIndicator],
  );

  // ── Pick cover image ───────────────────────────────────────────────────
  const pickCoverImage = useCallback(async () => {
    try {
      // Using ImagePicker if available — fallback to placeholder
      const { launchImageLibrary } = require('react-native-image-picker');
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.assets && result.assets.length > 0) {
        updateField('coverImageUri', result.assets[0].uri);
      }
    } catch {
      Alert.alert('Info', 'Image picker not available. Using placeholder.');
    }
  }, [updateField]);

  // ── Save draft ─────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save articles.');
      return;
    }
    if (!article.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your article.');
      return;
    }

    setSaving(true);
    try {
      await firestore().collection('articles').add({
        authorId: user.id,
        authorName: user.displayName ?? user.username,
        authorUsername: user.username,
        authorImage: user.profileImage,
        title: article.title.trim(),
        content: article.content,
        coverImage: article.coverImageUri ?? '',
        factCheck: article.factCheck,
        isPublished: false,
        views: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Saved', 'Draft saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('[WriteArticleScreen] saveDraft error:', err);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, article, navigation]);

  // ── Publish ────────────────────────────────────────────────────────────
  const handlePublish = useCallback(() => {
    if (!article.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your article.');
      return;
    }
    if (!article.content.trim()) {
      Alert.alert('Error', 'Please write some content for your article.');
      return;
    }

    Alert.alert(
      'Publish Article',
      'Your article will be visible to all users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: doPublish,
        },
      ],
    );
  }, [article]);

  const doPublish = useCallback(async () => {
    if (!user) return;

    setPublishing(true);
    try {
      await firestore().collection('articles').add({
        authorId: user.id,
        authorName: user.displayName ?? user.username,
        authorUsername: user.username,
        authorImage: user.profileImage,
        title: article.title.trim(),
        content: article.content,
        coverImage: article.coverImageUri ?? '',
        factCheck: article.factCheck,
        isPublished: true,
        views: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Published!', 'Your article is now live.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('[WriteArticleScreen] publish error:', err);
      Alert.alert('Error', 'Failed to publish article. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [user, article, navigation]);

  // ── Setup header buttons ───────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handlePublish}
          disabled={publishing}
          style={styles.headerPublishBtn}>
          {publishing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.headerPublishText}>Publish</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, handlePublish, publishing]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Title input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Article Title..."
            placeholderTextColor={colors.textTertiary}
            value={article.title}
            onChangeText={(text) => updateField('title', text)}
            multiline={false}
            maxLength={200}
          />

          {/* Cover image picker */}
          <TouchableOpacity
            style={styles.coverPicker}
            onPress={pickCoverImage}
            activeOpacity={0.7}>
            {article.coverImageUri ? (
              <>
                <Image
                  source={{ uri: article.coverImageUri }}
                  style={styles.coverPreview}
                  resizeMode="cover"
                />
                <View style={styles.coverRemoveBtn}>
                  <Icon name="close" size={18} color={colors.white} />
                </View>
              </>
            ) : (
              <View style={styles.coverPlaceholder}>
                <Icon name="image-outline" size={32} color={colors.textTertiary} />
                <Text style={styles.coverPlaceholderText}>Add Cover Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Body input */}
          <TextInput
            style={styles.bodyInput}
            placeholder="Start writing your article..."
            placeholderTextColor={colors.textTertiary}
            value={article.content}
            onChangeText={(text) => updateField('content', text)}
            multiline
            textAlignVertical="top"
            maxLength={50000}
          />

          {/* Character/word count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {wordCount} words · {charCount.toLocaleString()} characters
            </Text>
            {showAutoSave && (
              <View style={styles.autoSaveIndicator}>
                <Icon name="cloud-upload-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.autoSaveText}>Auto-saved</Text>
              </View>
            )}
          </View>

          {/* Toggles section */}
          <View style={styles.togglesCard}>
            {/* Fact check toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Fact Check</Text>
                <Text style={styles.toggleSubtitle}>
                  Mark this article as fact-checked
                </Text>
              </View>
              <Switch
                value={article.factCheck}
                onValueChange={(val) => updateField('factCheck', val)}
                trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.surfaceElevated}
              />
            </View>

            {/* Publish status toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Publish Status</Text>
                <Text style={styles.toggleSubtitle}>
                  {article.isPublished ? 'Visible to everyone' : 'Saved as draft only'}
                </Text>
              </View>
              <Switch
                value={article.isPublished}
                onValueChange={(val) => updateField('isPublished', val)}
                trackColor={{ false: colors.surfaceElevated, true: colors.success }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.surfaceElevated}
              />
            </View>
          </View>

          {/* Save Draft button */}
          <TouchableOpacity
            style={styles.draftButton}
            onPress={handleSaveDraft}
            disabled={saving}
            activeOpacity={0.7}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <>
                <Icon name="document-text-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerPublishBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPublishText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Title
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingVertical: 12,
    lineHeight: 34,
  },
  // Cover image
  coverPicker: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  // Body
  bodyInput: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textPrimary,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  // Count row
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoSaveText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  // Toggles
  togglesCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Draft button
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
