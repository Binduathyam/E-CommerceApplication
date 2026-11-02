import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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

/* =====================================================
   PART 1: HELPER FUNCTIONS
   (images, variants, price, discount, stock, login info)
===================================================== */
// config/productHelpers.ts
// Same helper logic as the web MerchantProducts page.



/* =====================================================
   AUTH (merchant token + merchant id)
===================================================== */

const getMerchantAuth = async () => {
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    throw new Error('Login session expired. Please login again.');
  }

  const storedUser = await AsyncStorage.getItem('loggedInUser');

  if (!storedUser) {
    throw new Error('Login session not found. Please login again.');
  }

  let user: any;

  try {
    user = JSON.parse(storedUser);
  } catch {
    throw new Error('Invalid login session. Please login again.');
  }

  const merchantId = Number(user?.id);

  if (!merchantId || Number.isNaN(merchantId)) {
    throw new Error('Merchant ID not found. Please logout and login again.');
  }

  if (user?.role && user.role !== 'merchant') {
    throw new Error(
      `This account is registered as ${user.role}. Please login with a merchant account.`
    );
  }

  return { token, merchantId, user };
};

/* =====================================================
   IMAGE HELPERS
===================================================== */

const resolveImageUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return '';

  const cleanUrl = url.trim();

  if (!cleanUrl) return '';

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('file://') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith('/')) {
    return `${API_BASE_URL}${cleanUrl}`;
  }

  return `${API_BASE_URL}/${cleanUrl}`;
};

const normalizeImageValue = (value: any): string | null => {
  if (!value) return null;

  if (typeof value === 'object') {
    return (
      value.url ||
      value.image ||
      value.image_url ||
      value.imageUrl ||
      value.path ||
      value.src ||
      null
    );
  }

  return String(value).trim();
};

// array / JSON string / "a,b,c" / single value  ->  array
const toList = (value: any): any[] => {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    const raw = value.trim();

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) return parsed;

      return parsed ? [parsed] : [];
    } catch {
      return raw.includes(',')
        ? raw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [raw];
    }
  }

  return [];
};

const getProductImages = (product: any): string[] => {
  let images = toList(product?.product_images);

  if (images.length === 0) {
    images = toList(product?.images);
  }

  if (images.length === 0) {
    const mainImage =
      product?.image ||
      product?.image_url ||
      product?.imageUrl ||
      product?.thumbnail ||
      product?.thumbnail_url;

    if (mainImage) images = [mainImage];
  }

  const normalized = images
    .map((image) => normalizeImageValue(image))
    .filter(Boolean)
    .map((image) => resolveImageUrl(image))
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

/* =====================================================
   JSON HELPERS
===================================================== */

const parseObject = (value: any): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  return {};
};

const getProductVariants = (product: any): any[] => {
  const variants = product?.product_variants;

  if (Array.isArray(variants)) return variants;

  if (typeof variants === 'string' && variants.trim()) {
    try {
      const parsed = JSON.parse(variants);

      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      console.error('Unable to parse product variants:', err);
    }
  }

  return [];
};

/* =====================================================
   PRICE / DISCOUNT / STOCK (variant aware)
===================================================== */

const variantDiscountPrice = (variant: any): number => {
  const discount = Number(variant?.discount_price);
  const discountCamel = Number(variant?.discountPrice);

  if (discount > 0) return discount;
  if (discountCamel > 0) return discountCamel;

  return 0;
};

const getVariantSellingPrice = (variant: any): number => {
  const discount = variantDiscountPrice(variant);

  if (discount > 0) return discount;

  const price = Number(variant?.price);

  return Number.isFinite(price) && price > 0 ? price : 0;
};

const getProductPrice = (product: any): number => {
  const variantPrices = getProductVariants(product)
    .map(getVariantSellingPrice)
    .filter((price) => Number.isFinite(price) && price > 0);

  if (variantPrices.length > 0) {
    return Math.min(...variantPrices);
  }

  const productPrice = Number(product?.price);

  return Number.isFinite(productPrice) && productPrice > 0 ? productPrice : 0;
};

const getOriginalPrice = (product: any): number | null => {
  const originalPrices = getProductVariants(product)
    .map((variant) => {
      const original = Number(variant?.price);
      const discount = variantDiscountPrice(variant);

      return original > 0 && discount > 0 && original > discount
        ? original
        : 0;
    })
    .filter((price) => Number.isFinite(price) && price > 0);

  if (originalPrices.length > 0) {
    return Math.min(...originalPrices);
  }

  const productOriginal = Number(product?.original_price);

  return Number.isFinite(productOriginal) && productOriginal > 0
    ? productOriginal
    : null;
};

const getDiscount = (product: any): number => {
  const variantDiscounts = getProductVariants(product)
    .map((variant) => {
      const original = Number(variant?.price);
      const discount = variantDiscountPrice(variant);

      return original > 0 && discount > 0 && discount < original
        ? Math.round(((original - discount) / original) * 100)
        : 0;
    })
    .filter((value) => Number.isFinite(value) && value > 0);

  if (variantDiscounts.length > 0) {
    return Math.max(...variantDiscounts);
  }

  const price = Number(product?.price);
  const originalPrice = Number(product?.original_price);

  if (originalPrice > 0 && price > 0 && originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const directDiscount = Number(product?.discount);

  return Number.isFinite(directDiscount) && directDiscount > 0
    ? directDiscount
    : 0;
};

const getStock = (product: any): number => {
  const variants = getProductVariants(product);

  if (variants.length > 0) {
    return variants.reduce((total, variant) => {
      const stock = Number(variant?.stock);

      return Number.isFinite(stock) && stock > 0 ? total + stock : total;
    }, 0);
  }

  const productStock = Number(product?.stock);

  return Number.isFinite(productStock) && productStock >= 0
    ? productStock
    : 0;
};

const formatPrice = (price: any): string => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) return '₹0';

  return `₹${numericPrice.toLocaleString('en-IN')}`;
};

const getProductId = (product: any) =>
  product?.id ?? product?.product_id;

/* =====================================================
   PART 2: EDIT PRODUCT FORM
===================================================== */


const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

type ExistingImage = { id: string; url: string };
type NewImage = { uri: string; name: string; type: string };

type Props = {
  product: any;
  onCancel: () => void;
  // Must throw an Error when the update fails.
  onUpdate: (payload: any) => Promise<void>;
};

// "screen_size" / "screenSize" -> "Screen Size"
const prettyLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function EditProductForm({ product, onCancel, onUpdate }: Props) {
  /* =====================================================
     STATE
  ===================================================== */

  const [formData, setFormData] = useState({
    name: product.name || '',
    category: product.category || 'Electronics',
    productType: product.product_type || 'Smartphone',
    description: product.description || '',
    sizeFit: product.size_fit || '',
    materialCare: product.material_care || '',
    brand: product.brand || '',
    gstRate:
      product.gst_rate !== undefined && product.gst_rate !== null
        ? String(product.gst_rate)
        : '',
  });

  const [productDetails, setProductDetails] = useState<Record<string, any>>(
    () => parseObject(product.product_details)
  );

  const [variants, setVariants] = useState<any[]>(() =>
    getProductVariants(product).map((variant) => ({ ...variant }))
  );

  const [images, setImages] = useState<ExistingImage[]>(() =>
    getProductImages(product).map((url, index) => ({
      id: `existing-${index}`,
      url,
    }))
  );

  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = React.useRef<ScrollView>(null);

  const showError = (message: string) => {
    setError(message);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const totalImages = images.length + newImages.length;

  /* =====================================================
     FORM CHANGES
  ===================================================== */

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleDetailChange = (key: string, value: string) => {
    setProductDetails((previous) => ({ ...previous, [key]: value }));
  };

  /* =====================================================
     IMAGES
  ===================================================== */

  const handleAddImages = async () => {
    setError('');

    const remaining = MAX_IMAGES - totalImages;

    if (remaining <= 0) {
      showError(`Maximum ${MAX_IMAGES} product images are allowed.`);
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showError('Please allow photo access to select product images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const valid: NewImage[] = [];

      result.assets.slice(0, remaining).forEach((asset, index) => {
        const mimeType = (asset.mimeType || 'image/jpeg').toLowerCase();

        if (!ALLOWED_TYPES.includes(mimeType)) {
          showError('Only JPG, JPEG, PNG and WEBP images are allowed.');
          return;
        }

        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
          showError(`${asset.fileName || 'Image'} is larger than 5MB.`);
          return;
        }

        valid.push({
          uri: asset.uri,
          name: asset.fileName || `product-${Date.now()}-${index}.jpg`,
          type: mimeType,
        });
      });

      setNewImages((previous) => [...previous, ...valid]);
    } catch (err) {
      console.error('IMAGE PICKER ERROR:', err);
      showError('Unable to select image.');
    }
  };

  const removeExistingImage = (index: number) => {
    setImages((previous) => previous.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((previous) => previous.filter((_, i) => i !== index));
  };

  const makePrimaryImage = (index: number) => {
    setImages((previous) => {
      if (index === 0) return previous;

      const copy = [...previous];
      const selected = copy.splice(index, 1)[0];
      copy.unshift(selected);

      return copy;
    });
  };

  const uploadNewImages = async (token: string, merchantId: number) => {
    const uploadedUrls: string[] = [];

    for (let index = 0; index < newImages.length; index++) {
      const image = newImages[index];

      const imageFormData = new FormData();

      imageFormData.append('image', {
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as any);

      const response = await fetch(
        `${API_BASE_URL}/api/products/upload-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-user-id': String(merchantId),
          },
          body: imageFormData,
        }
      );

      const text = await response.text();
      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        console.error('Image upload returned non-JSON:', text);
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Image ${index + 1} upload failed (${response.status})`
        );
      }

      if (data?.success === false) {
        throw new Error(data?.message || `Image ${index + 1} upload failed.`);
      }

      const uploadedUrl = data?.image || data?.imageUrl || data?.url || data?.path;

      if (!uploadedUrl) {
        throw new Error(
          `Image ${index + 1} uploaded but server did not return an image URL.`
        );
      }

      uploadedUrls.push(uploadedUrl);
    }

    return uploadedUrls;
  };

  /* =====================================================
     VARIANTS
  ===================================================== */

  const updateVariant = (index: number, field: string, value: any) => {
    setVariants((previous) =>
      previous.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const updateVariantAttribute = (index: number, key: string, value: string) => {
    setVariants((previous) =>
      previous.map((item, i) =>
        i === index
          ? { ...item, attributes: { ...(item.attributes || {}), [key]: value } }
          : item
      )
    );
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async () => {
    if (saving) return;

    setError('');

    if (!formData.name.trim()) return showError('Product name is required.');
    if (!formData.description.trim())
      return showError('Product description is required.');
    if (!formData.sizeFit.trim())
      return showError('Size & Fit information is required.');
    if (!formData.materialCare.trim())
      return showError('Material & Care information is required.');
    if (totalImages === 0)
      return showError('Please keep at least one product image.');
    if (totalImages > MAX_IMAGES)
      return showError(`Maximum ${MAX_IMAGES} product images are allowed.`);

    try {
      setSaving(true);

      const { token, merchantId } = await getMerchantAuth();

      /* Upload new images */

      let uploadedNewUrls: string[] = [];

      if (newImages.length > 0) {
        uploadedNewUrls = await uploadNewImages(token, merchantId);
      }

      /* Existing + new images (first = primary) */

      const finalImageUrls = [
        ...images.map((image) => image.url),
        ...uploadedNewUrls.map((url) => resolveImageUrl(url)),
      ].filter(Boolean);

      if (finalImageUrls.length === 0) {
        throw new Error('No product images available.');
      }

      /* Prepare variants */

      const productVariants = variants.map((variant) => {
        const variantPrice = Number(variant.price);
        const discountPrice = Number(
          variant.discount_price ?? variant.discountPrice
        );
        const variantStock = Number(variant.stock);

        return {
          ...variant,
          attributes: variant.attributes || {},
          price: Number.isFinite(variantPrice) ? variantPrice : 0,
          discount_price:
            Number.isFinite(discountPrice) && discountPrice > 0
              ? discountPrice
              : null,
          stock: Number.isFinite(variantStock) ? variantStock : 0,
          sku: variant.sku ? String(variant.sku).trim() : null,
          available:
            variant.available !== undefined ? Boolean(variant.available) : true,
        };
      });

      await onUpdate({
        merchant_id: merchantId,
        name: formData.name.trim(),
        category: formData.category,
        product_type: formData.productType,
        description: formData.description.trim(),
        size_fit: formData.sizeFit.trim(),
        material_care: formData.materialCare.trim(),
        brand: formData.brand.trim(),
        gst_rate: Number(formData.gstRate || 0),
        image: finalImageUrls[0],
        product_images: finalImageUrls,
        product_details: productDetails,
        product_variants: productVariants,
      });
    } catch (err: any) {
      console.error('Edit product error:', err);
      showError(err?.message || 'Unable to update product.');
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     SMALL UI HELPERS
  ===================================================== */

  const textField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: {
      required?: boolean;
      multiline?: boolean;
      keyboardType?: 'default' | 'numeric' | 'decimal-pad';
      placeholder?: string;
    } = {}
  ) => (
    <View style={formStyles.group}>
      <Text style={formStyles.label}>
        {label}
        {options.required ? ' *' : ''}
      </Text>
      <TextInput
        style={[formStyles.input, options.multiline && formStyles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={options.placeholder}
        placeholderTextColor="#a1a1aa"
        multiline={options.multiline}
        textAlignVertical={options.multiline ? 'top' : 'center'}
        keyboardType={options.keyboardType || 'default'}
        editable={!saving}
      />
    </View>
  );

  const detailKeys = Object.keys(productDetails);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={formStyles.safeArea}>
        <KeyboardAvoidingView
          style={formStyles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollRef}
            style={formStyles.flex}
            contentContainerStyle={formStyles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}

            <View style={formStyles.header}>
              <TouchableOpacity
                style={formStyles.backButton}
                onPress={onCancel}
                disabled={saving}
              >
                <Text style={formStyles.backText}>←</Text>
              </TouchableOpacity>

              <View style={formStyles.flex}>
                <Text style={formStyles.eyebrow}>MERCHANT</Text>
                <Text style={formStyles.title}>Edit Product</Text>
                <Text style={formStyles.subtitle}>
                  Update product information, specifications and images.
                </Text>
              </View>
            </View>

            {error ? (
              <View style={formStyles.errorBox}>
                <Text style={formStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* PRODUCT INFORMATION */}

            <View style={formStyles.card}>
              <Text style={formStyles.cardTitle}>Product Information</Text>
              <Text style={formStyles.cardSubtitle}>
                Update the basic information about your product.
              </Text>

              {textField('Product Name', formData.name, (v) => handleChange('name', v), {
                required: true,
                placeholder: 'Enter product name',
              })}
              {textField(
                'Product Description',
                formData.description,
                (v) => handleChange('description', v),
                {
                  required: true,
                  multiline: true,
                  placeholder: 'Enter detailed product description...',
                }
              )}
              {textField('Category', formData.category, (v) => handleChange('category', v), {
                required: true,
              })}
              {textField(
                'Product Type',
                formData.productType,
                (v) => handleChange('productType', v),
                { required: true }
              )}
              {textField('Brand', formData.brand, (v) => handleChange('brand', v), {
                placeholder: 'Enter brand name',
              })}
              {textField('GST Rate (%)', formData.gstRate, (v) => handleChange('gstRate', v), {
                keyboardType: 'decimal-pad',
              })}
              {textField('Size & Fit', formData.sizeFit, (v) => handleChange('sizeFit', v), {
                required: true,
                placeholder: 'e.g. Regular fit, M/L/XL',
              })}
              {textField(
                'Material & Care',
                formData.materialCare,
                (v) => handleChange('materialCare', v),
                {
                  required: true,
                  multiline: true,
                  placeholder: 'Enter material and care instructions...',
                }
              )}
            </View>

            {/* PRODUCT SPECIFIC DETAILS */}

            {detailKeys.length > 0 ? (
              <View style={formStyles.card}>
                <Text style={formStyles.cardTitle}>
                  {formData.productType} Details
                </Text>
                <Text style={formStyles.cardSubtitle}>
                  Update product-specific specifications.
                </Text>

                {detailKeys.map((key) =>
                  textField(
                    prettyLabel(key),
                    String(productDetails[key] ?? ''),
                    (v) => handleDetailChange(key, v)
                  )
                )}
              </View>
            ) : null}

            {/* PRODUCT IMAGES */}

            <View style={formStyles.card}>
              <Text style={formStyles.cardTitle}>Product Images</Text>
              <Text style={formStyles.cardSubtitle}>
                Manage your product images. The first image will be the primary
                product image.
              </Text>

              <TouchableOpacity
                style={[
                  formStyles.uploadBox,
                  totalImages >= MAX_IMAGES && formStyles.disabled,
                ]}
                onPress={handleAddImages}
                disabled={saving || totalImages >= MAX_IMAGES}
              >
                <Text style={formStyles.uploadPlus}>+</Text>
                <Text style={formStyles.uploadTitle}>
                  {totalImages >= MAX_IMAGES
                    ? 'Maximum Images Added'
                    : 'Add Product Images'}
                </Text>
                <Text style={formStyles.uploadHint}>
                  JPG, PNG, WEBP up to 5MB • {totalImages}/{MAX_IMAGES} images
                </Text>
              </TouchableOpacity>

              <View style={formStyles.thumbGrid}>
                {images.map((image, index) => (
                  <View key={image.id} style={formStyles.thumbCard}>
                    <Image source={{ uri: image.url }} style={formStyles.thumbImage} />

                    {index === 0 ? (
                      <View style={formStyles.primaryBadge}>
                        <Text style={formStyles.primaryBadgeText}>Primary</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={formStyles.makePrimary}
                        onPress={() => makePrimaryImage(index)}
                        disabled={saving}
                      >
                        <Text style={formStyles.makePrimaryText}>Make Primary</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={formStyles.thumbRemove}
                      onPress={() => removeExistingImage(index)}
                      disabled={saving}
                    >
                      <Text style={formStyles.thumbRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {newImages.map((image, index) => {
                  const finalIndex = images.length + index;

                  return (
                    <View key={`new-${index}`} style={formStyles.thumbCard}>
                      <Image source={{ uri: image.uri }} style={formStyles.thumbImage} />

                      <View style={formStyles.primaryBadge}>
                        <Text style={formStyles.primaryBadgeText}>
                          {finalIndex === 0 ? 'Primary' : 'New'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={formStyles.thumbRemove}
                        onPress={() => removeNewImage(index)}
                        disabled={saving}
                      >
                        <Text style={formStyles.thumbRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* PRODUCT VARIANTS */}

            {variants.length > 0 ? (
              <View style={formStyles.card}>
                <Text style={formStyles.cardTitle}>Product Variants</Text>
                <Text style={formStyles.cardSubtitle}>
                  Update your existing product variants.
                </Text>

                {variants.map((variant, index) => (
                  <View key={index} style={formStyles.variantCard}>
                    <Text style={formStyles.variantTitle}>Variant {index + 1}</Text>

                    {Object.entries(variant.attributes || {}).map(([key, value]) =>
                      textField(prettyLabel(key), String(value ?? ''), (v) =>
                        updateVariantAttribute(index, key, v)
                      )
                    )}

                    {textField(
                      'Variant Price',
                      String(variant.price ?? ''),
                      (v) => updateVariant(index, 'price', v),
                      { keyboardType: 'decimal-pad' }
                    )}

                    {textField(
                      'Discount Price',
                      String(variant.discount_price ?? variant.discountPrice ?? ''),
                      (v) => updateVariant(index, 'discount_price', v),
                      { keyboardType: 'decimal-pad' }
                    )}

                    {textField(
                      'Variant Stock',
                      String(variant.stock ?? ''),
                      (v) => updateVariant(index, 'stock', v),
                      { keyboardType: 'numeric' }
                    )}

                    {formData.productType === 'Smartphone'
                      ? textField('SKU', String(variant.sku ?? ''), (v) =>
                          updateVariant(index, 'sku', v)
                        )
                      : null}

                    <View style={formStyles.switchRow}>
                      <Text style={formStyles.label}>Available for sale</Text>
                      <Switch
                        value={Boolean(variant.available)}
                        onValueChange={(v) => updateVariant(index, 'available', v)}
                        trackColor={{ false: '#d4d4d8', true: '#c4b5fd' }}
                        thumbColor={variant.available ? '#7c3aed' : '#f4f4f5'}
                        disabled={saving}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* ACTIONS */}

            <View style={formStyles.actions}>
              <TouchableOpacity
                style={formStyles.cancelButton}
                onPress={onCancel}
                disabled={saving}
              >
                <Text style={formStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[formStyles.saveButton, saving && formStyles.disabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={formStyles.saveText}>  Updating Product...</Text>
                  </>
                ) : (
                  <Text style={formStyles.saveText}>Update Product</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/* =====================================================
   STYLES
===================================================== */

const formStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fb' },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 2,
  },
  backText: { color: '#27272a', fontSize: 24 },
  eyebrow: { color: '#7c3aed', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#18181b', fontSize: 24, fontWeight: '800', marginTop: 1 },
  subtitle: { color: '#71717a', fontSize: 11, marginTop: 3 },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: { color: '#18181b', fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: '#71717a', fontSize: 10, marginTop: 2 },

  group: { marginTop: 15 },
  label: { color: '#27272a', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: '#18181b',
    fontSize: 12,
  },
  textArea: { minHeight: 95, paddingTop: 11 },

  uploadBox: {
    marginTop: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c4b5fd',
    borderRadius: 12,
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    paddingVertical: 18,
  },
  uploadPlus: { color: '#7c3aed', fontSize: 28, fontWeight: '700' },
  uploadTitle: { color: '#5b21b6', fontSize: 13, fontWeight: '800', marginTop: 2 },
  uploadHint: { color: '#7c3aed', fontSize: 9, marginTop: 4 },

  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  thumbCard: {
    width: 100,
    height: 110,
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
  thumbRemoveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  primaryBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  makePrimary: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  makePrimaryText: { color: '#fff', fontSize: 8, fontWeight: '800' },

  variantCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 14,
    backgroundColor: '#fafafa',
    padding: 13,
  },
  variantTitle: { color: '#18181b', fontSize: 14, fontWeight: '800' },
  switchRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#3f3f46', fontSize: 12, fontWeight: '800' },
  saveButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});

/* =====================================================
   PART 3: MERCHANT PRODUCTS SCREEN
===================================================== */


export default function MerchantProducts() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [storeName, setStoreName] = useState('Your Store');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<any>(null);

  /* =====================================================
     FETCH PRODUCTS
  ===================================================== */

  const fetchProducts = useCallback(async () => {
    try {
      setError('');

      const { token, merchantId, user } = await getMerchantAuth();

      setStoreName(
        user?.store_name || user?.business_name || user?.name || 'Your Store'
      );

      const response = await fetch(
        `${API_BASE_URL}/api/products/merchant/${merchantId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-user-id': String(merchantId),
            'Content-Type': 'application/json',
          },
        }
      );

      const text = await response.text();
      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        console.error('Products API returned non-JSON:', text);
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || `Failed to load products (${response.status})`
        );
      }

      const productList = data?.products || data?.data || [];

      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err?.message || 'Unable to load products.');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchProducts();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchProducts]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchProducts();
    } finally {
      setRefreshing(false);
    }
  };

  /* =====================================================
     CATEGORIES + FILTER (same as web)
  ===================================================== */

  const categories: string[] = [
    'All',
    ...Array.from(
      new Set(products.map((product) => product.category).filter(Boolean))
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      String(product.name || '').toLowerCase().includes(searchText) ||
      String(product.brand || '').toLowerCase().includes(searchText) ||
      String(product.product_type || '').toLowerCase().includes(searchText);

    const matchesCategory =
      categoryFilter === 'All' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  const handleDelete = (product: any) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const productId = getProductId(product);

            try {
              setError('');
              setDeleteLoading(productId);

              if (!productId) {
                throw new Error('Product ID not found.');
              }

              const { token, merchantId } = await getMerchantAuth();

              const response = await fetch(
                `${API_BASE_URL}/api/products/${productId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-user-id': String(merchantId),
                  },
                  body: JSON.stringify({ merchant_id: merchantId }),
                }
              );

              const text = await response.text();
              let data: any = {};

              try {
                data = JSON.parse(text);
              } catch {
                console.error('Delete API returned non-JSON:', text);
              }

              if (!response.ok || data?.success === false) {
                throw new Error(
                  data?.message ||
                    `Failed to delete product (${response.status})`
                );
              }

              setProducts((previous) =>
                previous.filter((item) => getProductId(item) !== productId)
              );

              Alert.alert('Deleted', 'Product deleted successfully.');
            } catch (err: any) {
              console.error('Delete product error:', err);
              setError(err?.message || 'Unable to delete product.');
            } finally {
              setDeleteLoading(null);
            }
          },
        },
      ]
    );
  };

  /* =====================================================
     UPDATE PRODUCT (called by EditProductForm)
     Throws an Error when the update fails.
  ===================================================== */

  const handleUpdateProduct = async (payload: any) => {
    if (!editingProduct) return;

    const productId = getProductId(editingProduct);

    if (!productId) {
      throw new Error('Product ID not found.');
    }

    const { token, merchantId } = await getMerchantAuth();

    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-user-id': String(merchantId),
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = {};

    try {
      data = JSON.parse(text);
    } catch {
      console.error('Update API returned non-JSON:', text);
    }

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message || `Failed to update product (${response.status})`
      );
    }

    const updatedProduct = data?.product || data?.data || data;

    setProducts((previous) =>
      previous.map((item) =>
        getProductId(item) === productId ? { ...item, ...updatedProduct } : item
      )
    );

    setEditingProduct(null);

    Alert.alert('Success', 'Product updated successfully.');
  };

  /* =====================================================
     STOCK BADGE
  ===================================================== */

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', background: '#fee2e2', text: '#dc2626' };
    }

    if (stock <= 5) {
      return {
        label: `Low Stock · ${stock}`,
        background: '#fef3c7',
        text: '#d97706',
      };
    }

    return {
      label: `Stock · ${stock}`,
      background: '#dcfce7',
      text: '#16a34a',
    };
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7c3aed"
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>MERCHANT</Text>
              <Text style={styles.title}>My Products</Text>
              <Text style={styles.subtitle}>Manage products in your store</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/merchant/add-product' as any)}
          >
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* ERROR */}

        {error !== '' && (
          <View style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STORE SUMMARY */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>🏪</Text>
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryStore} numberOfLines={1}>
              {storeName}
            </Text>
            <Text style={styles.summaryProducts}>
              {products.length} {products.length === 1 ? 'product' : 'products'}{' '}
              in your store
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#a1a1aa"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORY FILTER */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((category) => {
            const selected = categoryFilter === category;

            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategoryFilter(category)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* RESULT COUNT */}

        <Text style={styles.filterResult}>
          Showing <Text style={styles.bold}>{filteredProducts.length}</Text> of{' '}
          <Text style={styles.bold}>{products.length}</Text> products
        </Text>

        {/* PRODUCTS */}

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📦</Text>
            </View>

            <Text style={styles.emptyTitle}>No products found</Text>

            <Text style={styles.emptyDescription}>
              {products.length === 0
                ? "You haven't added any products yet."
                : 'Try changing your search or category filter.'}
            </Text>

            {products.length === 0 && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => router.push('/merchant/add-product' as any)}
              >
                <Text style={styles.emptyAddButtonText}>
                  + Add Your First Product
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProducts.map((product) => {
            const productId = getProductId(product);
            const price = getProductPrice(product);
            const originalPrice = getOriginalPrice(product);
            const discount = getDiscount(product);
            const stock = getStock(product);
            const stockStatus = getStockStatus(stock);
            const imageUrl = getProductImages(product)[0];

            return (
              <View key={String(productId)} style={styles.productCard}>
                {/* IMAGE */}

                <View style={styles.productImageContainer}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImage}>
                      <Text style={styles.noImageText}>📦</Text>
                    </View>
                  )}

                  {discount > 0 && (
                    <View style={styles.imageDiscount}>
                      <Text style={styles.imageDiscountText}>{discount}% OFF</Text>
                    </View>
                  )}
                </View>

                {/* DETAILS */}

                <View style={styles.productDetails}>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {product.category || 'PRODUCT'}
                  </Text>

                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name || 'Unnamed Product'}
                  </Text>

                  <Text style={styles.productBrand} numberOfLines={1}>
                    {product.brand || 'No Brand'}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(price)}</Text>

                    {originalPrice && originalPrice > price ? (
                      <Text style={styles.originalPrice}>
                        {formatPrice(originalPrice)}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.stockBadge,
                      { backgroundColor: stockStatus.background },
                    ]}
                  >
                    <Text style={[styles.stockText, { color: stockStatus.text }]}>
                      {stockStatus.label}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        setError('');
                        setEditingProduct(product);
                      }}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      activeOpacity={0.8}
                      disabled={deleteLoading === productId}
                      onPress={() => handleDelete(product)}
                    >
                      {deleteLoading === productId ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Text style={styles.deleteButtonText}>🗑 Delete</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* EDIT PRODUCT */}

      {editingProduct ? (
        <EditProductForm
          key={String(getProductId(editingProduct))}
          product={editingProduct}
          onCancel={() => setEditingProduct(null)}
          onUpdate={handleUpdateProduct}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fb' },
  container: { flex: 1, backgroundColor: '#f7f7fb' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },

  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { flex: 1 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 2,
  },
  backButtonText: { fontSize: 24, color: '#27272a', marginTop: -2 },
  eyebrow: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: { color: '#18181b', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#71717a', fontSize: 11, marginTop: 3 },
  addButton: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  /* ERROR */
  errorCard: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorContent: { flex: 1 },
  errorTitle: { color: '#be123c', fontSize: 13, fontWeight: '800' },
  errorText: { color: '#9f1239', fontSize: 11, marginTop: 3 },
  retryButton: {
    backgroundColor: '#fff',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  retryButtonText: { color: '#be123c', fontSize: 11, fontWeight: '800' },

  /* SUMMARY */
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  summaryIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconText: { fontSize: 22 },
  summaryInfo: { flex: 1, marginLeft: 12 },
  summaryStore: { color: '#18181b', fontSize: 15, fontWeight: '800' },
  summaryProducts: { color: '#71717a', fontSize: 11, marginTop: 3 },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: { color: '#52525b', fontSize: 22 },

  /* SEARCH + FILTER */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: { color: '#a1a1aa', fontSize: 20, marginRight: 8 },
  searchInput: { flex: 1, color: '#18181b', fontSize: 13 },
  searchClear: { color: '#71717a', fontSize: 22, paddingHorizontal: 4 },
  chipRow: { paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
  },
  chipSelected: { borderColor: '#7c3aed', backgroundColor: '#7c3aed' },
  chipText: { color: '#52525b', fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: '#fff' },
  filterResult: { color: '#71717a', fontSize: 11, marginBottom: 12 },
  bold: { fontWeight: '800', color: '#18181b' },

  /* EMPTY */
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 2,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 21,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyIconText: { fontSize: 31 },
  emptyTitle: { color: '#18181b', fontSize: 18, fontWeight: '800' },
  emptyDescription: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 280,
  },
  emptyAddButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 18,
  },
  emptyAddButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  /* PRODUCT CARD */
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 12,
    marginBottom: 13,
    flexDirection: 'row',
    elevation: 2,
  },
  productImageContainer: {
    width: 105,
    height: 135,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
  },
  productImage: { width: '100%', height: '100%' },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noImageText: { fontSize: 31 },
  imageDiscount: {
    position: 'absolute',
    left: 5,
    top: 5,
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imageDiscountText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  productDetails: { flex: 1, marginLeft: 12, minWidth: 0 },
  categoryText: {
    color: '#7c3aed',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: { color: '#18181b', fontSize: 15, fontWeight: '800', lineHeight: 19 },
  productBrand: { color: '#71717a', fontSize: 10, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  price: { color: '#18181b', fontSize: 16, fontWeight: '800' },
  originalPrice: {
    color: '#a1a1aa',
    fontSize: 10,
    textDecorationLine: 'line-through',
    marginLeft: 7,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 6,
  },
  stockText: { fontSize: 9, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', marginTop: 9, gap: 7 },
  editButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { color: '#6d28d9', fontSize: 10, fontWeight: '800' },
  deleteButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { color: '#dc2626', fontSize: 10, fontWeight: '800' },

  /* LOADING */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: { color: '#71717a', fontSize: 13, marginTop: 12 },
  bottomSpace: { height: 25 },
});
