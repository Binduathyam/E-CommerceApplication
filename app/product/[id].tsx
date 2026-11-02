import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

// =====================================================
// HELPERS (same logic as the web version)
// =====================================================

const parseJson = (value: any): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('JSON parse error:', error);
    return {};
  }
};

const imageFrom = (item: any): string | null => {
  if (typeof item === 'string') return item;
  return item?.image_url || item?.image || item?.url || null;
};

const formatDisplayKey = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const rupees = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getRelatedProductImage = (item: any): string | null => {
  if (Array.isArray(item?.product_images) && item.product_images.length > 0) {
    return imageFrom(item.product_images[0]);
  }
  return item?.image || null;
};

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  const value = Number(rating) || 0;

  return (
    <Text style={{ fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={{ color: star <= value ? '#f5a623' : '#d4d4d8' }}
        >
          ★
        </Text>
      ))}
    </Text>
  );
}

// =====================================================
// SCREEN
// =====================================================

export default function ProductDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { addToCart, setBuyNowItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  // ---------------- STATES ----------------

  const [product, setProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [adminRating, setAdminRating] = useState<number | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ---------------- FETCH PRODUCT ----------------

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/api/products/${productId}`
        );
        const data = await response.json();

        if (!response.ok || !data?.product) {
          throw new Error(data?.message || 'Product not found');
        }

        if (!cancelled) setProduct(data.product);
      } catch (err) {
        console.error('Product fetch error:', err);

        if (!cancelled) {
          setProduct(null);
          setError('Unable to load product details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ---------------- FETCH ALL PRODUCTS (for related products) ----------------

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        setProducts(list);
      } catch (err) {
        console.error('Related products fetch error:', err);
      }
    };

    fetchProducts();
  }, []);

  // ---------------- FETCH REVIEWS ----------------

  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/reviews/product/${productId}`
        );
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load product reviews');
        }

        const received = data.adminRating ?? data.admin_rating;

        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverageRating(Number(data.averageRating ?? data.average_rating ?? 0));
        setTotalReviews(Number(data.totalReviews ?? data.total_reviews ?? 0));
        setAdminRating(
          received !== null && received !== undefined ? Number(received) : null
        );
      } catch (err) {
        console.error('Product review error:', err);

        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
        setAdminRating(null);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  // ---------------- IMAGES ----------------

  const productImages = useMemo<string[]>(() => {
    if (!product) return [];

    let images: string[] = [];

    if (Array.isArray(product.product_images)) {
      images = product.product_images.map(imageFrom).filter(Boolean);
    }

    if (product.image && !images.includes(product.image)) {
      images.unshift(product.image);
    }

    return images.slice(0, 6);
  }, [product]);

  useEffect(() => {
    setSelectedImage(productImages.length > 0 ? productImages[0] : null);
  }, [productImages]);

  // ---------------- VARIANTS ----------------

  const productVariants = useMemo<any[]>(
    () =>
      Array.isArray(product?.product_variants) ? product.product_variants : [],
    [product]
  );

  // first available size is selected automatically
  useEffect(() => {
    if (!productVariants.length) {
      setSelectedSize(null);
      return;
    }

    const firstAvailable = productVariants.find((variant) => {
      const attributes = parseJson(variant.attributes);
      return attributes.size && Number(variant.stock || 0) > 0;
    });

    setSelectedSize(
      firstAvailable
        ? String(parseJson(firstAvailable.attributes).size)
        : null
    );
  }, [product?.id, productVariants]);

  // ---------------- RELATED PRODUCTS ----------------

  const relatedProducts = useMemo<any[]>(() => {
    if (!product || !Array.isArray(products)) return [];

    const currentId = String(product.id);

    const sameField = (field: 'brand' | 'category') =>
      products.filter((item) => {
        if (!item || String(item.id) === currentId) return false;
        if (!product[field] || !item[field]) return false;

        return (
          String(item[field]).trim().toLowerCase() ===
          String(product[field]).trim().toLowerCase()
        );
      });

    const combined = [...sameField('brand'), ...sameField('category')];

    const unique: any[] = [];
    const seen = new Set<string>();

    combined.forEach((item) => {
      const id = String(item.id);
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(item);
      }
    });

    return unique.slice(0, 8);
  }, [product, products]);

  // =====================================================
  // LOADING / ERROR
  // =====================================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =====================================================
  // SIZES
  // =====================================================

  const availableSizes: string[] = [];

  productVariants.forEach((variant) => {
    const attributes = parseJson(variant.attributes);

    if (attributes.size && !availableSizes.includes(String(attributes.size))) {
      availableSizes.push(String(attributes.size));
    }
  });

  const findVariantBySize = (size: string) =>
    productVariants.find(
      (variant) => String(parseJson(variant.attributes).size) === String(size)
    );

  const selectedVariant = selectedSize ? findVariantBySize(selectedSize) : null;

  // =====================================================
  // PRICE (same as web)
  // =====================================================

  const variantPrices = productVariants
    .map((variant) => Number(variant.discount_price ?? variant.price ?? 0))
    .filter((value) => value > 0);

  const defaultPrice =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : Number(product.price) || 0;

  const variantOriginalPrices = productVariants
    .map((variant) => Number(variant.price) || 0)
    .filter((value) => value > 0);

  const defaultOriginalPrice =
    variantOriginalPrices.length > 0
      ? Math.min(...variantOriginalPrices)
      : Number(
          product.original_price ||
            product.originalPrice ||
            product.mrp ||
            product.old_price ||
            0
        );

  const price = selectedVariant
    ? Number(
        selectedVariant.discount_price ?? selectedVariant.price ?? defaultPrice
      )
    : defaultPrice;

  const originalPrice = selectedVariant
    ? Number(selectedVariant.price || defaultOriginalPrice)
    : defaultOriginalPrice;

  const discountPercentage =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : Number(
          product.discount_percentage ||
            product.discountPercentage ||
            product.discount ||
            0
        );

  // =====================================================
  // STOCK
  // =====================================================

  const totalAvailableStock =
    productVariants.length > 0
      ? productVariants.reduce(
          (total, variant) => total + Number(variant.stock || 0),
          0
        )
      : Number(product.stock || 0);

  const selectedStock = selectedVariant
    ? Number(selectedVariant.stock || 0)
    : totalAvailableStock;

  const sizeRequiredButMissing =
    productVariants.length > 0 && availableSizes.length > 0 && !selectedSize;

  const canAddToCart =
    totalAvailableStock > 0 &&
    !sizeRequiredButMissing &&
    !(selectedVariant && selectedStock <= 0);

  const canBuyNow = canAddToCart;

  // =====================================================
  // DETAILS + RATING
  // =====================================================

  const dynamicDetails = parseJson(product.product_details);

  const displayRating = totalReviews > 0 ? averageRating : adminRating;

  // =====================================================
  // CART PRODUCT (same payload as web)
  // =====================================================

  const createCartProduct = () => ({
    id: String(product.id),
    name: String(product.name || ''),
    category: String(product.category || ''),
    image: selectedImage || productImages[0] || String(product.image || ''),

    price: Number(price),
    original_price: Number(originalPrice),

    gst_rate: Number(product.gst_rate ?? product.gstRate ?? 0),

    selected_size: selectedSize,
    variant_id: selectedVariant ? Number(selectedVariant.id) : null,

    stock: Number(selectedStock),
    quantity: 1,
  });

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleAddToCart = async () => {
    if (!canAddToCart || adding) return;

    try {
      setAdding(true);

      const cartProduct = createCartProduct();
      console.log('PRODUCT DETAILS → CART PRODUCT:', cartProduct);

      const added = await addToCart(cartProduct);

      if (!added) {
        Alert.alert(
          'Add to Cart Failed',
          'Unable to add product to cart. Please make sure you are logged in.'
        );
        return;
      }

      Alert.alert('Success', 'Product added to cart successfully!', [
        { text: 'Go to Cart', onPress: () => router.push('/cart' as any) },
        { text: 'Continue Shopping', style: 'cancel' },
      ]);
    } catch (err) {
      console.error('Add to cart error:', err);
      Alert.alert('Add to Cart Failed', 'Unable to add product to cart.');
    } finally {
      setAdding(false);
    }
  };

  // Same as web: checkout uses ONLY this product, the saved cart is untouched
  const handleBuyNow = () => {
    if (!canBuyNow || adding) return;

    const buyNowProduct = createCartProduct();
    console.log('BUY NOW PRODUCT:', buyNowProduct);

    setBuyNowItem(buyNowProduct);

    router.push('/checkout' as any);
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: String(product.id),
      name: String(product.name || ''),
      category: String(product.category || ''),
      price: Number(price),
      image: selectedImage || productImages[0] || String(product.image || ''),
    });
  };

  const inWishlist = isWishlisted(String(product.id));

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Product Details</Text>

          <TouchableOpacity style={styles.circleButton} onPress={handleWishlist}>
            <Text style={[styles.heart, inWishlist && styles.heartActive]}>
              {inWishlist ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= IMAGE GALLERY ================= */}

        <View style={styles.imageContainer}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>No Image Available</Text>
            </View>
          )}
        </View>

        {productImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
            style={styles.thumbnailScroll}
          >
            {productImages.map((image, index) => (
              <TouchableOpacity
                key={`${image}-${index}`}
                onPress={() => setSelectedImage(image)}
                style={[
                  styles.thumbnail,
                  selectedImage === image && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri: image }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ================= MAIN INFO ================= */}

        <View style={styles.content}>
          <Text style={styles.category}>{product.category || 'Product'}</Text>

          <Text style={styles.productName}>{product.name}</Text>

          {/* RATING */}

          <View style={styles.ratingRow}>
            {displayRating ? (
              <>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>
                    {Number(displayRating).toFixed(1)} ★
                  </Text>
                </View>

                <Text style={styles.ratingCount}>
                  {totalReviews > 0
                    ? `${totalReviews} ${totalReviews === 1 ? 'Review' : 'Reviews'}`
                    : 'Seller Rated'}
                </Text>
              </>
            ) : (
              <Text style={styles.ratingCount}>No reviews yet</Text>
            )}
          </View>

          {/* PRICE */}

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Special Price</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{rupees(price)}</Text>

              {originalPrice > price && (
                <Text style={styles.originalPrice}>{rupees(originalPrice)}</Text>
              )}

              {discountPercentage > 0 && (
                <Text style={styles.discountBadge}>
                  {discountPercentage}% OFF
                </Text>
              )}
            </View>

            <Text style={styles.taxText}>Inclusive of all taxes</Text>
          </View>

          {/* SIZE */}

          <View style={styles.section}>
            <View style={styles.sizeHeadingRow}>
              <Text style={styles.sectionHeading}>Select Size</Text>

              {availableSizes.length > 0 && (
                <Text style={styles.sizeGuide}>Size Guide</Text>
              )}
            </View>

            {availableSizes.length > 0 ? (
              <View style={styles.sizeRow}>
                {availableSizes.map((size) => {
                  const variant = findVariantBySize(size);
                  const outOfStock = !variant || Number(variant.stock) <= 0;
                  const active = selectedSize === size;

                  return (
                    <TouchableOpacity
                      key={size}
                      disabled={outOfStock}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.sizeOption,
                        active && styles.sizeOptionActive,
                        outOfStock && styles.sizeOptionDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          active && styles.sizeTextActive,
                          outOfStock && styles.sizeTextDisabled,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.sizeRow}>
                <View style={[styles.sizeOption, styles.sizeOptionActive]}>
                  <Text style={[styles.sizeText, styles.sizeTextActive]}>
                    Onesize
                  </Text>
                </View>
              </View>
            )}

            {selectedVariant && (
              <Text style={styles.stockInfo}>
                ✓ {selectedStock} items available
              </Text>
            )}

            {!selectedVariant && productVariants.length > 0 && (
              <Text style={styles.stockInfo}>
                ✓ {totalAvailableStock} items available
              </Text>
            )}
          </View>

          {/* OFFERS */}

          <View style={styles.offersBox}>
            <Text style={styles.sectionHeading}>Available Offers</Text>

            <View style={styles.offerRow}>
              <Text style={styles.offerCheck}>✓</Text>
              <Text style={styles.offerText}>Special price available</Text>
            </View>

            <View style={styles.offerRow}>
              <Text style={styles.offerCheck}>✓</Text>
              <Text style={styles.offerText}>100% Original Product</Text>
            </View>
          </View>

          {/* DESCRIPTION */}

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Product Description</Text>

            <Text style={styles.bodyText}>
              {product.description || 'No product description available.'}
            </Text>
          </View>

          {/* ASSURANCE */}

          <View style={styles.assuranceRow}>
            {['100% Original', 'Secure Payment', 'Easy Returns'].map((label) => (
              <View key={label} style={styles.assuranceItem}>
                <Text style={styles.assuranceCheck}>✓</Text>
                <Text style={styles.assuranceText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================= PRODUCT INFORMATION ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Information</Text>

          {[
            ['Size & Fit', product.size_fit || 'Not available'],
            ['Material & Care', product.material_care || 'Not available'],
            ['Category', product.category || '—'],
            ['Product Type', product.product_type || '—'],
            ['Brand', product.brand || '—'],
          ].map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}

          <View style={[styles.infoRow, styles.lastRow]}>
            <Text style={styles.infoLabel}>Availability</Text>
            <Text
              style={[
                styles.infoValue,
                totalAvailableStock > 0 ? styles.inStock : styles.outOfStock,
              ]}
            >
              {totalAvailableStock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>

        {/* ================= PRODUCT DETAILS ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Details</Text>

          {Object.keys(dynamicDetails).length > 0 ? (
            Object.entries(dynamicDetails).map(([key, value]) => {
              if (
                value === null ||
                value === undefined ||
                String(value).trim() === ''
              ) {
                return null;
              }

              return (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{formatDisplayKey(key)}</Text>
                  <Text style={styles.infoValue}>{String(value)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.bodyText}>
              No additional product details available.
            </Text>
          )}
        </View>

        {/* ================= RELATED PRODUCTS ================= */}

        {relatedProducts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Related Products</Text>
            <Text style={styles.cardSubtitle}>Products you may also like</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRow}
            >
              {relatedProducts.map((item) => {
                const image = getRelatedProductImage(item);

                const variants: any[] = Array.isArray(item.product_variants)
                  ? item.product_variants
                  : [];

                const variant =
                  variants.find((v) => Number(v.stock || 0) > 0) ||
                  variants[0] ||
                  null;

                const relatedPrice = variant
                  ? Number(
                      variant.discount_price ??
                        variant.price ??
                        item.discount_price ??
                        item.price ??
                        0
                    )
                  : Number(
                      item.discount_price ??
                        item.price ??
                        item.discountPrice ??
                        0
                    );

                const relatedOriginal = variant
                  ? Number(
                      variant.price ??
                        item.original_price ??
                        item.originalPrice ??
                        item.mrp ??
                        item.old_price ??
                        0
                    )
                  : Number(
                      item.original_price ??
                        item.originalPrice ??
                        item.mrp ??
                        item.old_price ??
                        0
                    );

                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.relatedCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: String(item.id) },
                      } as any)
                    }
                  >
                    {image ? (
                      <Image source={{ uri: image }} style={styles.relatedImage} />
                    ) : (
                      <View style={[styles.relatedImage, styles.noImage]}>
                        <Text style={styles.noImageText}>No Image</Text>
                      </View>
                    )}

                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedCategory} numberOfLines={1}>
                        {item.category || 'Product'}
                      </Text>

                      <Text style={styles.relatedName} numberOfLines={2}>
                        {item.name || 'Product'}
                      </Text>

                      {!!item.brand && (
                        <Text style={styles.relatedBrand} numberOfLines={1}>
                          {item.brand}
                        </Text>
                      )}

                      <View style={styles.relatedPriceRow}>
                        <Text style={styles.relatedPrice}>
                          {rupees(relatedPrice)}
                        </Text>

                        {relatedOriginal > relatedPrice && (
                          <Text style={styles.relatedOriginal}>
                            {rupees(relatedOriginal)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ================= REVIEWS ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ratings & Reviews</Text>

          {totalReviews > 0 && (
            <Text style={styles.cardSubtitle}>
              {Number(averageRating).toFixed(1)} out of 5 · {totalReviews}{' '}
              {totalReviews === 1 ? 'Review' : 'Reviews'}
            </Text>
          )}

          {reviewsLoading && (
            <View style={styles.reviewsLoading}>
              <ActivityIndicator size="small" color="#7c3aed" />
              <Text style={styles.reviewsLoadingText}>
                Loading customer reviews...
              </Text>
            </View>
          )}

          {!reviewsLoading && reviews.length === 0 && (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsIcon}>💬</Text>
              <Text style={styles.noReviewsTitle}>No customer reviews yet</Text>
              <Text style={styles.noReviewsText}>
                Be the first customer to review this product.
              </Text>
            </View>
          )}

          {!reviewsLoading &&
            reviews.map((review, index) => {
              const date = review.created_at || review.createdAt;

              return (
                <View key={String(review.id ?? index)} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <View style={styles.flex1}>
                      <Text style={styles.customerName}>
                        {review.customer_name ||
                          review.customerName ||
                          review.name ||
                          'Customer'}
                      </Text>
                      <Text style={styles.verified}>✓ Verified Purchase</Text>
                    </View>

                    <Stars rating={review.rating} />
                  </View>

                  <Text style={styles.reviewFeedback}>
                    {review.feedback || review.comment || ''}
                  </Text>

                  <Text style={styles.reviewDate}>
                    {date ? new Date(date).toLocaleDateString('en-IN') : '-'}
                  </Text>
                </View>
              );
            })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ================= ACTION BAR ================= */}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.cartButton,
            (!canAddToCart || adding) && styles.disabledButton,
          ]}
          disabled={!canAddToCart || adding}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.cartButtonText}>
            {adding ? 'Please wait...' : '🛒 ADD TO CART'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buyButton,
            (!canBuyNow || adding) && styles.disabledButton,
          ]}
          disabled={!canBuyNow || adding}
          onPress={handleBuyNow}
          activeOpacity={0.8}
        >
          <Text style={styles.buyButtonText}>⚡ BUY NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f8f8' },
  flex1: { flex: 1 },

  // center states
  centerContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: '#777', fontWeight: '600' },
  errorIcon: { fontSize: 42, marginBottom: 12 },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },

  // header
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 32, color: '#222', marginTop: -4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#181818' },
  heart: { fontSize: 25, color: '#555' },
  heartActive: { color: '#ef4444' },

  // gallery
  imageContainer: { height: 350, backgroundColor: '#eee' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  noImageText: { color: '#999', fontSize: 13 },
  thumbnailScroll: { backgroundColor: '#fff' },
  thumbnailRow: { padding: 10 },
  thumbnail: {
    width: 62,
    height: 62,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#eee',
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnailActive: { borderColor: '#7c3aed' },
  thumbnailImage: { width: '100%', height: '100%' },

  // main content
  content: { backgroundColor: '#fff', padding: 20 },
  category: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#181818',
    lineHeight: 30,
  },

  // rating
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  ratingBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  ratingCount: { color: '#777', fontSize: 12, marginLeft: 8 },

  // price
  priceBox: { marginTop: 14 },
  priceLabel: { fontSize: 12, color: '#16a34a', fontWeight: '700' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  price: { fontSize: 25, fontWeight: '800', color: '#111' },
  originalPrice: {
    fontSize: 15,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
    marginLeft: 10,
  },
  taxText: { fontSize: 11, color: '#777', marginTop: 3 },

  // sections
  section: { marginTop: 22 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181818',
    marginBottom: 8,
  },
  bodyText: { fontSize: 14, lineHeight: 22, color: '#666' },

  // size
  sizeHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeGuide: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '700',
    marginBottom: 8,
  },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  sizeOption: {
    minWidth: 54,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sizeOptionActive: { borderColor: '#7c3aed', backgroundColor: '#faf7ff' },
  sizeOptionDisabled: { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' },
  sizeText: { color: '#333', fontSize: 13, fontWeight: '700' },
  sizeTextActive: { color: '#7c3aed', fontWeight: '800' },
  sizeTextDisabled: {
    color: '#a1a1aa',
    textDecorationLine: 'line-through',
  },
  stockInfo: { marginTop: 4, color: '#16a34a', fontSize: 12, fontWeight: '700' },

  // offers
  offersBox: {
    marginTop: 22,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#faf7ff',
    borderWidth: 1,
    borderColor: '#eadfff',
  },
  offerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  offerCheck: { color: '#16a34a', fontWeight: '900', marginRight: 8 },
  offerText: { color: '#444', fontSize: 13 },

  // assurance
  assuranceRow: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assuranceItem: { flexDirection: 'row', alignItems: 'center' },
  assuranceCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
  },
  assuranceText: { color: '#333', fontSize: 11, fontWeight: '700', marginLeft: 5 },

  // cards
  card: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#181818' },
  cardSubtitle: { fontSize: 12, color: '#777', marginTop: 4, marginBottom: 6 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastRow: { borderBottomWidth: 0 },
  infoLabel: { flex: 1, color: '#777', fontSize: 13 },
  infoValue: {
    flex: 1,
    color: '#222',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  inStock: { color: '#16a34a' },
  outOfStock: { color: '#dc2626' },

  // related
  relatedRow: { paddingTop: 10 },
  relatedCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  relatedImage: { width: '100%', height: 140, backgroundColor: '#eee' },
  relatedInfo: { padding: 9 },
  relatedCategory: { fontSize: 9, fontWeight: '800', color: '#7c3aed' },
  relatedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181818',
    marginTop: 3,
    minHeight: 34,
  },
  relatedBrand: { fontSize: 11, color: '#777', marginTop: 2 },
  relatedPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  relatedPrice: { fontSize: 14, fontWeight: '800', color: '#111' },
  relatedOriginal: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },

  // reviews
  reviewsLoading: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsLoadingText: { color: '#777', fontSize: 13, marginLeft: 8 },
  noReviews: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  noReviewsIcon: { fontSize: 32, marginBottom: 8 },
  noReviewsTitle: { fontSize: 15, fontWeight: '800', color: '#333' },
  noReviewsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 15,
    marginTop: 12,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between' },
  customerName: { fontSize: 15, fontWeight: '800', color: '#222' },
  verified: { fontSize: 10, color: '#16a34a', fontWeight: '700', marginTop: 4 },
  reviewFeedback: { fontSize: 13, lineHeight: 20, color: '#555', marginTop: 10 },
  reviewDate: { fontSize: 10, color: '#999', marginTop: 8 },

  // bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    elevation: 10,
  },
  cartButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartButtonText: { color: '#7c3aed', fontSize: 13, fontWeight: '800' },
  buyButton: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.5 },
});
