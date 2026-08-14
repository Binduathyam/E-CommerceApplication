import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useOrders } from '../../context/OrderContext';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { orders } = useOrders();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          My Orders
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>

            <Text style={styles.emptyTitle}>
              No Orders Yet
            </Text>

            <Text style={styles.emptyText}>
              Your placed orders will appear here.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                router.push('/(tabs)' as any)
              }
            >
              <Text style={styles.shopButtonText}>
                Start Shopping
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => (
            <View
              key={order.id}
              style={styles.orderCard}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>
                    {order.id}
                  </Text>

                  <Text style={styles.date}>
                    {order.date}
                  </Text>
                </View>

                <Text style={styles.status}>
                  {order.status}
                </Text>
              </View>

              <View style={styles.divider} />

              {order.items.map((item) => (
                <View
                  key={item.id}
                  style={styles.itemRow}
                >
                  <View style={styles.itemInfo}>
                    <Text
                      style={styles.itemName}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <Text style={styles.quantity}>
                      Qty: {item.quantity}
                    </Text>
                  </View>

                  <Text style={styles.itemPrice}>
                    ₹
                    {(
                      item.price * item.quantity
                    ).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.total}>
                  ₹
                  {order.total.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ))
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
    justifyContent: 'center',
    alignItems: 'center',
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

  emptyContainer: {
    flex: 1,
    minHeight: 550,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#181818',
  },

  emptyText: {
    marginTop: 8,
    color: '#777',
    fontSize: 14,
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
    color: '#fff',
    fontWeight: '800',
  },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#181818',
  },

  date: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },

  status: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 14,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  quantity: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181818',
  },

  total: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7c3aed',
  },
});
