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
import {
  useWishlist,
} from '../../context/WishlistContext';

export default function WishlistScreen() {
  const router = useRouter();

  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  return (
    <View style={styles.container}>

      {/* =================================
          HEADER
      ================================= */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          My Wishlist
        </Text>

        <View style={styles.headerSpace} />

      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* =================================
            EMPTY
        ================================= */}

        {wishlist.length === 0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text style={styles.emptyIcon}>
              ♡
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              Your Wishlist is Empty
            </Text>

            <Text
              style={styles.emptyText}
            >
              Save products you love and find
              them here later.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                router.push(
                  '/(tabs)' as any
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.shopButtonText
                }
              >
                Explore Products
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* =================================
                COUNT
            ================================= */}

            <View
              style={
                styles.countContainer
              }
            >
              <Text
                style={styles.countText}
              >
                {wishlist.length}{' '}
                {wishlist.length === 1
                  ? 'item'
                  : 'items'}{' '}
                saved
              </Text>
            </View>

            {/* =================================
                GRID
            ================================= */}

            <View
              style={styles.productGrid}
            >
              {wishlist.map(
                (product) => (
                  <View
                    key={product.id}
                    style={
                      styles.productCard
                    }
                  >

                    {/* IMAGE */}

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={
                        styles.imageWrapper
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            '/product/[id]',
                          params: {
                            id:
                              product.id,
                          },
                        })
                      }
                    >
                      <Image
                        source={{
                          uri:
                            product.image,
                        }}
                        style={
                          styles.productImage
                        }
                        resizeMode="cover"
                      />

                      {/* HEART */}

                      <TouchableOpacity
                        style={
                          styles.favoriteButton
                        }
                        onPress={() =>
                          removeFromWishlist(
                            product.id
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={
                            styles.favoriteIcon
                          }
                        >
                          ♥
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>

                    {/* INFO */}

                    <View
                      style={
                        styles.productInfo
                      }
                    >

                      <Text
                        style={
                          styles.category
                        }
                        numberOfLines={1}
                      >
                        {product.category}
                      </Text>

                      <Text
                        style={
                          styles.productName
                        }
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>

                      <Text
                        style={styles.price}
                      >
                        ₹
                        {Number(
                          product.price
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </Text>

                      {/* ADD CART */}

                      <TouchableOpacity
                        style={
                          styles.cartButton
                        }
                        onPress={() =>
                          addToCart(
                            product
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={
                            styles.cartButtonText
                          }
                        >
                          🛒 Add to Cart
                        </Text>
                      </TouchableOpacity>

                      {/* REMOVE */}

                      <TouchableOpacity
                        style={
                          styles.removeButton
                        }
                        onPress={() =>
                          removeFromWishlist(
                            product.id
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={
                            styles.removeText
                          }
                        >
                          Remove from Wishlist
                        </Text>
                      </TouchableOpacity>

                    </View>

                  </View>
                )
              )}
            </View>
          </>
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

  // =======================================
  // HEADER
  // =======================================

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
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

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },

  headerSpace: {
    width: 42,
  },

  // =======================================
  // CONTENT
  // =======================================

  content: {
    padding: 12,
    paddingBottom: 40,
  },

  countContainer: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  countText: {
    fontSize: 13,
    color: '#777',
  },

  // =======================================
  // GRID
  // =======================================

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // =======================================
  // PRODUCT CARD
  // =======================================

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

  // =======================================
  // IMAGE
  // =======================================

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

  favoriteButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  favoriteIcon: {
    color: '#ef4444',
    fontSize: 19,
  },

  // =======================================
  // PRODUCT INFO
  // =======================================

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

  // =======================================
  // CART
  // =======================================

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
  },

  // =======================================
  // REMOVE
  // =======================================

  removeButton: {
    width: '100%',
    height: 32,
    marginTop: 7,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
  },

  // =======================================
  // EMPTY
  // =======================================

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
});