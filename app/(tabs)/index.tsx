import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Chatbot from '../../components/Chatbot';
import LiveTour from '../../components/LiveTour';

import { API_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

// CHANGE THESE if your routes are different
const LOGIN_ROUTE = '/login';
const MERCHANT_ROUTE = '/merchant';
const DELIVERY_ROUTE = '/delivery';

// =========================================
// CATEGORIES
// =========================================

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home'];

// =========================================
// FEATURES
// =========================================

const FEATURES = [
  { icon: '🚚', title: 'Free Delivery', text: 'On orders above ₹999' },
  { icon: '🔒', title: 'Secure Payment', text: '100% secure checkout' },
  { icon: '↩️', title: 'Easy Returns', text: '7-day return policy' },
  { icon: '💬', title: '24/7 Support', text: "We're here to help" },
];

const PAGE_SIZE = 20;

type Banner = {
  id?: number;
  title?: string;
  description?: string;
  discount?: number | string;
  button_text?: string;
  image?: string;
  is_active?: boolean;
};

// =========================================
// HELPERS
// =========================================

const imageFrom = (item: any): string | null => {
  if (typeof item === 'string') return item;
  return item?.image_url || item?.image || item?.url || null;
};

const getProductImage = (product: any): string => {
  if (Array.isArray(product?.product_images) && product.product_images.length) {
    const first = imageFrom(product.product_images[0]);
    if (first) return first;
  }
  return String(product?.image || '');
};

// Home page products can have price 0 when the real prices
// are inside the variants, so the price is taken from the variants.
const getPriceInfo = (product: any) => {
  const variants: any[] = Array.isArray(product?.product_variants)
    ? product.product_variants
    : [];

  const variantPrices = variants
    .map((v) => Number(v.discount_price ?? v.price ?? 0))
    .filter((value) => value > 0);

  const price =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : Number(product?.price) ||
        Number(product?.discount_price) ||
        Number(product?.discountPrice) ||
        0;

  const variantOriginals = variants
    .map((v) => Number(v.price) || 0)
    .filter((value) => value > 0);

  const originalPrice =
    variantOriginals.length > 0
      ? Math.min(...variantOriginals)
      : Number(
          product?.original_price ||
            product?.originalPrice ||
            product?.mrp ||
            product?.old_price ||
            0
        );

  const discount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return { price, originalPrice, discount };
};

// =========================================
// HOME SCREEN
// =========================================

export default function HomeScreen() {
  const router = useRouter();

  // Merchant / delivery users must never see the customer home screen.
  // Runs every time this screen comes into focus (also on Back press).
  useFocusEffect(
    React.useCallback(() => {
      const redirectByRole = async () => {
        try {
          const saved = await AsyncStorage.getItem('loggedInUser');
          if (!saved) return;

          const user = JSON.parse(saved);

          if (user?.role === 'merchant') {
            router.replace(MERCHANT_ROUTE as any);
          } else if (
            user?.role === 'delivery' ||
            user?.role === 'delivery_partner'
          ) {
            router.replace(DELIVERY_ROUTE as any);
          }
        } catch (err) {
          console.error('Role redirect error:', err);
        }
      };

      redirectByRole();
    }, [router])
  );

  const { addToCart, cartCount } = useCart();
  const { wishlist, toggleWishlist, isWishlisted } = useWishlist();

  // ---------------- STATES ----------------

  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  const [message, setMessage] = React.useState('');
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [productsOffset, setProductsOffset] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  // ---------------- DYNAMIC BANNER (same API as web) ----------------

  const [banner, setBanner] = React.useState<Banner | null>(null);
  const [bannerLoading, setBannerLoading] = React.useState(true);

  // ---------------- LIVE TOUR ----------------

  const [showLiveTour, setShowLiveTour] = React.useState(false);

  const searchTourRef = React.useRef<View>(null);
  const wishlistTourRef = React.useRef<View>(null);
  const profileTourRef = React.useRef<View>(null);
  const cartTourRef = React.useRef<View>(null);

  React.useEffect(() => {
    const checkLiveTour = async () => {
      try {
        const completed = await AsyncStorage.getItem('customerLiveTourCompleted');

        if (completed !== 'true') {
          setShowLiveTour(true);
        }
      } catch (err) {
        console.error('Live tour check error:', err);
      }
    };

    checkLiveTour();

    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  // ---------------- FETCH PRODUCTS (same as web) ----------------

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error('Products fetch error:', err);

      setError(
        'Unable to load products. Please make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBanner = async () => {
    try {
      setBannerLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/banners/active`);
      const data = await response.json();

      if (data.success && data.banner) {
        setBanner(data.banner);
      } else {
        setBanner(null);
      }
    } catch (err) {
      console.error('Failed to fetch active banner:', err);

      // if the banner API fails, the default banner is shown
      setBanner(null);
    } finally {
      setBannerLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
    fetchActiveBanner();
  }, []);

  // ---------------- FILTER (same as web) ----------------

  const filteredProducts = products.filter((product) => {
    const matchesSearch = String(product.name || '')
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      String(product.category || '').toLowerCase() ===
        selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const isSearching = search.trim().length > 0;

  // ---------------- HANDLERS ----------------

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setVisibleCount(PAGE_SIZE);
  };

  const loadMoreProducts = () => {
    setVisibleCount((current) => current + PAGE_SIZE);
  };

  const goToProducts = () => {
    scrollRef.current?.scrollTo({ y: productsOffset, animated: true });
  };

  const showMessage = (text: string) => {
    setMessage(text);

    if (messageTimer.current) clearTimeout(messageTimer.current);

    messageTimer.current = setTimeout(() => setMessage(''), 2000);
  };

  // Add to cart from the home page: stay on the page and show a message
  // (same as the web's addToCart(item, { openCart: false }))
  const handleAddToCart = async (product: any) => {
    const added = await addToCart({
      ...product,
      id: String(product.id),
      name: String(product.name || ''),
      category: String(product.category || ''),
      image: getProductImage(product),
      price: Number(product.price) || 0,
      gst_rate: Number(product.gst_rate ?? product.gstRate ?? 0),
      quantity: 1,
    });

    if (added) {
      showMessage('Added to cart');
      return;
    }

    Alert.alert(
      'Unable to add to cart',
      'Please login and try again. If you are already logged in, this product may not have a valid price.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push(LOGIN_ROUTE as any) },
      ]
    );
  };

  const handleToggleWishlist = (product: any) => {
    toggleWishlist({
      id: String(product.id),
      name: String(product.name || ''),
      category: String(product.category || ''),
      price: getPriceInfo(product).price,
      image: getProductImage(product),
    });
  };

  const openProduct = (product: any) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: String(product.id) },
    } as any);
  };

  // same logic as web
  const bannerImageUrl = !banner?.image
    ? null
    : banner.image.startsWith('http')
    ? banner.image
    : `${API_BASE_URL}${banner.image}`;

  // =========================================
  // UI
  // =========================================

  return (
    <View style={styles.root}>
      {/* ADDED TO CART MESSAGE */}

      {!!message && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {message}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= HEADER (Navbar) ================= */}

        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Shop<Text style={styles.logoAccent}>Ease</Text>
            </Text>

            <Text style={styles.tagline}>
              Everything you need, all in one place
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* WISHLIST */}

            <View ref={wishlistTourRef} collapsable={false}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/wishlist' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.headerIcon}>❤️</Text>

                {wishlist.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{wishlist.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* PROFILE */}

            <View ref={profileTourRef} collapsable={false}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/profile' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.headerIcon}>👤</Text>
              </TouchableOpacity>
            </View>

            {/* CART */}

            <View ref={cartTourRef} collapsable={false}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/cart' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.headerIcon}>🛒</Text>

                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= SEARCH ================= */}

        <View
          ref={searchTourRef}
          collapsable={false}
          style={styles.searchContainer}
        >
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search products..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />

          {isSearching && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearchChange('')}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ================= HERO BANNER (hidden while searching) ================= */}

        {!isSearching &&
          (bannerLoading ? (
            <View style={styles.bannerLoading}>
              <Text style={styles.bannerLoadingText}>Loading banner...</Text>
            </View>
          ) : (
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <Text style={styles.offerText}>WELCOME TO SHOPEASE</Text>

                <Text style={styles.bannerTitle}>
                  {banner
                    ? banner.title || 'Everything you need, all in one place.'
                    : 'Everything you need,\nall in one place.'}
                </Text>

                {!!banner?.discount && (
                  <Text style={styles.discountBanner}>{banner.discount}% OFF</Text>
                )}

                {banner ? (
                  !!banner.description && (
                    <Text style={styles.bannerDescription}>
                      {banner.description}
                    </Text>
                  )
                ) : (
                  <Text style={styles.bannerDescription}>
                    Discover amazing products at great prices. Shop electronics,
                    fashion, home essentials and more.
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={goToProducts}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shopButtonText}>
                    {banner?.button_text || 'Shop Now'} →
                  </Text>
                </TouchableOpacity>
              </View>

              {bannerImageUrl ? (
                <Image
                  source={{ uri: bannerImageUrl }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.bannerEmojiBox}>
                  <Text style={styles.bannerEmoji}>🛍️</Text>
                </View>
              )}
            </View>
          ))}

        {/* ================= CATEGORIES (hidden while searching) ================= */}

        {!isSearching && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXPLORE</Text>
            <Text style={styles.sectionTitle}>Shop by Category</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {CATEGORIES.map((category) => {
                const active = selectedCategory === category;

                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => handleCategoryChange(category)}
                    style={[
                      styles.categoryButton,
                      active && styles.categoryButtonActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        active && styles.categoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ================= PRODUCTS ================= */}

        <View
          style={styles.productsHeader}
          onLayout={(event) => setProductsOffset(event.nativeEvent.layout.y)}
        >
          <View style={styles.flex1}>
            <Text style={styles.sectionLabel}>OUR COLLECTION</Text>

            <Text style={styles.sectionTitle}>
              {isSearching
                ? `Search Results for "${search}"`
                : 'Popular Products'}
            </Text>
          </View>

          <Text style={styles.itemCount}>
            {filteredProducts.length} products
          </Text>
        </View>

        {/* LOADING */}

        {loading && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageIcon}>🛍️</Text>
            <Text style={styles.loadingText}>Loading products...</Text>
            <Text style={styles.mutedText}>
              Please wait while we load the latest products.
            </Text>
          </View>
        )}

        {/* ERROR */}

        {!loading && error !== '' && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Unable to load products</Text>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={fetchProducts}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PRODUCT GRID */}

        {!loading && error === '' && visibleProducts.length > 0 && (
          <View style={styles.productGrid}>
            {visibleProducts.map((product) => {
              const { price, originalPrice, discount } = getPriceInfo(product);
              const image = getProductImage(product);
              const wished = isWishlisted(String(product.id));

              return (
                <TouchableOpacity
                  key={String(product.id)}
                  style={styles.productCard}
                  activeOpacity={0.8}
                  onPress={() => openProduct(product)}
                >
                  {/* IMAGE */}

                  <View style={styles.imageContainer}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noImage}>
                        <Text style={styles.noImageText}>No Image</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.wishlistButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleToggleWishlist(product);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.heart, wished && styles.heartActive]}>
                        {wished ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* INFO */}

                  <View style={styles.productInfo}>
                    <Text style={styles.productCategory} numberOfLines={1}>
                      {product.category}
                    </Text>

                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>

                    <View style={styles.priceRow}>
                      <View style={styles.flex1}>
                        <Text style={styles.price}>
                          ₹{price.toLocaleString('en-IN')}
                        </Text>

                        {originalPrice > price && (
                          <View style={styles.offRow}>
                            <Text style={styles.originalPrice}>
                              ₹{originalPrice.toLocaleString('en-IN')}
                            </Text>

                            {discount > 0 && (
                              <Text style={styles.discountText}>
                                {discount}% OFF
                              </Text>
                            )}
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleAddToCart(product);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* LOAD MORE */}

        {!loading && error === '' && visibleCount < filteredProducts.length && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMoreProducts}
              activeOpacity={0.8}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NO PRODUCTS */}

        {!loading && error === '' && filteredProducts.length === 0 && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageIcon}>🔍</Text>
            <Text style={styles.errorTitle}>No products found</Text>
            <Text style={styles.mutedText}>
              Try searching for another product or category.
            </Text>

            {isSearching && (
              <TouchableOpacity
                style={[styles.primaryButton, styles.mt14]}
                onPress={() => handleSearchChange('')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= FEATURES ================= */}

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ================= CHATBOT ================= */}

      <Chatbot />

      {/* ================= LIVE TOUR ================= */}

      {showLiveTour && (
        <LiveTour
          role="customer"
          targets={{
            'tour-search': searchTourRef,
            'tour-profile': profileTourRef,
            'tour-wishlist': wishlistTourRef,
            'tour-cart': cartTourRef,
          }}
          onFinish={async () => {
            setShowLiveTour(false);

            await AsyncStorage.setItem('customerLiveTourCompleted', 'true');
          }}
        />
      )}
    </View>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  flex1: { flex: 1 },
  mt14: { marginTop: 14 },

  // toast
  toast: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    zIndex: 50,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    elevation: 8,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // header
  header: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: { fontSize: 28, fontWeight: '800', color: '#181818' },
  logoAccent: { color: '#7c3aed' },
  tagline: { fontSize: 12, color: '#888', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  headerIcon: { fontSize: 21 },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // search
  searchContainer: {
    marginHorizontal: 14,
    marginTop: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#222' },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: { fontSize: 18, color: '#777', fontWeight: '700' },

  // banner
  banner: {
    margin: 14,
    marginTop: 18,
    minHeight: 225,
    borderRadius: 20,
    backgroundColor: '#181818',
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerContent: { flex: 1, paddingRight: 10, zIndex: 2 },
  offerText: {
    color: '#b99cff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 34,
  },
  bannerDescription: {
    color: '#d2d2d2',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
    maxWidth: 210,
  },
  shopButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 15,
  },
  shopButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  discountBanner: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  bannerImage: {
    width: 135,
    height: 180,
    borderRadius: 14,
    alignSelf: 'center',
    marginLeft: 5,
  },
  bannerEmojiBox: { width: 110, justifyContent: 'center', alignItems: 'center' },
  bannerEmoji: { fontSize: 55 },
  bannerLoading: {
    margin: 14,
    marginTop: 18,
    minHeight: 225,
    borderRadius: 20,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLoadingText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // sections
  section: { marginTop: 10, paddingHorizontal: 14 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
    letterSpacing: 1,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#181818', marginTop: 2 },
  categoryList: { paddingVertical: 12 },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
  },
  categoryButtonActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  categoryText: { fontSize: 14, color: '#333', fontWeight: '600' },
  categoryTextActive: { color: '#ffffff' },

  productsHeader: {
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemCount: { color: '#777', fontSize: 12, marginLeft: 10 },

  // grid
  productGrid: {
    paddingHorizontal: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  imageContainer: { height: 145, backgroundColor: '#eeeeee', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: '#999', fontSize: 12 },
  wishlistButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: { fontSize: 22, color: '#555' },
  heartActive: { color: '#ef4444' },
  productInfo: { padding: 11 },
  productCategory: {
    fontSize: 9,
    color: '#7c3aed',
    fontWeight: '800',
    marginBottom: 6,
  },
  productName: { fontSize: 14, color: '#222', fontWeight: '500', minHeight: 38 },
  priceRow: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 16, color: '#111', fontWeight: '800' },
  offRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 5,
  },
  discountText: { fontSize: 10, color: '#16a34a', fontWeight: '800' },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  addButtonText: { color: '#ffffff', fontSize: 22, lineHeight: 24 },

  // load more
  loadMoreContainer: { alignItems: 'center', marginVertical: 10 },
  loadMoreButton: {
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  loadMoreText: { color: '#7c3aed', fontSize: 14, fontWeight: '800' },

  // messages
  messageContainer: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  messageIcon: { fontSize: 42, marginBottom: 12 },
  loadingText: { fontSize: 15, color: '#444', fontWeight: '700' },
  mutedText: { fontSize: 13, color: '#777', textAlign: 'center', marginTop: 6 },
  errorTitle: { fontSize: 16, color: '#222', fontWeight: '800' },
  errorText: {
    fontSize: 13,
    color: '#b42318',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  // features
  features: {
    marginTop: 16,
    marginHorizontal: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feature: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eeeeee',
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  featureIcon: { fontSize: 28, marginBottom: 6 },
  featureTitle: { fontSize: 14, fontWeight: '800', color: '#181818' },
  featureText: { fontSize: 11, color: '#777', marginTop: 3, textAlign: 'center' },
});