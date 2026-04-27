import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import { createStory, getUser, uploadImage } from '../lib/db';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';

type RootStackParamList = {
  StoryCreator: undefined;
  Stories: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StoryCreator'>;
};

type StoryFormat = 'text' | 'image' | 'poll';

const GRADIENTS: { key: string; colors: string[]; label: string }[] = [
  { key: 'purple', colors: ['#667eea', '#764ba2'], label: 'Purple' },
  { key: 'sunset', colors: ['#f093fb', '#f5576c'], label: 'Sunset' },
  { key: 'ocean', colors: ['#4facfe', '#00f2fe'], label: 'Ocean' },
  { key: 'forest', colors: ['#43e97b', '#38f9d7'], label: 'Forest' },
  { key: 'fire', colors: ['#fa709a', '#fee140'], label: 'Fire' },
  { key: 'night', colors: ['#a18cd1', '#fbc2eb'], label: 'Night' },
  { key: 'blue', colors: ['#2193b0', '#6dd5ed'], label: 'Blue' },
  { key: 'dark', colors: ['#232526', '#414345'], label: 'Dark' },
];

const FONT_SIZES = [
  { value: 24, label: 'Small' },
  { value: 32, label: 'Medium' },
  { value: 42, label: 'Large' },
  { value: 56, label: 'Extra Large' },
];

const StoryCreatorScreen: React.FC<Props> = ({ navigation }) => {
  const currentUid = auth().currentUser?.uid ?? '';

  const [format, setFormat] = useState<StoryFormat>('text');
  const [storyText, setStoryText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('purple');
  const [fontSize, setFontSize] = useState(32);
  const [imageUri, setImageUri] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [audience, setAudience] = useState<'everyone' | 'followers'>('everyone');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handlePost}
          disabled={posting}
          style={styles.postButton}
          activeOpacity={0.7}
        >
          {posting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, posting, format, storyText, selectedGradient, fontSize, imageUri, audience, pollQuestion, pollOptions]);

  const pickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
      });
      if (result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri ?? '');
      }
    } catch (e) {
      console.warn('[StoryCreatorScreen] image picker error:', e);
    }
  }, []);

  const handlePost = useCallback(async () => {
    if (!currentUid) return;

    // Validation
    if (format === 'text' && !storyText.trim()) {
      Alert.alert('Error', 'Please enter story text');
      return;
    }
    if (format === 'image' && !imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    if (format === 'poll') {
      if (!pollQuestion.trim()) {
        Alert.alert('Error', 'Please enter a poll question');
        return;
      }
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please enter at least 2 poll options');
        return;
      }
    }

    setPosting(true);
    try {
      let mediaUrl = '';
      let content = '';
      let pollOptionsData: Array<{ id: string; text: string; votes: number; percentage: number }> | undefined;

      if (format === 'text') {
        mediaUrl = selectedGradient;
        content = storyText.trim();
      } else if (format === 'image') {
        if (imageUri && !imageUri.startsWith('http')) {
          mediaUrl = await uploadImage(
            imageUri,
            `stories/${currentUid}/${Date.now()}.jpg`,
          );
        } else {
          mediaUrl = imageUri;
        }
        content = imageCaption.trim();
      } else if (format === 'poll') {
        content = pollQuestion.trim();
        mediaUrl = selectedGradient;
        pollOptionsData = pollOptions
          .filter((o) => o.trim())
          .map((o) => ({
            id: `opt_${Math.random().toString(36).slice(2, 9)}`,
            text: o.trim(),
            votes: 0,
            percentage: 0,
          }));
      }

      await createStory(currentUid, {
        format,
        content,
        mediaUrl,
        pollOptions: pollOptionsData,
        audience,
        expiry: '24h',
      });

      Alert.alert('Success', 'Story posted!', [
        { text: 'OK', onPress: () => navigation.navigate('Stories') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post story');
    }
    setPosting(false);
  }, [
    currentUid,
    format,
    storyText,
    selectedGradient,
    imageUri,
    imageCaption,
    audience,
    pollQuestion,
    pollOptions,
    navigation,
  ]);

  const addPollOption = useCallback(() => {
    if (pollOptions.length < 5) {
      setPollOptions((prev) => [...prev, '']);
    }
  }, [pollOptions.length]);

  const updatePollOption = useCallback((index: number, value: string) => {
    setPollOptions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const removePollOption = useCallback((index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  }, [pollOptions.length]);

  const gradientObj = GRADIENTS.find((g) => g.key === selectedGradient);

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
          {/* Format Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Story Type</Text>
            <View style={styles.formatRow}>
              {(['text', 'image', 'poll'] as StoryFormat[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.formatButton, format === f && styles.formatButtonSelected]}
                  onPress={() => setFormat(f)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      format === f && styles.formatButtonTextSelected,
                    ]}
                  >
                    {f === 'text' ? '📝 Text' : f === 'image' ? '🖼️ Image' : '📊 Poll'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewContainer}>
              {format === 'text' && (
                <LinearGradient
                  colors={gradientObj?.colors ?? ['#667eea', '#764ba2']}
                  style={styles.previewGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text
                    style={[
                      styles.previewText,
                      { fontSize },
                    ]}
                    numberOfLines={5}
                  >
                    {storyText || 'Your story text...'}
                  </Text>
                </LinearGradient>
              )}

              {format === 'image' && (
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.previewImagePlaceholder}>
                      <Text style={styles.previewPlaceholderText}>+ Select Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {format === 'poll' && (
                <LinearGradient
                  colors={gradientObj?.colors ?? ['#667eea', '#764ba2']}
                  style={styles.previewGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.previewPollQuestion}>
                    {pollQuestion || 'Your poll question...'}
                  </Text>
                  <View style={styles.previewPollOptions}>
                    {pollOptions
                      .filter((o) => o.trim())
                      .slice(0, 3)
                      .map((opt, i) => (
                        <View key={i} style={styles.previewPollOption}>
                          <Text style={styles.previewPollOptionText}>{opt}</Text>
                        </View>
                      ))}
                  </View>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Text Story Fields */}
          {format === 'text' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Story Text</Text>
                <TextInput
                  style={styles.textInput}
                  value={storyText}
                  onChangeText={setStoryText}
                  placeholder="What's on your mind?"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{storyText.length}/200</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Background</Text>
                <View style={styles.gradientGrid}>
                  {GRADIENTS.map((g) => (
                    <TouchableOpacity
                      key={g.key}
                      style={[
                        styles.gradientCircle,
                        selectedGradient === g.key && styles.gradientCircleSelected,
                      ]}
                      onPress={() => setSelectedGradient(g.key)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={g.colors}
                        style={styles.gradientCircleInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Font Size</Text>
                <View style={styles.fontSizeRow}>
                  {FONT_SIZES.map((fs) => (
                    <TouchableOpacity
                      key={fs.value}
                      style={[styles.fontSizeButton, fontSize === fs.value && styles.fontSizeButtonSelected]}
                      onPress={() => setFontSize(fs.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.fontSizeButtonText,
                          fontSize === fs.value && styles.fontSizeButtonTextSelected,
                        ]}
                      >
                        {fs.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Image Story Fields */}
          {format === 'image' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Caption (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={imageCaption}
                onChangeText={setImageCaption}
                placeholder="Add a caption..."
                placeholderTextColor={Colors.textTertiary}
                maxLength={100}
              />
            </View>
          )}

          {/* Poll Story Fields */}
          {format === 'poll' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Poll Question</Text>
                <TextInput
                  style={styles.textInput}
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                  placeholder="Ask something..."
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={100}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Options</Text>
                {pollOptions.map((opt, i) => (
                  <View key={i} style={styles.pollInputRow}>
                    <TextInput
                      style={[styles.textInput, styles.pollInput]}
                      value={opt}
                      onChangeText={(v) => updatePollOption(i, v)}
                      placeholder={`Option ${i + 1}`}
                      placeholderTextColor={Colors.textTertiary}
                      maxLength={50}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity
                        onPress={() => removePollOption(i)}
                        style={styles.removePollOption}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.removePollOptionText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {pollOptions.length < 5 && (
                  <TouchableOpacity onPress={addPollOption} style={styles.addOptionBtn} activeOpacity={0.7}>
                    <Text style={styles.addOptionText}>+ Add Option</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Background</Text>
                <View style={styles.gradientGrid}>
                  {GRADIENTS.map((g) => (
                    <TouchableOpacity
                      key={g.key}
                      style={[
                        styles.gradientCircle,
                        selectedGradient === g.key && styles.gradientCircleSelected,
                      ]}
                      onPress={() => setSelectedGradient(g.key)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={g.colors}
                        style={styles.gradientCircleInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Audience Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audience</Text>
            <View style={styles.audienceRow}>
              {(['everyone', 'followers'] as const).map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.audienceButton, audience === a && styles.audienceButtonSelected]}
                  onPress={() => setAudience(a)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.audienceButtonText,
                      audience === a && styles.audienceButtonTextSelected,
                    ]}
                  >
                    {a === 'everyone' ? '🌍 Everyone' : '👥 Followers Only'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  postButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formatButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  formatButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  formatButtonTextSelected: {
    color: Colors.primary,
  },
  previewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    height: 300,
  },
  previewGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  previewText: {
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewImagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
  },
  previewPlaceholderText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  previewPollQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  previewPollOptions: {
    width: '100%',
    gap: Spacing.sm,
  },
  previewPollOption: {
    backgroundColor: Colors.whiteAlpha10,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  previewPollOptionText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
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
  charCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gradientCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  gradientCircleSelected: {
    borderColor: Colors.white,
  },
  gradientCircleInner: {
    flex: 1,
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  fontSizeButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  fontSizeButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fontSizeButtonTextSelected: {
    color: Colors.primary,
  },
  pollInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pollInput: {
    flex: 1,
  },
  removePollOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePollOptionText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  addOptionBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addOptionText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  audienceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  audienceButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  audienceButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  audienceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  audienceButtonTextSelected: {
    color: Colors.primary,
  },
});

export default StoryCreatorScreen;
