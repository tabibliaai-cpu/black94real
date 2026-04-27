import React, { useCallback, useEffect, useState } from 'react';
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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import theme from '../theme';
import { ShopProduct, createProduct, updateProduct } from '../lib/shop';

type RootStackParamList = {
  AddProduct: { product?: ShopProduct };
  MyStore: undefined;
};

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Accessories',
  'Home & Garden',
  'Health & Beauty',
  'Books',
  'Toys',
  'Sports',
  'Food & Beverages',
  'Digital',
  'Services',
  'Other',
];

const AddProductScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AddProduct'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isEditing = !!route.params?.product;
  const editProduct = route.params?.product;

  const uid = auth().currentUser?.uid ?? '';

  const [name, setName] = useState(editProduct?.name ?? '');
  const [description, setDescription] = useState(editProduct?.description ?? '');
  const [price, setPrice] = useState(editProduct?.price?.toString() ?? '');
  const [compareAtPrice, setCompareAtPrice] = useState(
    editProduct?.compareAtPrice?.toString() ?? '',
  );
  const [category, setCategory] = useState(editProduct?.category ?? '');
  const [tags, setTags] = useState(editProduct?.tags?.join(', ') ?? '');
  const [stock, setStock] = useState(editProduct?.stock?.toString() ?? '');
  const [sku, setSku] = useState(editProduct?.sku ?? '');
  const [variants, setVariants] = useState(editProduct?.variants ?? '[]');
  const [isDigital, setIsDigital] = useState(editProduct?.isDigital ?? false);
  const [isFeatured, setIsFeatured] = useState(editProduct?.isFeatured ?? false);
  const [images, setImages] = useState<string[]>(
    editProduct?.images
      ? editProduct.images.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  );
  const [saving, setSaving] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const handlePickImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5,
        quality: 0.8,
      });
      if (result.assets && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri ?? '').filter(Boolean);
        setImages((prev) => [...prev, ...uris].slice(0, 5));
      }
    } catch {
      // cancelled or error
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Product name is required.');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return;
    }
    if (!category) {
      Alert.alert('Validation', 'Please select a category.');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        businessId: uid,
        businessName: '',
        businessImage: '',
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        images: images.join(', '),
        stock: parseInt(stock || '0', 10),
        sku: sku.trim(),
        variants,
        isDigital,
        isFeatured,
        isActive: true,
      };

      if (isEditing && editProduct) {
        await updateProduct(editProduct.id, productData);
        Alert.alert('Success', 'Product updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createProduct(productData);
        Alert.alert('Success', 'Product created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (
    label: string,
    value: boolean,
    onToggle: (val: boolean) => void,
  ) => (
    <TouchableOpacity
      style={styles.toggleRow}
      onPress={() => onToggle(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleSwitch, value && styles.toggleSwitchOn]}>
        <View
          style={[
            styles.toggleKnob,
            value && styles.toggleKnobOn,
          ]}
        />
      </View>
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Product' : 'Add Product'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageCard}>
                <Image
                  source={{ uri }}
                  style={styles.imageThumbnail}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveImage(idx)}>
                  <Icon name="close" size={16} color={theme.Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImages}>
                <Icon name="camera-outline" size={24} color={theme.Colors.textTertiary} />
                <Text style={styles.addImageText}>
                  {images.length === 0 ? 'Add Images' : '+ More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hintText}>Up to 5 images. First image is the cover.</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              placeholderTextColor={theme.Colors.textTertiary}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product..."
              placeholderTextColor={theme.Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.priceRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.Colors.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Compare-at Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.Colors.textTertiary}
                value={compareAtPrice}
                onChangeText={setCompareAtPrice}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>
        </View>

        {/* Category & Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category & Tags</Text>

          {/* Category Dropdown */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setCategoryOpen(!categoryOpen)}>
              <Text
                style={[
                  styles.dropdownText,
                  !category && styles.dropdownPlaceholder,
                ]}>
                {category || 'Select category'}
              </Text>
              <Icon
                name={categoryOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.Colors.textTertiary}
              />
            </TouchableOpacity>
            {categoryOpen && (
              <View style={styles.dropdownList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      category === cat && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryOpen(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        category === cat && styles.dropdownItemTextActive,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="tag1, tag2, tag3"
              placeholderTextColor={theme.Colors.textTertiary}
              value={tags}
              onChangeText={setTags}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <View style={styles.priceRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Stock Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.Colors.textTertiary}
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>SKU</Text>
              <TextInput
                style={styles.input}
                placeholder="SKU-001"
                placeholderTextColor={theme.Colors.textTertiary}
                value={sku}
                onChangeText={setSku}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Variants (JSON){' '}
              <Text style={styles.hintText}>{'e.g. [{"name":"Size","options":["S","M","L"]}]'}</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='[{"name":"Size","options":["S","M","L"]}]'
              placeholderTextColor={theme.Colors.textTertiary}
              value={variants}
              onChangeText={setVariants}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          {renderToggle('Digital Product', isDigital, setIsDigital)}
          {renderToggle('Featured Product', isFeatured, setIsFeatured)}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color={theme.Colors.black} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Update Product' : 'Create Product'}
            </Text>
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
    minHeight: 80,
    paddingTop: theme.Spacing.md,
  },
  hintText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
  },
  imageCard: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 2,
    borderColor: theme.Colors.surfaceBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: {
    color: theme.Colors.textTertiary,
    fontSize: theme.FontSize.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.md,
  },
  dropdownText: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
  },
  dropdownPlaceholder: {
    color: theme.Colors.textTertiary,
  },
  dropdownList: {
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceBorder,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  dropdownItemText: {
    color: theme.Colors.textSecondary,
    fontSize: theme.FontSize.sm,
  },
  dropdownItemTextActive: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.Spacing.md,
    backgroundColor: theme.Colors.surface,
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.surfaceBorder,
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.sm,
  },
  toggleLabel: {
    color: theme.Colors.textPrimary,
    fontSize: theme.FontSize.md,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.Colors.surfaceBorder,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: theme.Colors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.Colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  saveBtn: {
    marginHorizontal: theme.Spacing.lg,
    backgroundColor: theme.Colors.primary,
    borderRadius: theme.BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: theme.Colors.white,
    fontSize: theme.FontSize.lg,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default AddProductScreen;
