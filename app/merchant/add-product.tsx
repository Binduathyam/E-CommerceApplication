import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

type FormData = {
  name: string;
  category: string;
  description: string;
  sizeFit: string;
  materialCare: string;
  price: string;
  originalPrice: string;
  discount: string;
  stock: string;
  brand: string;
};

const categories = [
  'Electronics',
  'Fashion',
  'Home',
  'Beauty',
  'Sports',
  'Accessories',
];

export default function AddProduct() {
  const router = useRouter();

  // =====================================================
  // FORM
  // =====================================================

  const [formData, setFormData] =
    useState<FormData>({
      name: '',
      category: 'Electronics',
      description: '',
      sizeFit: '',
      materialCare: '',
      price: '',
      originalPrice: '',
      discount: '',
      stock: '',
      brand: '',
    });

  // =====================================================
  // IMAGE
  // =====================================================

  const [imageUri, setImageUri] =
    useState<string | null>(null);

  const [imageName, setImageName] =
    useState('');

  const [imageMimeType, setImageMimeType] =
    useState('image/jpeg');

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // UPDATE FIELD
  // =====================================================

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // =====================================================
  // PICK IMAGE
  // =====================================================

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo access to select a product image.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,

          aspect: [1, 1],

          quality: 0.8,
        });

      if (
        result.canceled ||
        !result.assets ||
        result.assets.length === 0
      ) {
        return;
      }

      const asset =
        result.assets[0];

      console.log(
        'SELECTED IMAGE:',
        asset
      );

      // =================================================
      // TYPE
      // =================================================

      const mimeType =
        asset.mimeType ||
        'image/jpeg';

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];

      if (
        !allowedTypes.includes(
          mimeType.toLowerCase()
        )
      ) {
        Alert.alert(
          'Invalid Image',
          'Only JPG, JPEG, PNG and WEBP images are allowed.'
        );
        return;
      }

      // =================================================
      // SIZE
      // =================================================

      if (
        asset.fileSize &&
        asset.fileSize >
          5 * 1024 * 1024
      ) {
        Alert.alert(
          'Image Too Large',
          'Image size must be less than 5 MB.'
        );
        return;
      }

      // =================================================
      // SAVE
      // =================================================

      setImageUri(asset.uri);

      setImageName(
        asset.fileName ||
          `product-${Date.now()}.jpg`
      );

      setImageMimeType(
        mimeType
      );
    } catch (error) {
      console.error(
        'IMAGE PICKER ERROR:',
        error
      );

      Alert.alert(
        'Image Error',
        'Unable to select image.'
      );
    }
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = () => {
    setImageUri(null);
    setImageName('');
    setImageMimeType('image/jpeg');
  };

  // =====================================================
  // GET LOGGED IN MERCHANT
  // =====================================================

  const getMerchant = async () => {
    const storedUser =
      await AsyncStorage.getItem(
        'loggedInUser'
      );

    if (!storedUser) {
      return null;
    }

    try {
      const user =
        JSON.parse(storedUser);

      if (!user?.id) {
        return null;
      }

      return user;
    } catch (error) {
      console.error(
        'MERCHANT USER PARSE ERROR:',
        error
      );

      return null;
    }
  };

  // =====================================================
  // HANDLE ADD PRODUCT
  // =====================================================

  const handleAddProduct = async () => {
    // ===================================================
    // VALIDATION
    // ===================================================

    if (!formData.name.trim()) {
      Alert.alert(
        'Required',
        'Product name is required.'
      );
      return;
    }

    if (!formData.category.trim()) {
      Alert.alert(
        'Required',
        'Category is required.'
      );
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert(
        'Required',
        'Product description is required.'
      );
      return;
    }

    if (!formData.sizeFit.trim()) {
      Alert.alert(
        'Required',
        'Size & Fit information is required.'
      );
      return;
    }

    if (!formData.materialCare.trim()) {
      Alert.alert(
        'Required',
        'Material & Care information is required.'
      );
      return;
    }

    if (!formData.price.trim()) {
      Alert.alert(
        'Required',
        'Selling price is required.'
      );
      return;
    }

    if (
      formData.stock.trim() === ''
    ) {
      Alert.alert(
        'Required',
        'Stock quantity is required.'
      );
      return;
    }

    if (!imageUri) {
      Alert.alert(
        'Required',
        'Please select a product image.'
      );
      return;
    }

    // ===================================================
    // NUMBER VALUES
    // ===================================================

    const price =
      Number(formData.price);

    const stock =
      Number(formData.stock);

    const originalPrice =
      formData.originalPrice.trim()
        ? Number(
            formData.originalPrice
          )
        : price;

    const discount =
      formData.discount.trim()
        ? Number(
            formData.discount
          )
        : 0;

    // ===================================================
    // NUMBER VALIDATION
    // ===================================================

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Enter a valid selling price.'
      );
      return;
    }

    if (
      Number.isNaN(originalPrice) ||
      originalPrice < 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Enter a valid original price.'
      );
      return;
    }

    if (
      Number.isNaN(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      Alert.alert(
        'Invalid Discount',
        'Discount must be between 0 and 100.'
      );
      return;
    }

    if (
      Number.isNaN(stock) ||
      stock < 0
    ) {
      Alert.alert(
        'Invalid Stock',
        'Enter a valid stock quantity.'
      );
      return;
    }

    // ===================================================
    // GET MERCHANT
    // ===================================================

    const merchant =
      await getMerchant();

    if (!merchant?.id) {
      Alert.alert(
        'Login Required',
        'Merchant information was not found. Please login again.'
      );
      return;
    }

    // ===================================================
    // TOKEN
    // ===================================================

    const token =
      await AsyncStorage.getItem(
        'authToken'
      );

    if (!token) {
      Alert.alert(
        'Login Required',
        'Your login session has expired. Please login again.'
      );
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // STEP 1
      // UPLOAD IMAGE
      // =================================================

      const imageFormData =
        new FormData();

      const cleanUri =
        imageUri.split('?')[0];

      const uriParts =
        cleanUri.split('.');

      let extension =
        uriParts[
          uriParts.length - 1
        ]?.toLowerCase() ||
        'jpg';

      if (
        extension === 'jpeg'
      ) {
        extension = 'jpg';
      }

      let type =
        imageMimeType;

      if (
        !type ||
        type === 'application/octet-stream'
      ) {
        type =
          extension === 'png'
            ? 'image/png'
            : extension === 'webp'
              ? 'image/webp'
              : 'image/jpeg';
      }

      imageFormData.append(
        'image',
        {
          uri: imageUri,

          name:
            imageName ||
            `product-${Date.now()}.${extension}`,

          type,
        } as any
      );

      console.log(
        'UPLOADING PRODUCT IMAGE...'
      );

      const uploadResponse =
        await fetch(
          `${API_BASE_URL}/api/products/upload-image`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(merchant.id),
            },

            body:
              imageFormData,
          }
        );

      const uploadText =
        await uploadResponse.text();

      let uploadData: any = {};

      try {
        uploadData =
          JSON.parse(
            uploadText
          );
      } catch {
        console.error(
          'IMAGE UPLOAD NON JSON:',
          uploadText
        );
      }

      console.log(
        'IMAGE UPLOAD RESPONSE:',
        uploadData
      );

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData?.message ||
            `Image upload failed (${uploadResponse.status})`
        );
      }

      if (
        uploadData?.success === false
      ) {
        throw new Error(
          uploadData?.message ||
            'Image upload failed.'
        );
      }

      const uploadedImageUrl =
        uploadData?.image ||
        uploadData?.imageUrl ||
        uploadData?.url;

      if (!uploadedImageUrl) {
        throw new Error(
          'Image uploaded but server did not return image URL.'
        );
      }

      console.log(
        'UPLOADED IMAGE URL:',
        uploadedImageUrl
      );

      // =================================================
      // STEP 2
      // CREATE PRODUCT
      // =================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/products`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(merchant.id),
            },

            body:
              JSON.stringify({
                merchant_id:
                  Number(
                    merchant.id
                  ),

                name:
                  formData.name.trim(),

                category:
                  formData.category.trim(),

                description:
                  formData.description.trim(),

                size_fit:
                  formData.sizeFit.trim(),

                material_care:
                  formData.materialCare.trim(),

                price,

                original_price:
                  originalPrice,

                discount,

                stock,

                brand:
                  formData.brand.trim(),

                image:
                  uploadedImageUrl,
              }),
          }
        );

      const responseText =
        await response.text();

      let data: any = {};

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch {
        console.error(
          'PRODUCT API NON JSON:',
          responseText
        );
      }

      console.log(
        'ADD PRODUCT RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to add product (${response.status})`
        );
      }

      if (
        data?.success === false
      ) {
        throw new Error(
          data?.message ||
            'Failed to add product.'
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        'Product Added',
        'Product added successfully.',
        [
          {
            text: 'OK',

            onPress: () => {
              router.replace(
                '/merchant/products'
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'ADD PRODUCT ERROR:',
        error
      );

      Alert.alert(
        'Failed',
        error?.message ||
          'Unable to add product.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
  style={styles.keyboard}
  behavior={
    Platform.OS === 'ios'
      ? 'padding'
      : 'height'
  }
  keyboardVerticalOffset={
    Platform.OS === 'ios' ? 0 : 20
  }
><ScrollView
  style={styles.container}
  contentContainerStyle={
    styles.content
  }
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
  showsVerticalScrollIndicator={false}
>
          {/* =================================================
              HEADER
          ================================================= */}

          <View
            style={styles.header}
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
              disabled={loading}
            >
              <Text
                style={
                  styles.backText
                }
              >
                ←
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                MERCHANT
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                Add Product
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Add a new product to your store
              </Text>
            </View>
          </View>

          {/* =================================================
              PRODUCT INFORMATION
          ================================================= */}

          <View
            style={styles.card}
          >
            <View
              style={
                styles.cardHeader
              }
            >
              <View
                style={
                  styles.stepCircle
                }
              >
                <Text
                  style={
                    styles.stepText
                  }
                >
                  1
                </Text>
              </View>

              <View>
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Product Information
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Enter the basic details of your product.
                </Text>
              </View>
            </View>

            {/* PRODUCT NAME */}

            <View
              style={styles.group}
            >
              <Text
                style={styles.label}
              >
                Product Name *
              </Text>

              <TextInput
                style={styles.input}
                value={
                  formData.name
                }
                onChangeText={(value) =>
                  updateField(
                    'name',
                    value
                  )
                }
                placeholder="Enter product name"
                placeholderTextColor="#a1a1aa"
                editable={!loading}
              />
            </View>

            {/* CATEGORY */}

            <View
              style={styles.group}
            >
              <Text
                style={styles.label}
              >
                Category *
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.categoryRow
                }
              >
                {categories.map(
                  (category) => {
                    const selected =
                      formData.category ===
                      category;

                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryChip,
                          selected &&
                            styles.categoryChipSelected,
                        ]}
                        onPress={() =>
                          updateField(
                            'category',
                            category
                          )
                        }
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            selected &&
                              styles.categoryChipTextSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </ScrollView>
            </View>

            {/* BRAND */}

            <View
              style={styles.group}
            >
              <Text
                style={styles.label}
              >
                Brand
              </Text>

              <TextInput
                style={styles.input}
                value={
                  formData.brand
                }
                onChangeText={(value) =>
                  updateField(
                    'brand',
                    value
                  )
                }
                placeholder="Enter brand name"
                placeholderTextColor="#a1a1aa"
                editable={!loading}
              />
            </View>

            {/* DESCRIPTION */}

            <View
              style={styles.group}
            >
              <Text
                style={styles.label}
              >
                Product Description *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                value={
                  formData.description
                }
                onChangeText={(value) =>
                  updateField(
                    'description',
                    value
                  )
                }
                placeholder="Describe your product..."
                placeholderTextColor="#a1a1aa"
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* SIZE & FIT */}

            <View
              style={styles.group}
            >
              <Text
                style={styles.label}
              >
                Size & Fit *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.smallTextArea,
                ]}
                value={
                  formData.sizeFit
                }
                onChangeText={(value) =>
                  updateField(
                    'sizeFit',
                    value
                  )
                }
                placeholder="Enter size and fit information..."
                placeholderTextColor="#a1a1aa"
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* MATERIAL & CARE */}

            <View
              style={styles.group}
            >
              <Text
                style={styles.label}
              >
                Material & Care *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.smallTextArea,
                ]}
                value={
                  formData.materialCare
                }
                onChangeText={(value) =>
                  updateField(
                    'materialCare',
                    value
                  )
                }
                placeholder="Enter material and care instructions..."
                placeholderTextColor="#a1a1aa"
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </View>

          {/* =================================================
              PRICE & INVENTORY
          ================================================= */}

          <View
            style={styles.card}
          >
            <View
              style={
                styles.cardHeader
              }
            >
              <View
                style={
                  styles.stepCircle
                }
              >
                <Text
                  style={
                    styles.stepText
                  }
                >
                  2
                </Text>
              </View>

              <View>
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Price & Inventory
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Set pricing and available stock.
                </Text>
              </View>
            </View>

            {/* SELLING + ORIGINAL */}

            <View
              style={styles.row}
            >
              <View
                style={styles.half}
              >
                <Text
                  style={styles.label}
                >
                  Selling Price *
                </Text>

                <View
                  style={
                    styles.priceContainer
                  }
                >
                  <Text
                    style={
                      styles.currency
                    }
                  >
                    ₹
                  </Text>

                  <TextInput
                    style={
                      styles.priceInput
                    }
                    value={
                      formData.price
                    }
                    onChangeText={(value) =>
                      updateField(
                        'price',
                        value
                      )
                    }
                    placeholder="0"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="decimal-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              <View
                style={styles.half}
              >
                <Text
                  style={styles.label}
                >
                  Original Price
                </Text>

                <View
                  style={
                    styles.priceContainer
                  }
                >
                  <Text
                    style={
                      styles.currency
                    }
                  >
                    ₹
                  </Text>

                  <TextInput
                    style={
                      styles.priceInput
                    }
                    value={
                      formData.originalPrice
                    }
                    onChangeText={(value) =>
                      updateField(
                        'originalPrice',
                        value
                      )
                    }
                    placeholder="0"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="decimal-pad"
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* DISCOUNT + STOCK */}

            <View
              style={[
                styles.row,
                styles.rowMargin,
              ]}
            >
              <View
                style={styles.half}
              >
                <Text
                  style={styles.label}
                >
                  Discount %
                </Text>

                <View
                  style={
                    styles.priceContainer
                  }
                >
                  <TextInput
                    style={
                      styles.priceInput
                    }
                    value={
                      formData.discount
                    }
                    onChangeText={(value) =>
                      updateField(
                        'discount',
                        value
                      )
                    }
                    placeholder="0"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="numeric"
                    editable={!loading}
                  />

                  <Text
                    style={
                      styles.currency
                    }
                  >
                    %
                  </Text>
                </View>
              </View>

              <View
                style={styles.half}
              >
                <Text
                  style={styles.label}
                >
                  Stock Quantity *
                </Text>

                <TextInput
                  style={styles.input}
                  value={
                    formData.stock
                  }
                  onChangeText={(value) =>
                    updateField(
                      'stock',
                      value
                    )
                  }
                  placeholder="Enter stock quantity"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* =================================================
              PRODUCT IMAGE
          ================================================= */}

          <View
            style={styles.card}
          >
            <View
              style={
                styles.cardHeader
              }
            >
              <View
                style={
                  styles.stepCircle
                }
              >
                <Text
                  style={
                    styles.stepText
                  }
                >
                  3
                </Text>
              </View>

              <View>
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Product Image
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Select a product image from your device.
                </Text>
              </View>
            </View>

            {/* PICK IMAGE */}

            <TouchableOpacity
              style={
                styles.imagePicker
              }
              onPress={
                pickImage
              }
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.imagePickerIcon
                }
              >
                🖼️
              </Text>

              <View
                style={
                  styles.imagePickerContent
                }
              >
                <Text
                  style={
                    styles.imagePickerTitle
                  }
                >
                  Choose Product Image
                </Text>

                <Text
                  style={
                    styles.imagePickerSubtitle
                  }
                >
                  JPG, JPEG, PNG or WEBP • Maximum 5 MB
                </Text>
              </View>

              <Text
                style={
                  styles.imagePickerArrow
                }
              >
                ›
              </Text>
            </TouchableOpacity>

            {/* PREVIEW */}

            {imageUri ? (
              <View
                style={
                  styles.previewContainer
                }
              >
                <Image
                  source={{
                    uri: imageUri,
                  }}
                  style={
                    styles.previewImage
                  }
                  resizeMode="cover"
                />

                <View
                  style={
                    styles.previewFooter
                  }
                >
                  <View
                    style={
                      styles.previewInfo
                    }
                  >
                    <Text
                      style={
                        styles.previewLabel
                      }
                    >
                      Selected Image
                    </Text>

                    <Text
                      style={
                        styles.previewName
                      }
                      numberOfLines={1}
                    >
                      {imageName}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.removeButton
                    }
                    onPress={
                      removeImage
                    }
                    disabled={loading}
                  >
                    <Text
                      style={
                        styles.removeButtonText
                      }
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={
                  styles.emptyPreview
                }
              >
                <Text
                  style={
                    styles.emptyPreviewIcon
                  }
                >
                  📷
                </Text>

                <Text
                  style={
                    styles.emptyPreviewTitle
                  }
                >
                  Image Preview
                </Text>

                <Text
                  style={
                    styles.emptyPreviewSubtitle
                  }
                >
                  Select an image to preview it here
                </Text>
              </View>
            )}
          </View>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <View
            style={styles.actions}
          >
            <TouchableOpacity
              style={
                styles.cancelButton
              }
              onPress={() =>
                router.back()
              }
              disabled={loading}
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={
                handleAddProduct
              }
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Uploading...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.addButtonText
                  }
                >
                  Add Product
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={styles.bottomSpace}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },

  content: {
    padding: 16,
    paddingBottom: 80,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

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

  backText: {
    color: '#27272a',
    fontSize: 24,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  title: {
    color: '#18181b',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 1,
  },

  subtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 3,
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  stepText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '900',
  },

  cardTitle: {
    color: '#18181b',
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
  },

  // ===================================================
  // FORM
  // ===================================================

  group: {
    marginTop: 17,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  rowMargin: {
    marginTop: 17,
  },

  half: {
    width: '48%',
  },

  label: {
    color: '#27272a',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },

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

  textArea: {
    minHeight: 105,
    paddingTop: 11,
  },

  smallTextArea: {
    minHeight: 85,
    paddingTop: 11,
  },

  // ===================================================
  // CATEGORY
  // ===================================================

  categoryRow: {
    paddingVertical: 2,
    paddingRight: 10,
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#ffffff',
  },

  categoryChipSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },

  categoryChipText: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '700',
  },

  categoryChipTextSelected: {
    color: '#ffffff',
  },

  // ===================================================
  // PRICE
  // ===================================================

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

  currency: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '800',
  },

  priceInput: {
    flex: 1,
    color: '#18181b',
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 7,
  },

  // ===================================================
  // IMAGE
  // ===================================================

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

  imagePickerIcon: {
    fontSize: 27,
    marginRight: 11,
  },

  imagePickerContent: {
    flex: 1,
  },

  imagePickerTitle: {
    color: '#5b21b6',
    fontSize: 13,
    fontWeight: '800',
  },

  imagePickerSubtitle: {
    color: '#7c3aed',
    fontSize: 9,
    marginTop: 3,
  },

  imagePickerArrow: {
    color: '#7c3aed',
    fontSize: 28,
  },

  previewContainer: {
    marginTop: 13,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    overflow: 'hidden',
  },

  previewImage: {
    width: '100%',
    height: 230,
    backgroundColor: '#f4f4f5',
  },

  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
  },

  previewInfo: {
    flex: 1,
    paddingRight: 8,
  },

  previewLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
  },

  previewName: {
    color: '#18181b',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  removeButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },

  removeButtonText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
  },

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

  emptyPreviewIcon: {
    fontSize: 32,
  },

  emptyPreviewTitle: {
    color: '#52525b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },

  emptyPreviewSubtitle: {
    color: '#a1a1aa',
    fontSize: 9,
    marginTop: 4,
  },

  // ===================================================
  // ACTIONS
  // ===================================================

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#3f3f46',
    fontSize: 12,
    fontWeight: '800',
  },

  addButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  loadingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  disabledButton: {
    opacity: 0.65,
  },

  bottomSpace: {
    height: 20,
  },
});