import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { products } from '../../data/products';

const categories = ['All', 'Electronics', 'Fashion', 'Home'];

export default function HomeScreen() {
  const router = useRouter();

  const { addToCart, cartCount } = useCart();

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] =
    React.useState('All');

  const [productsOffset, setProductsOffset] =
    React.useState(0);

  const scrollRef =
    React.useRef<ScrollView>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      product.category.toLowerCase() ===
        selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const isSearching = search.trim().length > 0;

  const clearSearch = () => {
    setSearch('');
  };

  const goToProducts = () => {
    scrollRef.current?.scrollTo({
      y: productsOffset,
      animated: true,
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            Shop
            <Text style={styles.logoAccent}>
              Ease
            </Text>
          </Text>

          <Text style={styles.tagline}>
            Everything you need, all in one place
          </Text>
        </View>

        <View style={styles.headerActions}>

          {/* WISHLIST */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              router.push('/wishlist' as any)
            }
          >
            <Text style={styles.headerIcon}>
              ❤️
            </Text>
          </TouchableOpacity>

          {/* PROFILE */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              router.push('/profile' as any)
            }
          >
            <Text style={styles.headerIcon}>
              👤
            </Text>
          </TouchableOpacity>

          {/* CART */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() =>
              router.push('/cart' as any)
            }
          >
            <Text style={styles.cartIcon}>
              🛒
            </Text>

            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>
          🔍
        </Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor="#999"
          style={styles.searchInput}
        />

        {/* CLEAR SEARCH */}
        {isSearching && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
          >
            <Text style={styles.clearText}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* OFFER BANNER */}
      {!isSearching && (
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.offerText}>
              SPECIAL OFFER
            </Text>

            <Text style={styles.bannerTitle}>
              Shop your{'\n'}favorites
            </Text>

            <Text style={styles.bannerDescription}>
              Discover great products at amazing prices.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={goToProducts}
            >
              <Text style={styles.shopButtonText}>
                Shop Now
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bannerEmoji}>
            🛍️
          </Text>
        </View>
      )}

      {/* CATEGORIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Shop by Category
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category) => {
            const active =
              selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                onPress={() =>
                  setSelectedCategory(category)
                }
                style={[
                  styles.categoryButton,
                  active &&
                    styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active &&
                      styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PRODUCTS HEADER */}
      <View
        style={styles.productsHeader}
        onLayout={(event) => {
          setProductsOffset(
            event.nativeEvent.layout.y
          );
        }}
      >
        <Text style={styles.sectionTitle}>
          Featured Products
        </Text>

        <Text style={styles.itemCount}>
          {filteredProducts.length} items
        </Text>
      </View>

      {/* PRODUCTS */}
      <View style={styles.productGrid}>
        {filteredProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/product/[id]',
                params: {
                  id: product.id,
                },
              })
            }
          >
            {/* IMAGE */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
              />

              {/* PRODUCT WISHLIST */}
              <TouchableOpacity
                style={styles.wishlistButton}
                onPress={(event) => {
                  event.stopPropagation();

                  toggleWishlist({
                    id: product.id,
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    image: product.image,
                  });
                }}
              >
                <Text
                  style={[
                    styles.heart,
                    isWishlisted(product.id) &&
                      styles.heartActive,
                  ]}
                >
                  {isWishlisted(product.id)
                    ? '♥'
                    : '♡'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* PRODUCT INFO */}
            <View style={styles.productInfo}>
              <Text style={styles.productCategory}>
                {product.category}
              </Text>

              <Text style={styles.productName}>
                {product.name}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  ₹
                  {product.price.toLocaleString(
                    'en-IN'
                  )}
                </Text>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={(event) => {
                    event.stopPropagation();

                    addToCart({
                      id: product.id,
                      name: product.name,
                      category: product.category,
                      price: product.price,
                      image: product.image,
                    });
                  }}
                >
                  <Text style={styles.addButtonText}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* NO RESULTS */}
      {filteredProducts.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No products found
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#181818',
  },

  logoAccent: {
    color: '#7c3aed',
  },

  tagline: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  /* WISHLIST + PROFILE */
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  headerIcon: {
    fontSize: 21,
  },

  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  cartIcon: {
    fontSize: 22,
  },

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

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },

  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearText: {
    fontSize: 18,
    color: '#777',
    fontWeight: '700',
  },

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

  bannerContent: {
    flex: 1,
  },

  offerText: {
    color: '#b99cff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },

  bannerTitle: {
    color: '#ffffff',
    fontSize: 29,
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

  shopButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  bannerEmoji: {
    fontSize: 55,
    alignSelf: 'center',
  },

  section: {
    marginTop: 10,
    paddingHorizontal: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },

  categoryList: {
    gap: 10,
    paddingVertical: 12,
  },

  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  categoryButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },

  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },

  categoryTextActive: {
    color: '#ffffff',
  },

  productsHeader: {
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  itemCount: {
    color: '#777',
    fontSize: 12,
  },

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

  imageContainer: {
    height: 145,
    backgroundColor: '#eeeeee',
    position: 'relative',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

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

  heart: {
    fontSize: 22,
    color: '#555',
  },

  heartActive: {
    color: '#ef4444',
  },

  productInfo: {
    padding: 11,
  },

  productCategory: {
    fontSize: 9,
    color: '#7c3aed',
    fontWeight: '800',
    marginBottom: 6,
  },

  productName: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    minHeight: 38,
  },

  priceRow: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  price: {
    fontSize: 16,
    color: '#111',
    fontWeight: '800',
  },

  addButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 24,
  },

  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },

  emptyText: {
    color: '#777',
    fontSize: 15,
  },

  cartBadge: {
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

  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});