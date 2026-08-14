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

export default function CartScreen() {
  const router = useRouter();

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

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

        <Text style={styles.title}>My Cart</Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* EMPTY CART */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>

            <Text style={styles.emptyTitle}>
              Your cart is empty
            </Text>

            <Text style={styles.emptyText}>
              Add products to your cart and they will appear here.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)',
                })
              }
            >
              <Text style={styles.shopButtonText}>
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* CART ITEMS */}
            {cartItems.map((item) => (
              <View
                key={item.id}
                style={styles.productCard}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                />

                <View style={styles.productInfo}>
                  <Text
                    style={styles.productName}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                  <Text style={styles.productPrice}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.bottomRow}>
                    {/* QUANTITY */}
                    <View style={styles.quantityRow}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          decreaseQuantity(item.id)
                        }
                      >
                        <Text style={styles.quantityButtonText}>
                          −
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.quantity}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          increaseQuantity(item.id)
                        }
                      >
                        <Text style={styles.quantityButtonText}>
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* REMOVE */}
                    <TouchableOpacity
                      onPress={() =>
                        removeFromCart(item.id)
                      }
                    >
                      <Text style={styles.removeText}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* ORDER SUMMARY */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>
                Order Summary
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>
                  Subtotal
                </Text>

                <Text style={styles.value}>
                  ₹{cartTotal.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>
                  Delivery
                </Text>

                <Text style={styles.free}>
                  FREE
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.totalValue}>
                  ₹{cartTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* CHECKOUT */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() =>
                router.push('/checkout' as any)
              }
            >
              <Text style={styles.checkoutText}>
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </>
        )}
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

  /* EMPTY CART */

  emptyContainer: {
    flex: 1,
    minHeight: 550,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 65,
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

  /* PRODUCT */

  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
  },

  productImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
  },

  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181818',
  },

  productPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7c3aed',
    marginTop: 7,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityButtonText: {
    fontSize: 21,
    color: '#222',
  },

  quantity: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 15,
  },

  removeText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },

  /* SUMMARY */

  summary: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
    marginTop: 5,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
    marginBottom: 18,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  label: {
    color: '#666',
    fontSize: 14,
  },

  value: {
    color: '#222',
    fontSize: 14,
    fontWeight: '600',
  },

  free: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 5,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181818',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7c3aed',
  },

  /* CHECKOUT */

  checkoutButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  checkoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  /* CONTINUE SHOPPING */

  continueButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  continueText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '700',
  },
});