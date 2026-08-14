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

export default function WishlistScreen() {
  const router = useRouter();

  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          My Wishlist
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* EMPTY */}
        {wishlist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♡</Text>

            <Text style={styles.emptyTitle}>
              Your Wishlist is Empty
            </Text>

            <Text style={styles.emptyText}>
              Save products you love and find them here later.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                router.push('/(tabs)' as any)
              }
            >
              <Text style={styles.shopButtonText}>
                Explore Products
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {wishlist.length}{' '}
              {wishlist.length === 1
                ? 'item'
                : 'items'}{' '}
              saved
            </Text>

            {wishlist.map((product) => (
              <View
                key={product.id}
                style={styles.productCard}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.imageWrapper}
                  onPress={() =>
                    router.push({
                      pathname: '/product/[id]',
                      params: {
                        id: product.id,
                      },
                    })
                  }
                >
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />
                </TouchableOpacity>

                <View style={styles.productInfo}>
                  <Text style={styles.category}>
                    {product.category}
                  </Text>

                  <Text
                    style={styles.productName}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  <Text style={styles.price}>
                    ₹
                    {product.price.toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.cartButton}
                      onPress={() =>
                        addToCart(product)
                      }
                    >
                      <Text style={styles.cartButtonText}>
                        Add to Cart
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() =>
                        removeFromWishlist(product.id)
                      }
                    >
                      <Text style={styles.removeText}>
                        ♥
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

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

  content: {
    padding: 14,
    paddingBottom: 40,
    flexGrow: 1,
  },

  countText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 12,
  },

  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },

  imageWrapper: {
    width: 115,
    height: 115,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eeeeee',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  category: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: 5,
  },

  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181818',
  },

  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7c3aed',
    marginTop: 7,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  cartButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 9,
    marginLeft: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeText: {
    color: '#ef4444',
    fontSize: 19,
  },

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