import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  Modal,
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

const PAGE_SIZE = 20;

// =========================================
// FILTER CONFIG (same as web)
// =========================================

const PRICE_RANGES = [
  { id: 'all', label: 'Any price', min: 0, max: Infinity },
  { id: 'u500', label: 'Under ₹500', min: 0, max: 500 },
  { id: '500-1000', label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { id: '1000-5000', label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { id: '5000-20000', label: '₹5,000 - ₹20,000', min: 5000, max: 20000 },
  { id: '20000+', label: 'Above ₹20,000', min: 20000, max: Infinity },
];

const ATTRS = [
  { key: 'color', label: 'Color' },
  { key: 'ram', label: 'RAM' },
  { key: 'storage', label: 'Storage' },
  { key: 'size', label: 'Size' },
];

const DISCOUNTS = [
  { value: 0, label: 'Any discount' },
  { value: 10, label: '10% or more' },
  { value: 20, label: '20% or more' },
  { value: 30, label: '30% or more' },
  { value: 50, label: '50% or more' },
];

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'low', label: 'Price: low to high' },
  { value: 'high', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'newest', label: 'Newest first' },
];

type AttrSel = Record<string, string[]>;

const EMPTY_ATTRS: AttrSel = { color: [], ram: [], storage: [], size: [] };

type Banner = {
  id?: number;
  title?: string;
  description?: string;
  discount?: number | string;
  button_text?: string;
  image?: string;
  is_active?: boolean;
};

type Option = { key: string; label: string; count: number };

// =========================================
// HELPERS
// =========================================

const imageFrom = (item: any): string | null => {
  if (typeof item === 'string') return item;
  return item?.image_url || item?.image || item?.url || null;
};

// used for cart / wishlist (unchanged)
const getProductImage = (product: any): string => {
  if (Array.isArray(product?.product_images) && product.product_images.length) {
    const first = imageFrom(product.product_images[0]);
    if (first) return first;
  }
  return String(product?.image || '');
};

const getProductType = (p: any): string =>
  String(p?.product_type || p?.sub_category || p?.subcategory || '').trim();

const variantsOf = (p: any): any[] => {
  const v = p?.product_variants;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// same as web imageUrl(): relative paths get the API base url
const imageUrl = (path: string): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:|file:)/.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// same as web getCardImage(): used only to DISPLAY the card image
const getCardImage = (product: any): string => {
  if (Array.isArray(product?.product_images) && product.product_images.length) {
    const first = imageFrom(product.product_images[0]);
    if (first) return imageUrl(first);
  }

  const variants = variantsOf(product);

  const raw =
    product?.image ||
    (Array.isArray(product?.images) ? imageFrom(product.images[0]) : '') ||
    variants.find((v) => v?.image)?.image ||
    variants.find((v) => Array.isArray(v?.images) && v.images[0])?.images?.[0] ||
    '';

  return imageUrl(String(raw || ''));
};

const attrValues = (p: any, key: string): string[] =>
  variantsOf(p)
    .map((v) => {
      let a = v?.attributes;
      if (typeof a === 'string') {
        try {
          a = JSON.parse(a);
        } catch {
          a = {};
        }
      }
      return String(a?.[key] ?? '').trim();
    })
    .filter(Boolean);

const totalStock = (p: any): number => {
  const vs = variantsOf(p);
  if (vs.length > 0) {
    return vs.reduce(
      (t, v) => t + (Number(v?.stock) > 0 ? Number(v.stock) : 0),
      0
    );
  }
  return Number(p?.stock) > 0 ? Number(p.stock) : 0;
};

// Same price logic as the web home page / ProductDetails page
const getPriceInfo = (product: any) => {
  const num = (v: any) => Number(v) || 0;
  const variants = variantsOf(product);

  let selling = 0;
  let mrp = 0;
  let from = false;

  const priced = variants
    .map((v) => ({
      selling: num(v.discount_price ?? v.price),
      mrp: num(v.price),
    }))
    .filter((v) => v.selling > 0);

  if (priced.length > 0) {
    const cheapest = priced.reduce((a, b) => (b.selling < a.selling ? b : a));
    selling = cheapest.selling;
    mrp = cheapest.mrp;
    from = new Set(priced.map((v) => v.selling)).size > 1;
  } else {
    selling = num(
      product?.discount_price ?? product?.discountPrice ?? product?.price
    );
    mrp = num(
      product?.original_price ??
        product?.originalPrice ??
        product?.mrp ??
        product?.old_price ??
        (num(product?.price) > selling ? product?.price : 0)
    );
  }

  let discount =
    mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;

  if (!discount) {
    discount = num(
      product?.discount_percentage ??
        product?.discountPercentage ??
        product?.discount
    );
    if (discount > 0 && !(mrp > selling) && selling > 0) {
      mrp = Math.round(selling / (1 - discount / 100));
    }
  }

  return {
    price: selling,
    originalPrice: mrp > selling ? mrp : 0,
    discount,
    from,
  };
};

// =========================================
// SMALL FILTER UI COMPONENTS
// =========================================

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.fChip, active && styles.fChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.fChipText, active && styles.fChipTextActive]}>
        {label}
      </Text>
      {count !== undefined && (
        <Text style={[styles.fChipCount, active && styles.fChipCountActive]}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function CheckRow({
  label,
  count,
  checked,
  radio,
  onPress,
}: {
  label: string;
  count?: number;
  checked: boolean;
  radio?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {radio ? (
        <View style={[styles.radio, checked && styles.radioOn]}>
          {checked && <View style={styles.radioDot} />}
        </View>
      ) : (
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked && <Text style={styles.checkMark}>✓</Text>}
        </View>
      )}

      <Text style={styles.checkLabel}>{label}</Text>

      {count !== undefined && <Text style={styles.checkCount}>{count}</Text>}
    </TouchableOpacity>
  );
}

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

  // ---------------- FILTER STATES (same as web) ----------------

  const [productType, setProductType] = React.useState('');
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState('all');
  const [sort, setSort] = React.useState('relevance');
  const [attrSel, setAttrSel] = React.useState<AttrSel>(EMPTY_ATTRS);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [minDiscount, setMinDiscount] = React.useState(0);

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);

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

  // ---------------- FILTER (search + category, same as web) ----------------

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

  const isSearching = search.trim().length > 0;

  // reset the filters whenever the category or the search changes (same as web)
  React.useEffect(() => {
    setProductType('');
    setSelectedBrands([]);
    setPriceRange('all');
    setAttrSel(EMPTY_ATTRS);
    setInStockOnly(false);
    setMinDiscount(0);
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, search]);

  // ---------------- FILTER OPTIONS (same as web) ----------------

  const typeOptions: Option[] = React.useMemo(() => {
    const map = new Map<string, Option>();

    filteredProducts.forEach((p) => {
      const label = getProductType(p);
      if (!label) return;

      const key = label.toLowerCase();
      const entry = map.get(key) || { key, label, count: 0 };
      entry.count += 1;
      map.set(key, entry);
    });

    return [...map.values()].sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, selectedCategory]);

  const typeFiltered = React.useMemo(
    () =>
      productType
        ? filteredProducts.filter(
            (p) => getProductType(p).toLowerCase() === productType
          )
        : filteredProducts,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, search, selectedCategory, productType]
  );

  // brands shown here belong ONLY to the selected type
  const brandOptions: Option[] = React.useMemo(() => {
    const map = new Map<string, Option>();

    typeFiltered.forEach((p) => {
      const label = String(p.brand || '').trim();
      if (!label) return;

      const key = label.toLowerCase();
      const entry = map.get(key) || { key, label, count: 0 };
      entry.count += 1;
      map.set(key, entry);
    });

    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [typeFiltered]);

  // colour / RAM / storage / size options, only for the selected type
  const attrOptions: Record<string, Option[]> = React.useMemo(() => {
    const out: Record<string, Option[]> = {};

    ATTRS.forEach(({ key }) => {
      const map = new Map<string, Option>();

      if (productType) {
        typeFiltered.forEach((p) => {
          const seen = new Set<string>();

          attrValues(p, key).forEach((val) => {
            const k = val.toLowerCase();
            if (seen.has(k)) return;
            seen.add(k);

            const entry = map.get(k) || { key: k, label: val, count: 0 };
            entry.count += 1;
            map.set(k, entry);
          });
        });
      }

      out[key] = [...map.values()].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true })
      );
    });

    return out;
  }, [typeFiltered, productType]);

  // ---------------- FINAL LIST ----------------

  const list = React.useMemo(() => {
    const range =
      PRICE_RANGES.find((r) => r.id === priceRange) || PRICE_RANGES[0];

    const result = typeFiltered.filter((p) => {
      if (
        selectedBrands.length > 0 &&
        !selectedBrands.includes(String(p.brand || '').trim().toLowerCase())
      ) {
        return false;
      }

      const info = getPriceInfo(p);

      if (info.price < range.min || info.price >= range.max) return false;
      if (minDiscount > 0 && info.discount < minDiscount) return false;
      if (inStockOnly && totalStock(p) <= 0) return false;

      for (const { key } of ATTRS) {
        const chosen = attrSel[key];

        if (chosen.length > 0) {
          const have = attrValues(p, key).map((x) => x.toLowerCase());
          if (!have.some((x) => chosen.includes(x))) return false;
        }
      }

      return true;
    });

    if (sort === 'low') {
      result.sort((a, b) => getPriceInfo(a).price - getPriceInfo(b).price);
    } else if (sort === 'high') {
      result.sort((a, b) => getPriceInfo(b).price - getPriceInfo(a).price);
    } else if (sort === 'discount') {
      result.sort(
        (a, b) => getPriceInfo(b).discount - getPriceInfo(a).discount
      );
    } else if (sort === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [
    typeFiltered,
    selectedBrands,
    priceRange,
    sort,
    attrSel,
    inStockOnly,
    minDiscount,
  ]);

  const visibleProducts = list.slice(0, visibleCount);

  const activeCount =
    (productType ? 1 : 0) +
    selectedBrands.length +
    (priceRange !== 'all' ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    Object.values(attrSel).reduce((t, a) => t + a.length, 0);

  const selectedTypeLabel =
    typeOptions.find((t) => t.key === productType)?.label || '';

  const sortLabel = SORTS.find((s) => s.value === sort)?.label || 'Relevance';

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

  const pickType = (key: string) => {
    setProductType(key);
    setSelectedBrands([]);
    setAttrSel(EMPTY_ATTRS);
    setVisibleCount(PAGE_SIZE);
  };

  const toggleBrand = (key: string) => {
    setSelectedBrands((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]
    );
    setVisibleCount(PAGE_SIZE);
  };

  const toggleAttr = (key: string, val: string) => {
    setAttrSel((prev) => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter((x) => x !== val)
        : [...prev[key], val],
    }));
    setVisibleCount(PAGE_SIZE);
  };

  const clearFilters = () => {
    setProductType('');
    setSelectedBrands([]);
    setAttrSel(EMPTY_ATTRS);
    setInStockOnly(false);
    setMinDiscount(0);
    setPriceRange('all');
    setSort('relevance');
    setVisibleCount(PAGE_SIZE);
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

          <Text style={styles.itemCount}>{list.length} products</Text>
        </View>

        {/* ================= TOOLBAR (filters + sort) ================= */}

        {!loading && error === '' && filteredProducts.length > 0 && (
          <>
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterButtonText}>☰ Filters</Text>

                {activeCount > 0 && (
                  <View style={styles.fBadge}>
                    <Text style={styles.fBadgeText}>{activeCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setSortOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.sortButtonText} numberOfLines={1}>
                  Sort: {sortLabel} ▾
                </Text>
              </TouchableOpacity>
            </View>

            {/* ACTIVE FILTER CHIPS */}

            {activeCount > 0 && (
              <View style={styles.activeRow}>
                {!!productType && (
                  <View style={styles.activeChip}>
                    <Text style={styles.activeChipText}>
                      {selectedTypeLabel}
                    </Text>
                    <TouchableOpacity
                      style={styles.activeChipClose}
                      onPress={() => pickType('')}
                    >
                      <Text style={styles.activeChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBrands.map((key) => (
                  <View style={styles.activeChip} key={`brand-${key}`}>
                    <Text style={styles.activeChipText}>
                      {brandOptions.find((b) => b.key === key)?.label || key}
                    </Text>
                    <TouchableOpacity
                      style={styles.activeChipClose}
                      onPress={() => toggleBrand(key)}
                    >
                      <Text style={styles.activeChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {ATTRS.map(({ key, label }) =>
                  attrSel[key].map((val) => (
                    <View style={styles.activeChip} key={`${key}-${val}`}>
                      <Text style={styles.activeChipText}>
                        {label}:{' '}
                        {attrOptions[key].find((o) => o.key === val)?.label ||
                          val}
                      </Text>
                      <TouchableOpacity
                        style={styles.activeChipClose}
                        onPress={() => toggleAttr(key, val)}
                      >
                        <Text style={styles.activeChipCloseText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {priceRange !== 'all' && (
                  <View style={styles.activeChip}>
                    <Text style={styles.activeChipText}>
                      {PRICE_RANGES.find((r) => r.id === priceRange)?.label}
                    </Text>
                    <TouchableOpacity
                      style={styles.activeChipClose}
                      onPress={() => setPriceRange('all')}
                    >
                      <Text style={styles.activeChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {minDiscount > 0 && (
                  <View style={styles.activeChip}>
                    <Text style={styles.activeChipText}>
                      {minDiscount}% off or more
                    </Text>
                    <TouchableOpacity
                      style={styles.activeChipClose}
                      onPress={() => setMinDiscount(0)}
                    >
                      <Text style={styles.activeChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {inStockOnly && (
                  <View style={styles.activeChip}>
                    <Text style={styles.activeChipText}>In stock only</Text>
                    <TouchableOpacity
                      style={styles.activeChipClose}
                      onPress={() => setInStockOnly(false)}
                    >
                      <Text style={styles.activeChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

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
              const { price, originalPrice, discount, from } =
                getPriceInfo(product);
              const image = getCardImage(product);
              const wished = isWishlisted(String(product.id));

              return (
                <TouchableOpacity
                  key={String(product.id)}
                  style={styles.productCard}
                  activeOpacity={0.8}
                  onPress={() => openProduct(product)}
                >
                  {/* IMAGE (full image visible, same as web) */}

                  <View style={styles.imageContainer}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.productImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.noImage}>
                        <Text style={styles.noImageEmoji}>🛍️</Text>
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
                        {price > 0 ? (
                          <Text style={styles.price}>
                            {from ? <Text style={styles.fromText}>From </Text> : null}
                            ₹{price.toLocaleString('en-IN')}
                          </Text>
                        ) : (
                          <Text style={styles.viewPrice}>View price</Text>
                        )}

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

        {!loading && error === '' && visibleCount < list.length && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMoreProducts}
              activeOpacity={0.8}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>

            <Text style={styles.showingText}>
              Showing {Math.min(visibleCount, list.length)} of {list.length}
            </Text>
          </View>
        )}

        {/* NO PRODUCTS */}

        {!loading && error === '' && list.length === 0 && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageIcon}>🔍</Text>
            <Text style={styles.errorTitle}>No products found</Text>
            <Text style={styles.mutedText}>
              Try searching for another product, category or clear the filters.
            </Text>

            {activeCount > 0 && (
              <TouchableOpacity
                style={[styles.primaryButton, styles.mt14]}
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}

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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ================= FILTER SHEET ================= */}

      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFilterOpen(false)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>

              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setFilterOpen(false)}
              >
                <Text style={styles.sheetCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetBody}
              showsVerticalScrollIndicator={false}
            >
              {/* PRODUCT TYPE */}

              {typeOptions.length > 1 && (
                <View style={styles.fSection}>
                  <Text style={styles.fHeading}>Product type</Text>

                  <View style={styles.fChips}>
                    <FilterChip
                      label="All"
                      active={!productType}
                      onPress={() => pickType('')}
                    />

                    {typeOptions.map((t) => (
                      <FilterChip
                        key={t.key}
                        label={t.label}
                        count={t.count}
                        active={productType === t.key}
                        onPress={() => pickType(t.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* BRANDS */}

              {brandOptions.length > 0 && (
                <View style={styles.fSection}>
                  <Text style={styles.fHeading}>
                    {selectedTypeLabel ? `${selectedTypeLabel} brands` : 'Brands'}
                  </Text>

                  {brandOptions.map((b) => (
                    <CheckRow
                      key={b.key}
                      label={b.label}
                      count={b.count}
                      checked={selectedBrands.includes(b.key)}
                      onPress={() => toggleBrand(b.key)}
                    />
                  ))}
                </View>
              )}

              {/* COLOR / RAM / STORAGE / SIZE */}

              {ATTRS.map(({ key, label }) =>
                attrOptions[key].length > 0 ? (
                  <View style={styles.fSection} key={key}>
                    <Text style={styles.fHeading}>{label}</Text>

                    <View style={styles.fChips}>
                      {attrOptions[key].map((o) => (
                        <FilterChip
                          key={o.key}
                          label={o.label}
                          active={attrSel[key].includes(o.key)}
                          onPress={() => toggleAttr(key, o.key)}
                        />
                      ))}
                    </View>
                  </View>
                ) : null
              )}

              {/* PRICE */}

              <View style={styles.fSection}>
                <Text style={styles.fHeading}>Price</Text>

                {PRICE_RANGES.map((r) => (
                  <CheckRow
                    key={r.id}
                    radio
                    label={r.label}
                    checked={priceRange === r.id}
                    onPress={() => {
                      setPriceRange(r.id);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  />
                ))}
              </View>

              {/* DISCOUNT */}

              <View style={styles.fSection}>
                <Text style={styles.fHeading}>Discount</Text>

                {DISCOUNTS.map((d) => (
                  <CheckRow
                    key={d.value}
                    radio
                    label={d.label}
                    checked={minDiscount === d.value}
                    onPress={() => {
                      setMinDiscount(d.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  />
                ))}
              </View>

              {/* AVAILABILITY */}

              <View style={[styles.fSection, styles.fSectionLast]}>
                <Text style={styles.fHeading}>Availability</Text>

                <CheckRow
                  label="In stock only"
                  checked={inStockOnly}
                  onPress={() => {
                    setInStockOnly((v) => !v);
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.footerClearBtn}
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.footerClearText}>Clear all</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerShowBtn}
                onPress={() => setFilterOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.footerShowText}>
                  Show {list.length} results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= SORT SHEET ================= */}

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <View style={styles.sortOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSortOpen(false)}
          />

          <View style={styles.sortSheet}>
            <Text style={styles.sortTitle}>Sort by</Text>

            {SORTS.map((s) => (
              <CheckRow
                key={s.value}
                radio
                label={s.label}
                checked={sort === s.value}
                onPress={() => {
                  setSort(s.value);
                  setVisibleCount(PAGE_SIZE);
                  setSortOpen(false);
                }}
              />
            ))}
          </View>
        </View>
      </Modal>

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

  // toolbar (filters + sort)
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButtonText: { color: '#7c3aed', fontSize: 14, fontWeight: '800' },
  fBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  fBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sortButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sortButtonText: { color: '#333', fontSize: 13, fontWeight: '600' },

  // active filter chips
  activeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
  },
  activeChipText: { color: '#5b21b6', fontSize: 12, fontWeight: '700' },
  activeChipClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(91,33,182,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  activeChipCloseText: {
    color: '#5b21b6',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  clearAllText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },

  // filter sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23,19,43,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0f6',
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#17132b' },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseText: { fontSize: 22, color: '#17132b', lineHeight: 26 },
  sheetBody: { paddingHorizontal: 20 },
  fSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0f6',
  },
  fSectionLast: { borderBottomWidth: 0 },
  fHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#17132b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  fChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e6e0f6',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  fChipText: { fontSize: 13, color: '#17132b', fontWeight: '600' },
  fChipTextActive: { color: '#ffffff' },
  fChipCount: { fontSize: 11, color: '#6b6785', marginLeft: 5 },
  fChipCountActive: { color: 'rgba(255,255,255,0.8)' },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#bdb5d8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxOn: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkMark: { color: '#ffffff', fontSize: 14, fontWeight: '800', lineHeight: 16 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#bdb5d8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOn: { borderColor: '#7c3aed' },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
  },
  checkLabel: { flex: 1, fontSize: 15, color: '#17132b' },
  checkCount: { fontSize: 12, color: '#6b6785' },

  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#e6e0f6',
    backgroundColor: '#ffffff',
  },
  footerClearBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  footerClearText: { color: '#7c3aed', fontSize: 14, fontWeight: '800' },
  footerShowBtn: {
    flex: 1.4,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  footerShowText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  // sort sheet
  sortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23,19,43,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  sortSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sortTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17132b',
    marginBottom: 6,
  },

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
  // square white box, full image inside (same as web .hp-card-media)
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0f6',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f2fd',
  },
  noImageEmoji: { fontSize: 44 },
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
    elevation: 3,
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
  fromText: { fontSize: 11, color: '#777', fontWeight: '500' },
  viewPrice: { fontSize: 13, color: '#777', fontWeight: '700' },
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
  showingText: { color: '#777', fontSize: 12, marginTop: 8 },

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
});
