import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OrderSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.successCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>
          Order Placed Successfully!
        </Text>

        <Text style={styles.message}>
          Thank you for shopping with ShopEase.
          Your order has been placed successfully.
        </Text>

        <View style={styles.orderBox}>
          <Text style={styles.orderLabel}>
            Order Status
          </Text>

          <Text style={styles.orderStatus}>
            Confirmed
          </Text>
        </View>

        {/* VIEW MY ORDERS */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.push('/order-history' as any)
          }
        >
          <Text style={styles.primaryText}>
            View My Orders
          </Text>
        </TouchableOpacity>

        {/* CONTINUE SHOPPING */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push('/(tabs)' as any)
          }
        >
          <Text style={styles.secondaryText}>
            Continue Shopping
          </Text>
        </TouchableOpacity>

        {/* GO TO HOME */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() =>
            router.push('/(tabs)' as any)
          }
        >
          <Text style={styles.homeText}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },

  successCircle: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },

  check: {
    fontSize: 48,
    fontWeight: '800',
    color: '#16a34a',
  },

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
    marginTop: 12,
  },

  orderBox: {
    width: '100%',
    marginTop: 25,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f5ff',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  orderLabel: {
    fontSize: 14,
    color: '#666',
  },

  orderStatus: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7c3aed',
  },

  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  primaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

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

  homeButton: {
    marginTop: 10,
    paddingVertical: 10,
  },

  homeText: {
    color: '#777',
    fontSize: 14,
    fontWeight: '600',
  },
});