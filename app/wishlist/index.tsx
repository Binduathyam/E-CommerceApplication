import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

// CHANGE THESE if your routes are different
const CART_ROUTE = '/cart';
const HOME_ROUTE = '/(tabs)';
const ADMIN_LOGIN_ROUTE = '/admin-login';

// The web page has an "Admin Login" button at the bottom.
// It is hidden on mobile by default. Set to true to show it.
const SHOW_ADMIN_LOGIN = false;

export default function WishlistScreen() {
  const router = useRouter();

  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const items: any[] = Array.isArray(wishlist) ? wishlist : [];

  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.title}>My Wishlist</Text>
          <Text style={styles.subtitle}>{items.length} items</Text>
        </View>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.push(CART_ROUTE as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= EMPTY ================= */}

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♡</Text>

            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>

            <Text style={styles.emptyText}>
              Save the products you love and find them here later.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push(HOME_ROUTE as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.shopButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= ITEMS ================= */

          <View style={styles.productGrid}>
            {items.map((product) => (
              <View key={String(product.id)} style={styles.productCard}>
                {/* IMAGE + REMOVE */}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.imageWrapper}
                  onPress={() =>
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: product.id },
                    } as any)
                  }
                >
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromWishlist(product.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* DETAILS */}

                <View style={styles.productInfo}>
                  <Text style={styles.category} numberOfLines={1}>
                    {product.category}
                  </Text>

                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  <Text style={styles.price}>
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </Text>

                  <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => addToCart(product)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cartButtonText}>MOVE TO CART</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= ADMIN LOGIN (optional) ================= */}

        {SHOW_ADMIN_LOGIN && (
          <View style={styles.adminSection}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push(ADMIN_LOGIN_ROUTE as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.adminButtonText}>Admin Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  // header
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 32,
    color: '#222',
    marginTop: -4,
  },
  cartIcon: {
    fontSize: 19,
  },
  titleBox: {
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },
  subtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  // content
  content: {
    padding: 12,
    paddingBottom: 40,
  },

  // grid
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48.3%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 13,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
    elevation: 2,
  },

  // image
  imageWrapper: {
    width: '100%',
    height: 165,
    backgroundColor: '#eeeeee',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  removeText: {
    color: '#ef4444',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
  },

  // info
  productInfo: {
    padding: 10,
  },
  category: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: 5,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181818',
    lineHeight: 19,
    minHeight: 38,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c3aed',
    marginTop: 7,
    marginBottom: 9,
  },
  cartButton: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // empty
  emptyContainer: {
    flex: 1,
    minHeight: 550,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 70,
    color: '#bbb',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#181818',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#777',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 25,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 10,
  },
  shopButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },

  // admin
  adminSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  adminButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  adminButtonText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '800',
  },
});
