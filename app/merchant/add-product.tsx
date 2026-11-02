import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';
import {
  GST_RATES,
  productFields,
  productsWithVariants,
  productTypes,
  VARIANT_IMAGE_TYPES,
  variantConfig,
} from '../../config/productConfig';

/* =====================================================
   TYPES
===================================================== */

type FormData = {
  name: string;
  category: string;
  productType: string;
  description: string;
  sizeFit: string;
  materialCare: string;
  price: string;
  originalPrice: string;
  gstRate: string;
  stock: string;
  brand: string;
};

type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

type Variant = {
  attributes: Record<string, string>;
  price: string;
  discountPrice: string;
  stock: string;
  sku: string;
  available: boolean;
  images: PickedImage[];
};

const MAX_IMAGES = 6;
const MAX_VARIANT_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const createEmptyVariant = (): Variant => ({
  attributes: {},
  price: '',
  discountPrice: '',
  stock: '',
  sku: '',
  available: true,
  images: [],
});

const gstFor = (type: string) =>
  GST_RATES[type] !== undefined ? String(GST_RATES[type]) : '';

/* =====================================================
   SMALL REUSABLE PIECES
===================================================== */

function Card({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepText}>{step}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function ChipRow({
  options,
  value,
  onSelect,
  disabled,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryRow}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const selected = value === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.categoryChip, selected && styles.categoryChipSelected]}
            onPress={() => onSelect(option)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.categoryChipText,
                selected && styles.categoryChipTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function ImageThumbs({
  images,
  onRemove,
  disabled,
  showPrimary,
}: {
  images: PickedImage[];
  onRemove: (index: number) => void;
  disabled: boolean;
  showPrimary?: boolean;
}) {
  if (images.length === 0) return null;

  return (
    <View style={styles.thumbGrid}>
      {images.map((image, index) => (
        <View key={`${image.uri}-${index}`} style={styles.thumbCard}>
          <Image source={{ uri: image.uri }} style={styles.thumbImage} />
          {showPrimary && index === 0 && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.thumbRemove}
            onPress={() => onRemove(index)}
            disabled={disabled}
          >
            <Text style={styles.thumbRemoveText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

/* =====================================================
   SCREEN
===================================================== */

export default function AddProduct() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Electronics',
    productType: 'Smartphone',
    description: '',
    sizeFit: '',
    materialCare: '',
    price: '',
    originalPrice: '',
    gstRate: gstFor('Smartphone'),
    stock: '',
    brand: '',
  });

  const [productDetails, setProductDetails] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<Variant[]>([createEmptyVariant()]);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasVariants = productsWithVariants.includes(formData.productType);
  const isVariantImageType = VARIANT_IMAGE_TYPES.includes(formData.productType);
  const specificFields = productFields[formData.productType];

  /* ---------- ERROR ---------- */

  const showError = (message: string) => {
    setError(message);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  /* ---------- FORM CHANGES ---------- */

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const changeCategory = (category: string) => {
    const types = productTypes[category] || [];
    const newType = types.length > 0 ? types[0] : '';

    setFormData((current) => ({
      ...current,
      category,
      productType: newType,
      gstRate: gstFor(newType),
    }));
    setProductDetails({});
    setVariants([createEmptyVariant()]);
    setError('');
  };

  const changeProductType = (productType: string) => {
    setFormData((current) => ({
      ...current,
      productType,
      gstRate: gstFor(productType),
    }));
    setProductDetails({});
    setVariants([createEmptyVariant()]);
    setError('');
  };

  const updateProductDetail = (name: string, value: string) => {
    setProductDetails((current) => ({ ...current, [name]: value }));
    setError('');
  };

  /* ---------- VARIANTS ---------- */

  const addVariant = () => {
    setVariants((current) => [...current, createEmptyVariant()]);
  };

  const removeVariant = (index: number) => {
    setVariants((current) =>
      current.length === 1
        ? [createEmptyVariant()]
        : current.filter((_, i) => i !== index)
    );
    setError('');
  };

  const updateVariantAttribute = (index: number, key: string, value: string) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? { ...variant, attributes: { ...variant.attributes, [key]: value } }
          : variant
      )
    );
    setError('');
  };

  const updateVariantField = (
    index: number,
    field: 'price' | 'discountPrice' | 'stock' | 'sku' | 'available',
    value: string | boolean
  ) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
    setError('');
  };

  /* ---------- IMAGE PICKING ---------- */

  const pickImages = async (limit: number): Promise<PickedImage[]> => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo access to select product images.'
        );
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: limit,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      const valid: PickedImage[] = [];

      for (let i = 0; i < Math.min(result.assets.length, limit); i++) {
        const asset = result.assets[i];
        const mimeType = (asset.mimeType || 'image/jpeg').toLowerCase();

        if (!ALLOWED_TYPES.includes(mimeType)) {
          showError('Only JPG, JPEG, PNG and WEBP images are allowed.');
          continue;
        }

        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
          showError('Image size must be less than 5 MB.');
          continue;
        }

        valid.push({
          uri: asset.uri,
          name: asset.fileName || `product-${Date.now()}-${i}.jpg`,
          type: mimeType,
        });
      }

      return valid;
    } catch (err) {
      console.error('IMAGE PICKER ERROR:', err);
      showError('Unable to select image.');
      return [];
    }
  };

  const handleAddImages = async () => {
    const remaining = MAX_IMAGES - images.length;

    if (remaining <= 0) {
      showError('Maximum 6 product images are allowed.');
      return;
    }

    const picked = await pickImages(remaining);
    if (picked.length === 0) return;

    setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
    setError('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
    setError('');
  };

  const handleAddVariantImages = async (variantIndex: number) => {
    const existing = variants[variantIndex]?.images.length || 0;
    const remaining = MAX_VARIANT_IMAGES - existing;

    if (remaining <= 0) {
      showError('Maximum 4 images are allowed for each variant.');
      return;
    }

    const picked = await pickImages(remaining);
    if (picked.length === 0) return;

    setVariants((current) =>
      current.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              images: [...variant.images, ...picked].slice(0, MAX_VARIANT_IMAGES),
            }
          : variant
      )
    );
    setError('');
  };

  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === variantIndex
          ? { ...variant, images: variant.images.filter((_, j) => j !== imageIndex) }
          : variant
      )
    );
    setError('');
  };

  /* ---------- AUTH ---------- */

  const getMerchant = async () => {
    const storedUser = await AsyncStorage.getItem('loggedInUser');
    if (!storedUser) return null;

    try {
      const user = JSON.parse(storedUser);
      return user?.id ? user : null;
    } catch (err) {
      console.error('MERCHANT USER PARSE ERROR:', err);
      return null;
    }
  };

  /* ---------- VALIDATE VARIANTS ---------- */

  const validateVariants = (): string | null => {
    if (!hasVariants) return null;

    if (variants.length === 0) {
      return 'Please add at least one product variant.';
    }

    const fields = variantConfig[formData.productType] || [];

    for (let index = 0; index < variants.length; index++) {
      const variant = variants[index];
      const n = index + 1;

      for (const field of fields) {
        const value = variant.attributes?.[field.key];
        if (!value || !String(value).trim()) {
          return `Please enter ${field.label} for Variant ${n}.`;
        }
      }

      if (variant.price === '' || Number(variant.price) < 0) {
        return `Please enter a valid price for Variant ${n}.`;
      }

      if (variant.discountPrice !== '' && Number(variant.discountPrice) < 0) {
        return `Please enter a valid discount price for Variant ${n}.`;
      }

      if (
        variant.discountPrice !== '' &&
        Number(variant.discountPrice) > Number(variant.price)
      ) {
        return `Discount Price cannot be greater than Price for Variant ${n}.`;
      }

      if (variant.stock === '' || Number(variant.stock) < 0) {
        return `Please enter a valid stock quantity for Variant ${n}.`;
      }

      if (variant.sku && !String(variant.sku).trim()) {
        return `Please enter a valid SKU for Variant ${n}.`;
      }
    }

    return null;
  };

  /* ---------- UPLOAD ONE IMAGE ---------- */

  const uploadSingleImage = async (
    image: PickedImage,
    label: string,
    token: string,
    merchantId: string
  ): Promise<string> => {
    const imageFormData = new FormData();

    imageFormData.append('image', {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as any);

    const uploadResponse = await fetch(
      `${API_BASE_URL}/api/products/upload-image`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-id': merchantId,
        },
        body: imageFormData,
      }
    );

    const uploadText = await uploadResponse.text();
    let uploadData: any = {};

    try {
      uploadData = JSON.parse(uploadText);
    } catch {
      console.error('Upload returned non-JSON:', uploadText);
    }

    if (!uploadResponse.ok || !uploadData?.success) {
      throw new Error(
        uploadData?.message ||
          `${label} upload failed (${uploadResponse.status})`
      );
    }

    const url = uploadData?.image || uploadData?.imageUrl || uploadData?.url;

    if (!url) {
      throw new Error(`${label} uploaded but no image URL returned.`);
    }

    return url;
  };

  /* ---------- SUBMIT ---------- */

  const handleSubmit = async () => {
    if (loading) return;

    /* BASIC VALIDATION */

    if (!formData.name.trim()) return showError('Product name is required.');
    if (!formData.description.trim())
      return showError('Product description is required.');
    if (!formData.sizeFit.trim())
      return showError('Size & Fit information is required.');
    if (!formData.materialCare.trim())
      return showError('Material & Care information is required.');

    /* PRICE + STOCK (only for products without variants) */

    if (!hasVariants) {
      if (!formData.price.trim()) return showError('Selling price is required.');
      if (Number.isNaN(Number(formData.price)) || Number(formData.price) < 0)
        return showError('Selling price cannot be negative.');

      if (
        formData.originalPrice.trim() &&
        Number(formData.originalPrice) < Number(formData.price)
      ) {
        return showError('Original price cannot be lower than selling price.');
      }

      if (!formData.stock.trim()) return showError('Stock quantity is required.');
      if (Number.isNaN(Number(formData.stock)) || Number(formData.stock) < 0)
        return showError('Stock quantity cannot be negative.');
    }

    /* IMAGE VALIDATION */

    const totalImages = isVariantImageType
      ? variants.reduce((sum, v) => sum + v.images.length, 0)
      : images.length;

    if (totalImages === 0) {
      return showError('Please select at least one product image.');
    }

    /* VARIANT VALIDATION */

    const variantError = validateVariants();
    if (variantError) return showError(variantError);

    /* MERCHANT + TOKEN */

    const merchant = await getMerchant();
    if (!merchant?.id) {
      return showError('Merchant information not found. Please login again.');
    }

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      return showError('Authentication token is missing. Please login again.');
    }

    const merchantId = String(merchant.id);

    try {
      setLoading(true);
      setError('');

      /* STEP 1: UPLOAD ALL IMAGES */

      const uploadedImageUrls: string[] = [];
      const variantImageUrls: string[][] = [];

      if (isVariantImageType) {
        for (let v = 0; v < variants.length; v++) {
          const urls: string[] = [];

          for (let i = 0; i < variants[v].images.length; i++) {
            const url = await uploadSingleImage(
              variants[v].images[i],
              `Variant ${v + 1} image ${i + 1}`,
              token,
              merchantId
            );
            urls.push(url);
          }

          variantImageUrls.push(urls);
          uploadedImageUrls.push(...urls);
        }
      } else {
        for (let i = 0; i < images.length; i++) {
          const url = await uploadSingleImage(
            images[i],
            `Image ${i + 1}`,
            token,
            merchantId
          );
          uploadedImageUrls.push(url);
        }
      }

      if (uploadedImageUrls.length === 0) {
        throw new Error('No product image was uploaded.');
      }

      const primaryImage = uploadedImageUrls[0];

      /* PREPARE VARIANTS */

      const productVariants = hasVariants
        ? variants.map((variant, vIndex) => ({
            attributes: variant.attributes || {},
            price: Number(variant.price),
            discount_price:
              variant.discountPrice !== '' ? Number(variant.discountPrice) : null,
            stock: Number(variant.stock),
            sku: variant.sku ? String(variant.sku).trim() : null,
            available: Boolean(variant.available),
            images: variantImageUrls[vIndex] || [],
          }))
        : [];

      /* PRICE / STOCK / DISCOUNT (same logic as web) */

      const sellingPrice = hasVariants
        ? Math.min(...variants.map((v) => Number(v.discountPrice || v.price)))
        : Number(formData.price);

      const originalPrice = hasVariants
        ? Math.min(...variants.map((v) => Number(v.price)))
        : formData.originalPrice
          ? Number(formData.originalPrice)
          : Number(formData.price);

      const stock = hasVariants
        ? variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
        : Number(formData.stock);

      const discountBase = hasVariants
        ? originalPrice
        : Number(formData.originalPrice);

      const discount =
        discountBase > 0
          ? Math.max(
              0,
              Math.round(((discountBase - sellingPrice) / discountBase) * 100)
            )
          : 0;

      /* STEP 2: ADD PRODUCT */

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-id': merchantId,
        },
        body: JSON.stringify({
          merchant_id: Number(merchant.id),
          name: formData.name.trim(),
          category: formData.category,
          product_type: formData.productType,
          description: formData.description.trim(),
          size_fit: formData.sizeFit.trim(),
          material_care: formData.materialCare.trim(),
          price: sellingPrice,
          original_price: originalPrice,
          stock,
          discount,
          gst_rate: Number(formData.gstRate),
          brand: formData.brand.trim(),
          image: primaryImage,
          product_images: uploadedImageUrls,
          product_details: productDetails,
          product_variants: productVariants,
        }),
      });

      const responseText = await response.text();
      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Product API returned non-JSON:', responseText);
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `Failed to add product (${response.status})`
        );
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to add product');
      }

      /* SUCCESS */

      Alert.alert(
        'Product Added',
        `Product added successfully with ${uploadedImageUrls.length} image${
          uploadedImageUrls.length > 1 ? 's' : ''
        }!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/merchant/products'),
          },
        ]
      );
    } catch (err: any) {
      console.error('ADD PRODUCT ERROR:', err);
      showError(err?.message || 'Unable to add product.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- AUTO DISCOUNT DISPLAY ---------- */

  const autoDiscountText =
    formData.originalPrice &&
    Number(formData.originalPrice) > 0 &&
    Number(formData.price) >= 0
      ? `${Math.max(
          0,
          Math.round(
            ((Number(formData.originalPrice) - Number(formData.price)) /
              Number(formData.originalPrice)) *
              100
          )
        )}% OFF`
      : '0% OFF';

  /* ---------- STEP NUMBERS ---------- */

  let stepCounter = 1;
  const stepInfo = stepCounter++;
  const stepDetails = specificFields ? stepCounter++ : 0;
  const stepPricing = stepCounter++;
  const stepImages = !isVariantImageType ? stepCounter++ : 0;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>MERCHANT</Text>
              <Text style={styles.title}>Add Product</Text>
              <Text style={styles.subtitle}>
                Add product information, pricing, inventory and specifications.
              </Text>
            </View>
          </View>

          {/* ERROR */}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* =================================================
              1. PRODUCT INFORMATION
          ================================================= */}

          <Card
            step={stepInfo}
            title="Product Information"
            subtitle="Enter the basic information about your product."
          >
            <View style={styles.group}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(v) => updateField('name', v)}
                placeholder="Enter product name"
                placeholderTextColor="#a1a1aa"
                editable={!loading}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Category *</Text>
              <ChipRow
                options={Object.keys(productTypes)}
                value={formData.category}
                onSelect={changeCategory}
                disabled={loading}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Product Type *</Text>
              <ChipRow
                options={productTypes[formData.category] || []}
                value={formData.productType}
                onSelect={changeProductType}
                disabled={loading}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(v) => updateField('brand', v)}
                placeholder="Enter brand name"
                placeholderTextColor="#a1a1aa"
                editable={!loading}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>GST Rate (%) *</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={formData.gstRate}
                editable={false}
                placeholder="Auto"
                placeholderTextColor="#a1a1aa"
              />
              <Text style={styles.hint}>
                GST is automatically applied based on the selected product type.
              </Text>
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Product Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(v) => updateField('description', v)}
                placeholder="Enter detailed product description..."
                placeholderTextColor="#a1a1aa"
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Size & Fit *</Text>
              <TextInput
                style={[styles.input, styles.smallTextArea]}
                value={formData.sizeFit}
                onChangeText={(v) => updateField('sizeFit', v)}
                placeholder="e.g. Regular fit, M/L/XL"
                placeholderTextColor="#a1a1aa"
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Material & Care *</Text>
              <TextInput
                style={[styles.input, styles.smallTextArea]}
                value={formData.materialCare}
                onChangeText={(v) => updateField('materialCare', v)}
                placeholder="Enter material and care instructions..."
                placeholderTextColor="#a1a1aa"
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </Card>

          {/* =================================================
              2. PRODUCT SPECIFIC DETAILS
          ================================================= */}

          {specificFields ? (
            <Card
              step={stepDetails}
              title={`${formData.productType} Details`}
              subtitle="Enter specifications specific to this product type."
            >
              {specificFields.map((field) => (
                <View style={styles.group} key={field.name}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={productDetails[field.name] || ''}
                    onChangeText={(v) => updateProductDetail(field.name, v)}
                    placeholder={field.placeholder}
                    placeholderTextColor="#a1a1aa"
                    editable={!loading}
                  />
                </View>
              ))}
            </Card>
          ) : null}

          {/* =================================================
              3A. PRODUCT VARIANTS
          ================================================= */}

          {hasVariants ? (
            <Card
              step={stepPricing}
              title={`${formData.productType} Variants`}
              subtitle="Add different combinations of specifications, price and stock."
            >
              <TouchableOpacity
                style={styles.addVariantButton}
                onPress={addVariant}
                disabled={loading}
              >
                <Text style={styles.addVariantText}>+ Add Variant</Text>
              </TouchableOpacity>

              {variants.map((variant, index) => (
                <View style={styles.variantCard} key={index}>
                  <View style={styles.variantHeader}>
                    <Text style={styles.variantTitle}>Variant {index + 1}</Text>

                    <TouchableOpacity
                      style={styles.variantRemove}
                      onPress={() => removeVariant(index)}
                      disabled={loading || variants.length === 1}
                    >
                      <Text
                        style={[
                          styles.variantRemoveText,
                          variants.length === 1 && styles.variantRemoveDisabled,
                        ]}
                      >
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {(variantConfig[formData.productType] || []).map((field) => (
                    <View style={styles.group} key={field.key}>
                      <Text style={styles.label}>{field.label}</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.attributes?.[field.key] || ''}
                        onChangeText={(v) =>
                          updateVariantAttribute(index, field.key, v)
                        }
                        placeholder={field.placeholder}
                        placeholderTextColor="#a1a1aa"
                        editable={!loading}
                      />
                    </View>
                  ))}

                  <View style={[styles.row, styles.rowMargin]}>
                    <View style={styles.half}>
                      <Text style={styles.label}>Price</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={variant.price}
                          onChangeText={(v) => updateVariantField(index, 'price', v)}
                          placeholder="0"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="decimal-pad"
                          editable={!loading}
                        />
                      </View>
                    </View>

                    <View style={styles.half}>
                      <Text style={styles.label}>Discount Price</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={variant.discountPrice}
                          onChangeText={(v) =>
                            updateVariantField(index, 'discountPrice', v)
                          }
                          placeholder="0"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="decimal-pad"
                          editable={!loading}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.group}>
                    <Text style={styles.label}>Stock</Text>
                    <TextInput
                      style={styles.input}
                      value={variant.stock}
                      onChangeText={(v) => updateVariantField(index, 'stock', v)}
                      placeholder="Quantity"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>

                  {formData.productType === 'Smartphone' ? (
                    <View style={styles.group}>
                      <Text style={styles.label}>SKU</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.sku}
                        onChangeText={(v) => updateVariantField(index, 'sku', v)}
                        placeholder="e.g. PROD-BLK-128"
                        placeholderTextColor="#a1a1aa"
                        autoCapitalize="characters"
                        editable={!loading}
                      />
                    </View>
                  ) : null}

                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Available for sale</Text>
                    <Switch
                      value={variant.available}
                      onValueChange={(v) =>
                        updateVariantField(index, 'available', v)
                      }
                      trackColor={{ false: '#d4d4d8', true: '#c4b5fd' }}
                      thumbColor={variant.available ? '#7c3aed' : '#f4f4f5'}
                      disabled={loading}
                    />
                  </View>

                  {isVariantImageType ? (
                    <View style={styles.variantImages}>
                      <Text style={styles.label}>Images for this variant</Text>
                      <Text style={styles.hint}>
                        Maximum 4 images, 5MB each ({variant.images.length}/
                        {MAX_VARIANT_IMAGES})
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.uploadButton,
                          variant.images.length >= MAX_VARIANT_IMAGES &&
                            styles.disabledButton,
                        ]}
                        onPress={() => handleAddVariantImages(index)}
                        disabled={
                          loading || variant.images.length >= MAX_VARIANT_IMAGES
                        }
                      >
                        <Text style={styles.uploadButtonText}>
                          ⬆ Upload Images
                        </Text>
                      </TouchableOpacity>

                      <ImageThumbs
                        images={variant.images}
                        onRemove={(imageIndex) =>
                          handleRemoveVariantImage(index, imageIndex)
                        }
                        disabled={loading}
                      />
                    </View>
                  ) : null}
                </View>
              ))}

              <Text style={styles.hint}>
                Each variant can have its own specifications, price and stock.
              </Text>
            </Card>
          ) : (
            /* =================================================
               3B. PRICE & INVENTORY (no variants)
            ================================================= */
            <Card
              step={stepPricing}
              title="Pricing & Inventory"
              subtitle="Enter product pricing and available stock."
            >
              <View style={[styles.row, styles.rowMargin]}>
                <View style={styles.half}>
                  <Text style={styles.label}>Selling Price *</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={formData.price}
                      onChangeText={(v) => updateField('price', v)}
                      placeholder="0"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.half}>
                  <Text style={styles.label}>Original Price</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={formData.originalPrice}
                      onChangeText={(v) => updateField('originalPrice', v)}
                      placeholder="0"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.row, styles.rowMargin]}>
                <View style={styles.half}>
                  <Text style={styles.label}>Discount</Text>
                  <View style={[styles.priceContainer, styles.readOnlyInput]}>
                    <TextInput
                      style={styles.priceInput}
                      value={autoDiscountText}
                      editable={false}
                    />
                  </View>
                </View>

                <View style={styles.half}>
                  <Text style={styles.label}>Stock Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stock}
                    onChangeText={(v) => updateField('stock', v)}
                    placeholder="Enter stock quantity"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
              </View>
            </Card>
          )}

          {/* =================================================
              4. PRODUCT IMAGES (all except Smartphone / Laptop)
          ================================================= */}

          {!isVariantImageType ? (
            <Card
              step={stepImages}
              title="Product Images"
              subtitle="Add product images. The first image will be the primary product image."
            >
              <TouchableOpacity
                style={[
                  styles.imagePicker,
                  images.length >= MAX_IMAGES && styles.disabledButton,
                ]}
                onPress={handleAddImages}
                disabled={loading || images.length >= MAX_IMAGES}
                activeOpacity={0.8}
              >
                <Text style={styles.imagePickerIcon}>🖼️</Text>

                <View style={styles.imagePickerContent}>
                  <Text style={styles.imagePickerTitle}>
                    {images.length >= MAX_IMAGES
                      ? 'Maximum Images Added'
                      : 'Add Product Images'}
                  </Text>
                  <Text style={styles.imagePickerSubtitle}>
                    JPG, PNG, WEBP up to 5MB • {images.length}/{MAX_IMAGES} images
                  </Text>
                </View>

                <Text style={styles.imagePickerArrow}>›</Text>
              </TouchableOpacity>

              {images.length > 0 ? (
                <ImageThumbs
                  images={images}
                  onRemove={handleRemoveImage}
                  disabled={loading}
                  showPrimary
                />
              ) : (
                <View style={styles.emptyPreview}>
                  <Text style={styles.emptyPreviewIcon}>📷</Text>
                  <Text style={styles.emptyPreviewTitle}>Image Preview</Text>
                  <Text style={styles.emptyPreviewSubtitle}>
                    Select images to preview them here
                  </Text>
                </View>
              )}
            </Card>
          ) : null}

          {/* ACTIONS */}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.loadingText}>Adding Product...</Text>
                </>
              ) : (
                <Text style={styles.addButtonText}>Add Product</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fb' },
  keyboard: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f7f7fb' },
  content: { padding: 16, paddingBottom: 80 },

  /* HEADER */
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 2,
  },
  backText: { color: '#27272a', fontSize: 24 },
  headerText: { flex: 1 },
  eyebrow: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: { color: '#18181b', fontSize: 25, fontWeight: '800', marginTop: 1 },
  subtitle: { color: '#71717a', fontSize: 11, marginTop: 3 },

  /* ERROR */
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },

  /* CARD */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  cardHeaderText: { flex: 1 },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepText: { color: '#7c3aed', fontSize: 13, fontWeight: '900' },
  cardTitle: { color: '#18181b', fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: '#71717a', fontSize: 10, marginTop: 2 },

  /* FORM */
  group: { marginTop: 17 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowMargin: { marginTop: 17 },
  half: { width: '48%' },
  label: { color: '#27272a', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  hint: { color: '#71717a', fontSize: 10, marginTop: 5 },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: '#18181b',
    fontSize: 12,
  },
  readOnlyInput: { backgroundColor: '#f4f4f5', color: '#52525b' },
  textArea: { minHeight: 105, paddingTop: 11 },
  smallTextArea: { minHeight: 85, paddingTop: 11 },

  /* CHIPS */
  categoryRow: { paddingVertical: 2, paddingRight: 10, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#ffffff',
  },
  categoryChipSelected: { borderColor: '#7c3aed', backgroundColor: '#7c3aed' },
  categoryChipText: { color: '#52525b', fontSize: 11, fontWeight: '700' },
  categoryChipTextSelected: { color: '#ffffff' },

  /* PRICE */
  priceContainer: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  currency: { color: '#71717a', fontSize: 13, fontWeight: '800' },
  priceInput: {
    flex: 1,
    color: '#18181b',
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 7,
  },

  /* VARIANTS */
  addVariantButton: {
    marginTop: 14,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7c3aed',
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVariantText: { color: '#7c3aed', fontSize: 12, fontWeight: '800' },
  variantCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 14,
    backgroundColor: '#fafafa',
    padding: 13,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variantTitle: { color: '#18181b', fontSize: 14, fontWeight: '800' },
  variantRemove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantRemoveText: { color: '#dc2626', fontSize: 18, fontWeight: '800' },
  variantRemoveDisabled: { opacity: 0.35 },
  switchRow: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variantImages: {
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  uploadButton: {
    marginTop: 10,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  /* IMAGES */
  imagePicker: {
    marginTop: 15,
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#faf5ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  imagePickerIcon: { fontSize: 27, marginRight: 11 },
  imagePickerContent: { flex: 1 },
  imagePickerTitle: { color: '#5b21b6', fontSize: 13, fontWeight: '800' },
  imagePickerSubtitle: { color: '#7c3aed', fontSize: 9, marginTop: 3 },
  imagePickerArrow: { color: '#7c3aed', fontSize: 28 },

  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  thumbCard: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  primaryBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: '800' },

  emptyPreview: {
    marginTop: 13,
    minHeight: 145,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d4d4d8',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPreviewIcon: { fontSize: 32 },
  emptyPreviewTitle: {
    color: '#52525b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },
  emptyPreviewSubtitle: { color: '#a1a1aa', fontSize: 9, marginTop: 4 },

  /* ACTIONS */
  actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#3f3f46', fontSize: 12, fontWeight: '800' },
  addButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  loadingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },
  disabledButton: { opacity: 0.65 },
  bottomSpace: { height: 20 },
});
