import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

type CartItem = {
  id: number | string;
  cartItemId?: number | string; // same as web: separates variants of one product
  name: string;
  image?: string;
  price: number | string;
  quantity: number;
  category?: string;
  gst_rate?: number | string;
  [key: string]: any;
};

// Web uses cartItemId. Fall back to id if the mobile cart does not have it yet.
const getItemKey = (item: CartItem) => item.cartItemId ?? item.id;

const formatMoney = (value: number) =>
  value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CartScreen() {
  const router = useRouter();

  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } =
    useCart();

  const { addToWishlist } = useWishlist();

  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [actionItem, setActionItem] = useState<CartItem | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);

  /* =====================================================
     CALCULATIONS (same as web)
  ===================================================== */

  const subtotal = cartItems.reduce(
    (sum: number, item: CartItem) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const gstAmount = cartItems.reduce((sum: number, item: CartItem) => {
    const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
    const gstRate = Number(item.gst_rate) || 0;
    return sum + (itemTotal * gstRate) / 100;
  }, 0);

  const totalItems = cartItems.reduce(
    (sum: number, item: CartItem) => sum + Number(item.quantity || 0),
    0
  );

  const deliveryFee = subtotal >= 999 ? 0 : 40;
  const platformFee = subtotal > 0 ? 10 : 0;
  const couponDiscount = couponApplied ? 100 : 0;
  const savings = couponDiscount + (subtotal >= 999 ? 40 : 0);

  const amountPayable = Math.max(
    0,
    subtotal + gstAmount + deliveryFee + platformFee - couponDiscount
  );

  /* =====================================================
     ACTIONS
  ===================================================== */

  const applyCoupon = () => {
    if (!coupon.trim()) {
      Alert.alert('Coupon', 'Please enter a coupon code.');
      return;
    }
    setCouponApplied(true);
    Alert.alert('Coupon Applied', 'You saved ₹100 on this order.');
  };

  const handleRemove = () => {
    if (!actionItem) return;
    removeFromCart(getItemKey(actionItem));
    setActionItem(null);
  };

  // Saves the product to the wishlist FIRST.
  // The cart item is removed only if the wishlist save worked,
  // so the product is never lost.
  const handleMoveToWishlist = async () => {
    if (!actionItem) return;

    const item = actionItem;
    setActionItem(null);

    const saved = await addToWishlist({
      id: String(item.id),
      name: item.name,
      category: item.category || '',
      price: Number(item.price || 0),
      image: item.image || '',
    });

    if (!saved) {
      Alert.alert(
        'Wishlist',
        'Could not move this product to your wishlist. Please login and try again.'
      );
      return;
    }

    await removeFromCart(getItemKey(item));

    Alert.alert(
      'Moved to Wishlist',
      `${item.name} has been moved to your wishlist.`
    );
  };

  /* =====================================================
     HEADER (shared by empty + full cart)
  ===================================================== */

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Cart</Text>

      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => router.push('/wishlist' as any)}
      >
        <Text style={styles.heartText}>♡</Text>
      </TouchableOpacity>
    </View>
  );

  /* =====================================================
     EMPTY CART
  ===================================================== */

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        {header}

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Add products to your cart and they will appear here.
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* =====================================================
     MAIN CART
  ===================================================== */

  return (
    <View style={styles.container}>
      {header}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CART PRODUCTS */}

        {cartItems.map((item: CartItem) => {
          const itemTotal =
            Number(item.price || 0) * Number(item.quantity || 0);

          return (
            <View key={String(getItemKey(item))} style={styles.productCard}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/200' }}
                style={styles.productImage}
              />

              <View style={styles.productInfo}>
                {!!item.category && (
                  <Text style={styles.category} numberOfLines={1}>
                    {item.category}
                  </Text>
                )}

                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>

                <Text style={styles.productPrice}>
                  ₹{Number(item.price || 0).toLocaleString('en-IN')}
                </Text>

                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => decreaseQuantity(getItemKey(item))}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.quantity}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => increaseQuantity(getItemKey(item))}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.productActions}>
                <Text style={styles.itemTotal}>
                  ₹{itemTotal.toLocaleString('en-IN')}
                </Text>

                <TouchableOpacity
                  onPress={() => setActionItem(item)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* COUPON */}

        <View style={styles.couponSection}>
          <View style={styles.couponTop}>
            <View style={styles.couponIconContainer}>
              <Text style={styles.couponIcon}>%</Text>
            </View>

            <View style={styles.couponContent}>
              <Text style={styles.couponTitle}>Apply Coupon</Text>
              <Text style={styles.couponSubtitle}>
                Save more with available coupons
              </Text>
            </View>
          </View>

          <View style={styles.couponAction}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon"
              placeholderTextColor="#999"
              value={coupon}
              editable={!couponApplied}
              onChangeText={setCoupon}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.applyButton, couponApplied && styles.appliedButton]}
              onPress={applyCoupon}
              disabled={couponApplied}
            >
              <Text style={styles.applyButtonText}>
                {couponApplied ? 'Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ORDER DETAILS */}

        <View style={styles.orderDetails}>
          <Text style={styles.orderDetailsTitle}>Order Details</Text>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Total ({totalItems} items)</Text>
            <Text style={styles.orderValue}>
              ₹{subtotal.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Savings</Text>
            <Text style={styles.greenValue}>
              ₹{savings.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Coupon Savings</Text>
            <Text style={styles.greenValue}>
              ₹{couponDiscount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Delivery Fee</Text>
            <Text style={styles.greenValue}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Platform Fee</Text>
            <Text style={styles.orderValue}>₹{platformFee}</Text>
          </View>

          {/* GST (new, same as web) */}
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>GST</Text>
            <Text style={styles.orderValue}>₹{formatMoney(gstAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Payable</Text>
            <Text style={styles.amountValue}>
              ₹{formatMoney(amountPayable)}
            </Text>
          </View>

          <View style={styles.policyBox}>
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>Return Policy / Refund</Text>
              <Text style={styles.policySubtitle}>
                Check return and refund information
              </Text>
            </View>

            <TouchableOpacity onPress={() => setShowPolicy(true)}>
              <Text style={styles.readMore}>Read more</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PAY BAR */}

        <View style={styles.payBar}>
          <View style={styles.payTotal}>
            <Text style={styles.payTotalLabel}>Total Amount</Text>
            <Text style={styles.payTotalValue}>
              ₹{formatMoney(amountPayable)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.payNowButton}
            onPress={() => router.push('/checkout' as any)}
          >
            <Text style={styles.payNowText}>Pay Now →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 25 }} />
      </ScrollView>

      {/* ACTION POPUP */}

      <Modal
        visible={!!actionItem}
        transparent
        animationType="fade"
        onRequestClose={() => setActionItem(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.actionPopup}>
            <Text style={styles.popupTitle}>What do you want to do?</Text>

            <Text style={styles.popupDescription}>
              Choose an action for{' '}
              <Text style={styles.popupProduct}>"{actionItem?.name}"</Text>
            </Text>

            <TouchableOpacity style={styles.removeAction} onPress={handleRemove}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.removeActionText}>Remove</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.wishlistAction}
              onPress={handleMoveToWishlist}
            >
              <Text style={styles.actionIcon}>♡</Text>
              <Text style={styles.wishlistActionText}>Move to Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelAction}
              onPress={() => setActionItem(null)}
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RETURN POLICY MODAL */}

      <Modal
        visible={showPolicy}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPolicy(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.policyModal}>
            <View style={styles.policyHeader}>
              <Text style={styles.policyModalTitle}>Return Policy / Refund</Text>

              <TouchableOpacity onPress={() => setShowPolicy(false)}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.policyText}>
                Products can be returned according to the return eligibility and
                return period applicable to the order.
              </Text>

              <Text style={styles.policyText}>
                Refunds are processed after the returned product is received and
                the return is successfully verified.
              </Text>

              <Text style={styles.policyText}>
                For damaged, incorrect, or incomplete products, select the
                appropriate return reason while submitting your return request.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.closePolicyButton}
              onPress={() => setShowPolicy(false)}
            >
              <Text style={styles.closePolicyText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =====================================================
   STYLES (unchanged)
===================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  content: { padding: 14, paddingBottom: 40 },

  /* HEADER */
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#fff',
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
  backText: { fontSize: 32, color: '#222', marginTop: -4 },
  title: { fontSize: 19, fontWeight: '800', color: '#181818' },
  heartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: { fontSize: 27, color: '#7c3aed', marginTop: -2 },

  /* EMPTY */
  emptyContainer: {
    flex: 1,
    minHeight: 550,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: { fontSize: 65, marginBottom: 18 },
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
  shopButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  /* PRODUCT */
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 100,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    paddingRight: 5,
  },
  category: {
    fontSize: 11,
    color: '#8b8b8b',
    fontWeight: '600',
    marginBottom: 3,
  },
  productName: { fontSize: 15, fontWeight: '700', color: '#181818' },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c3aed',
    marginTop: 6,
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { fontSize: 20, color: '#222' },
  quantity: { fontSize: 15, fontWeight: '700', marginHorizontal: 13 },
  productActions: {
    width: 75,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#181818',
    textAlign: 'right',
  },
  removeButton: { paddingVertical: 5, paddingHorizontal: 2 },
  removeText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },

  /* COUPON */
  couponSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  couponTop: { flexDirection: 'row', alignItems: 'center' },
  couponIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponIcon: { fontSize: 21, fontWeight: '900', color: '#7c3aed' },
  couponContent: { flex: 1, marginLeft: 11 },
  couponTitle: { fontSize: 16, fontWeight: '800', color: '#181818' },
  couponSubtitle: { marginTop: 3, fontSize: 12, color: '#777' },
  couponAction: { flexDirection: 'row', marginTop: 14 },
  couponInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 9,
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 13,
  },
  applyButton: {
    width: 85,
    height: 45,
    marginLeft: 8,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedButton: { backgroundColor: '#16a34a' },
  applyButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  /* ORDER DETAILS */
  orderDetails: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginTop: 2,
  },
  orderDetailsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
    marginBottom: 18,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  orderLabel: { color: '#666', fontSize: 14 },
  orderValue: { color: '#222', fontSize: 14, fontWeight: '600' },
  greenValue: { color: '#16a34a', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#eeeeee', marginVertical: 6 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  amountLabel: { fontSize: 17, fontWeight: '800', color: '#181818' },
  amountValue: { fontSize: 18, fontWeight: '800', color: '#7c3aed' },
  policyBox: {
    marginTop: 18,
    padding: 13,
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  policyContent: { flex: 1, paddingRight: 10 },
  policyTitle: { fontSize: 13, fontWeight: '800', color: '#581c87' },
  policySubtitle: { marginTop: 3, fontSize: 11, color: '#7e22ce' },
  readMore: { fontSize: 12, fontWeight: '800', color: '#7c3aed' },

  /* PAY BAR */
  payBar: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
  },
  payTotal: { flex: 1, paddingLeft: 4 },
  payTotalLabel: { fontSize: 11, color: '#777' },
  payTotalValue: {
    marginTop: 2,
    fontSize: 19,
    fontWeight: '900',
    color: '#181818',
  },
  payNowButton: {
    minWidth: 135,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  payNowText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* POPUP */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionPopup: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  popupTitle: { fontSize: 20, fontWeight: '800', color: '#181818' },
  popupDescription: {
    marginTop: 8,
    color: '#777',
    fontSize: 13,
    lineHeight: 19,
  },
  popupProduct: { color: '#181818', fontWeight: '800' },
  actionIcon: { fontSize: 20, marginRight: 10 },
  removeAction: {
    height: 50,
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  removeActionText: { color: '#dc2626', fontSize: 14, fontWeight: '800' },
  wishlistAction: {
    height: 50,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  wishlistActionText: { color: '#7c3aed', fontSize: 14, fontWeight: '800' },
  cancelAction: {
    height: 50,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionText: { color: '#374151', fontSize: 14, fontWeight: '700' },

  /* POLICY MODAL */
  policyModal: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  policyModalTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },
  policyText: { fontSize: 13, color: '#555', lineHeight: 21, marginBottom: 14 },
  closePolicyButton: {
    height: 48,
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePolicyText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  closeText: { fontSize: 28, color: '#374151', lineHeight: 30 },
});
