import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import theme from '../theme';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const INTERESTS = ['Technology', 'Fashion', 'Health', 'Sports', 'Food', 'Business', 'Education', 'Entertainment', 'Travel', 'Gaming'];
const PLACEMENTS = ['Feed', 'Stories', 'Profile'];

const CreateAdScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const uid = auth().currentUser?.uid ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUri, setMediaUri] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('7');
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState('Feed');
  const [creating, setCreating] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });
      if (result.assets && result.assets[0]?.uri) {
        setMediaUri(result.assets[0].uri);
      }
    } catch {
      // cancelled
    }
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (val: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Ad title is required.');
      return;
    }
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Validation', 'Please enter a valid budget.');
      return;
    }
    if (!mediaUri) {
      Alert.alert('Validation', 'Please select an image for your ad.');
      return;
    }

    setCreating(true);
    try {
      await firestore().collection('ads').add({
        businessId: uid,
        title: title.trim(),
        description: description.trim(),
        mediaUrl: mediaUri,
        budget: Number(budget),
        spent: 0,
        clicks: 0,
        impressions: 0,
        status: 'active',
        targetAge: selectedAges,
        targetInterests: selectedInterests,
        placement: selectedPlacement,
        durationDays: Number(duration) || 7,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Ad created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create ad. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderChip = (
    label: string,
    selected: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={label}
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ad</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Media Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Creative</Text>
          {mediaUri ? (
            <View style={styles.mediaPreview}>
              <Image
                source={{ uri: mediaUri }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeMediaBtn}
                onPress={() => setMediaUri('')}>
                <Icon name="close" size={16} color={theme.Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
              <Icon name="image-outline" size={32} color={theme.Colors.textTertiary} />
              <Text style={styles.uploadText}>Upload Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title & Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Details</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ad Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ad title"
              placeholderTextColor={theme.Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your ad..."
              placeholderTextColor={theme.Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Budget & Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget & Duration</Text>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Budget (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                placeholderTextColor={theme.Colors.textTertiary}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Duration (days)</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                placeholderTextColor={theme.Colors.textTertiary}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>
        </View>

        {/* Placement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Placement</Text>
          <View style={styles.chipGrid}>
            {PLACEMENTS.map((p) =>
              renderChip(
                p,
                selectedPlacement === p,
                () => setSelectedPlacement(p),
              ),
            )}
          </View>
        </View>

        {/* Target Age */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Age Group</Text>
          <View style={styles.chipGrid}>
            {AGE_RANGES.map((age) =>
              renderChip(
                age,
                selectedAges.includes(age),
                () => toggleArrayItem(selectedAges, age, setSelectedAges),
              ),
            )}
          </View>
          <Text style={styles.hint}>
            Leave empty to target all age groups
          </Text>
        </View>

        {/* Target Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Interests</Text>
          <View style={styles.chipGrid}>
            {INTERESTS.map((interest) =>
              renderChip(
                interest,
                selectedInterests.includes(interest),
                () => toggleArrayItem(selectedInterests, interest, setSelectedInterests),
              ),
            )}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, creating && styles.disabledBtn]}
          onPress={handleCreate}
          disabled={creating}>
          {creating ? (
            <ActivityIndicator color={theme.Colors.black} size="small" />
          ) : (
            <Text style={styles.createBtnText}>Create Ad</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: theme.Spacing.lg,
  },
  sectionTitle: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.lg,
    fontWeight: '600',
    marginBottom: theme.Spacing.md,
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    width: '100%',
    height: 160,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 2,
    borderColor: theme.Colors.surfaceBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.sm,
  },
  uploadText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.sm,
  },
  field: {
    marginBottom: theme.Spacing.md,
  },
  fieldLabel: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.md,
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
  },
  textArea: {
    minHeight: 60,
    paddingTop: theme.Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.BorderRadius.lg,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
  },
  chipSelected: {
    backgroundColor: theme.Colors.primary + '20',
    borderColor: theme.Colors.primary,
  },
  chipText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: theme.Colors.primary,
  },
  hint: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: theme.Spacing.sm,
  },
  createBtn: {
    marginHorizontal: theme.Spacing.lg,
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default CreateAdScreen;
