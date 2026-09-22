import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OrderSuccessScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  // =====================================================
  // ORDER ID
  // =====================================================

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  // =====================================================
  // TOTAL
  // =====================================================

  const totalParam = Array.isArray(params.total)
    ? params.total[0]
    : params.total;

  const total = Number(totalParam || 0);

  // =====================================================
  // TRACK ORDER
  // =====================================================

  const handleTrackOrder = () => {
    if (!orderId) {
      console.log('Order ID missing');
      return;
    }

    console.log(
      'Opening tracking for order:',
      orderId
    );

    router.push({
      pathname: '/order-tracking/[id]',
      params: {
        id: String(orderId),
      },
    });
  };

  // =====================================================
  // VIEW ORDERS
  // =====================================================

  const handleViewOrders = () => {
    router.replace(
      '/order-history' as any
    );
  };

  // =====================================================
  // CONTINUE SHOPPING
  // =====================================================

  const handleContinueShopping = () => {
    router.replace(
      '/(tabs)' as any
    );
  };

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>

          {/* =================================================
              SUCCESS ICON
              ================================================= */}

          <View style={styles.successCircle}>
            <Text style={styles.check}>
              ✓
            </Text>
          </View>

          {/* =================================================
              TITLE
              ================================================= */}

          <Text style={styles.title}>
            Order Placed Successfully!
          </Text>

          <Text style={styles.message}>
            Thank you for shopping with ShopEase.
            Your order has been placed successfully.
          </Text>

          {/* =================================================
              ORDER DETAILS
              ================================================= */}

          <View style={styles.detailsBox}>

            {/* ORDER ID */}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Order ID
              </Text>

              <Text style={styles.detailValue}>
                {orderId
                  ? `#${orderId}`
                  : 'Processing'}
              </Text>
            </View>

            {/* TOTAL */}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Total Amount
              </Text>

              <Text style={styles.amountValue}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* STATUS */}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Order Status
              </Text>

              <Text style={styles.statusValue}>
                Placed
              </Text>
            </View>

            {/* PAYMENT */}

            <View
              style={[
                styles.detailRow,
                { marginBottom: 0 },
              ]}
            >
              <Text style={styles.detailLabel}>
                Payment
              </Text>

              <Text style={styles.detailValue}>
                Cash on Delivery
              </Text>
            </View>

          </View>

          {/* =================================================
              TRACK ORDER
              ================================================= */}

          {orderId ? (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={handleTrackOrder}
              activeOpacity={0.8}
            >
              <Text style={styles.trackIcon}>
                🚚
              </Text>

              <Text style={styles.trackText}>
                Track This Order
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noOrderBox}>
              <Text style={styles.noOrderText}>
                Order ID is still processing...
              </Text>
            </View>
          )}

          {/* =================================================
              VIEW MY ORDERS
              ================================================= */}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewOrders}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryText}>
              View My Orders
            </Text>
          </TouchableOpacity>

          {/* =================================================
              CONTINUE SHOPPING
              ================================================= */}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryText}>
              Continue Shopping
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },

  // ===================================================
  // SUCCESS
  // ===================================================

  successCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  check: {
    fontSize: 46,
    fontWeight: '800',
    color: '#16a34a',
  },

  // ===================================================
  // TITLE
  // ===================================================

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#181818',
    textAlign: 'center',
  },

  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },

  // ===================================================
  // DETAILS
  // ===================================================

  detailsBox: {
    width: '100%',
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f7f5ff',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  detailLabel: {
    fontSize: 13,
    color: '#666',
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    maxWidth: '58%',
    textAlign: 'right',
  },

  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c3aed',
  },

  statusValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },

  // ===================================================
  // TRACK BUTTON
  // ===================================================

  trackButton: {
    width: '100%',
    height: 54,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },

  trackIcon: {
    fontSize: 19,
    marginRight: 8,
  },

  trackText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },

  // ===================================================
  // NO ORDER
  // ===================================================

  noOrderBox: {
    width: '100%',
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
  },

  noOrderText: {
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '600',
  },

  // ===================================================
  // VIEW ORDERS
  // ===================================================

  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  primaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  // ===================================================
  // CONTINUE
  // ===================================================

  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  secondaryText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '700',
  },
});