import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

type OrderItem = {
  id: string;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
};

type Order = {
  id: string;
  date: string;
  total: number;
  status: string;
  payment_method: string;
  items: OrderItem[];
};

export default function OrderHistoryScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // -----------------------------------------------
      // GET SAVED USER
      // -----------------------------------------------

      const savedUser =
        await AsyncStorage.getItem('loggedInUser');

      console.log(
        'ORDER HISTORY - saved user:',
        savedUser
      );

      if (!savedUser) {
        setOrders([]);
        setError(
          'Please login to view your orders.'
        );
        return;
      }

      const user = JSON.parse(savedUser);
      const userId = Number(user?.id);

      console.log(
        'ORDER HISTORY - user ID:',
        userId
      );

      if (!userId) {
        setOrders([]);
        setError(
          'User information is missing. Please login again.'
        );
        return;
      }

      // -----------------------------------------------
      // GET AUTH TOKEN
      // -----------------------------------------------

      const token =
        await AsyncStorage.getItem('authToken');

      console.log(
        'ORDER HISTORY - token exists:',
        token ? 'YES' : 'NO'
      );

      if (!token) {
        setOrders([]);
        setError(
          'Login session expired. Please login again.'
        );
        return;
      }

      // =================================================
      // GET ORDERS
      // =================================================

      const ordersUrl =
        `${API_BASE_URL}/api/orders/user/${userId}`;

      console.log(
        'ORDER HISTORY API:',
        ordersUrl
      );

      const response = await fetch(
        ordersUrl,
        {
          method: 'GET',

          headers: {
            Authorization: `Bearer ${token}`,
            'x-user-id': String(userId),
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      console.log(
        'ORDER HISTORY RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
          'Failed to fetch orders'
        );
      }

      if (
        !data?.success ||
        !Array.isArray(data.orders)
      ) {
        setOrders([]);
        return;
      }

      // =================================================
      // LOAD ITEMS FOR EVERY ORDER
      // =================================================

      const formattedOrders =
        await Promise.all(
          data.orders.map(
            async (order: any) => {
              let items: OrderItem[] = [];

              try {
                const itemsResponse =
                  await fetch(
                    `${API_BASE_URL}/api/orders/${order.id}`,
                    {
                      method: 'GET',

                      headers: {
                        Authorization:
                          `Bearer ${token}`,

                        'x-user-id':
                          String(userId),

                        'Content-Type':
                          'application/json',
                      },
                    }
                  );

                const itemsData =
                  await itemsResponse.json();

                console.log(
                  `ORDER ${order.id} ITEMS:`,
                  itemsData
                );

                if (
                  itemsResponse.ok &&
                  itemsData?.success &&
                  Array.isArray(
                    itemsData?.order?.items
                  )
                ) {
                  items =
                    itemsData.order.items.map(
                      (item: any) => ({
                        id: String(
                          item.id
                        ),

                        product_id:
                          Number(
                            item.product_id || 0
                          ),

                        name:
                          String(
                            item.product_name ||
                            'Product'
                          ),

                        price:
                          Number(
                            item.price || 0
                          ),

                        quantity:
                          Number(
                            item.quantity || 0
                          ),

                        image:
                          String(
                            item.product_image ||
                            ''
                          ),

                        category:
                          String(
                            item.category || ''
                          ),
                      })
                    );
                }
              } catch (itemError) {
                console.error(
                  `ITEM ERROR FOR ORDER ${order.id}:`,
                  itemError
                );
              }

              return {
                id: String(
                  order.id
                ),

                date:
                  order.created_at
                    ? new Date(
                        order.created_at
                      ).toLocaleDateString(
                        'en-IN'
                      )
                    : '',

                total:
                  Number(
                    order.total_amount || 0
                  ),

                status:
                  String(
                    order.order_status ||
                    'Placed'
                  ),

                payment_method:
                  String(
                    order.payment_method ||
                    ''
                  ),

                items,
              };
            }
          )
        );

      console.log(
        'FINAL ORDERS:',
        formattedOrders
      );

      setOrders(
        formattedOrders
      );
    } catch (err: any) {
      console.error(
        'LOAD ORDERS ERROR:',
        err
      );

      setOrders([]);

      setError(
        err?.message ||
        'Unable to load orders.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // LOAD EVERY TIME PAGE OPENS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  // =====================================================
  // TRACK ORDER
  // =====================================================

  const handleTrackOrder = (
    orderId: string
  ) => {
    router.push({
      pathname:
        '/order-tracking/[id]',
      params: {
        id: String(orderId),
      },
    });
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const handleCancelOrder = (
    orderId: string
  ) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },

        {
          text: 'Yes, Cancel',
          style: 'destructive',

          onPress: async () => {
            try {
              setCancellingId(
                orderId
              );

              // -----------------------------------------
              // GET USER
              // -----------------------------------------

              const savedUser =
                await AsyncStorage.getItem(
                  'loggedInUser'
                );

              if (!savedUser) {
                Alert.alert(
                  'Login Required',
                  'Please login again.'
                );

                return;
              }

              const user =
                JSON.parse(
                  savedUser
                );

              const userId =
                Number(user?.id);

              if (!userId) {
                Alert.alert(
                  'Login Error',
                  'Invalid user.'
                );

                return;
              }

              // -----------------------------------------
              // GET TOKEN
              // -----------------------------------------

              const token =
                await AsyncStorage.getItem(
                  'authToken'
                );

              if (!token) {
                Alert.alert(
                  'Login Required',
                  'Your login session has expired. Please login again.'
                );

                return;
              }

              // -----------------------------------------
              // CANCEL API
              // -----------------------------------------

              const response =
                await fetch(
                  `${API_BASE_URL}/api/orders/${orderId}/cancel`,
                  {
                    method: 'PUT',

                    headers: {
                      'Content-Type':
                        'application/json',

                      Authorization:
                        `Bearer ${token}`,

                      'x-user-id':
                        String(userId),
                    },

                    body:
                      JSON.stringify({
                        user_id:
                          userId,
                      }),
                  }
                );

              const data =
                await response.json();

              console.log(
                'CANCEL RESPONSE:',
                data
              );

              if (!response.ok) {
                throw new Error(
                  data?.message ||
                  'Unable to cancel order'
                );
              }

              if (!data?.success) {
                throw new Error(
                  data?.message ||
                  'Unable to cancel order'
                );
              }

              Alert.alert(
                'Order Cancelled',
                'Your order has been cancelled successfully.'
              );

              await loadOrders();
            } catch (err: any) {
              console.error(
                'CANCEL ORDER ERROR:',
                err
              );

              Alert.alert(
                'Cancel Failed',
                err?.message ||
                'Unable to cancel this order.'
              );
            } finally {
              setCancellingId(
                null
              );
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            My Orders
          </Text>

          <View
            style={{
              width: 42,
            }}
          />
        </View>

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#7c3aed"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading your orders...
          </Text>
        </View>
      </View>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <View
      style={styles.container}
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backText}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          My Orders
        </Text>

        <View
          style={{
            width: 42,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ERROR */}

        {error ? (
          <View
            style={
              styles.errorContainer
            }
          >
            <Text
              style={
                styles.errorIcon
              }
            >
              ⚠
            </Text>

            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to Load Orders
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={
                loadOrders
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          /* EMPTY */

          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              📦
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No Orders Yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Your placed orders will
              appear here.
            </Text>

            <TouchableOpacity
              style={
                styles.shopButton
              }
              onPress={() =>
                router.push(
                  '/(tabs)' as any
                )
              }
            >
              <Text
                style={
                  styles.shopButtonText
                }
              >
                Start Shopping
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ORDERS */

          <>
            <Text
              style={
                styles.countText
              }
            >
              {orders.length}{' '}
              {orders.length === 1
                ? 'order'
                : 'orders'}
            </Text>

            {orders.map(
              (order) => (
                <View
                  key={order.id}
                  style={
                    styles.orderCard
                  }
                >
                  {/* ORDER HEADER */}

                  <View
                    style={
                      styles.orderHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.orderId
                        }
                      >
                        Order #
                        {order.id}
                      </Text>

                      <Text
                        style={
                          styles.date
                        }
                      >
                        {order.date}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.status,

                        String(
                          order.status
                        ).toLowerCase() ===
                          'cancelled' &&
                          styles.cancelledStatus,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>

                  {/* PAYMENT */}

                  <Text
                    style={
                      styles.paymentText
                    }
                  >
                    Payment:{' '}
                    {order.payment_method}
                  </Text>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  {/* ITEMS */}

                  {order.items.length ===
                  0 ? (
                    <Text
                      style={
                        styles.noItemsText
                      }
                    >
                      Product details unavailable
                    </Text>
                  ) : (
                    order.items.map(
                      (item) => (
                        <View
                          key={
                            item.id
                          }
                          style={
                            styles.itemRow
                          }
                        >
                          <View
                            style={
                              styles.itemInfo
                            }
                          >
                            <Text
                              style={
                                styles.itemName
                              }
                              numberOfLines={
                                2
                              }
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={
                                styles.quantity
                              }
                            >
                              Qty:{' '}
                              {
                                item.quantity
                              }
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.itemPrice
                            }
                          >
                            ₹
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </Text>
                        </View>
                      )
                    )
                  )}

                  <View
                    style={
                      styles.divider
                    }
                  />

                  {/* TOTAL */}

                  <View
                    style={
                      styles.totalRow
                    }
                  >
                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      Total
                    </Text>

                    <Text
                      style={
                        styles.total
                      }
                    >
                      ₹
                      {order.total.toLocaleString(
                        'en-IN'
                      )}
                    </Text>
                  </View>

                  {/* TRACK ORDER */}

                  <TouchableOpacity
                    style={
                      styles.trackButton
                    }
                    onPress={() =>
                      handleTrackOrder(
                        order.id
                      )
                    }
                    activeOpacity={
                      0.8
                    }
                  >
                    <Text
                      style={
                        styles.trackIcon
                      }
                    >
                      🚚
                    </Text>

                    <Text
                      style={
                        styles.trackText
                      }
                    >
                      Track Order
                    </Text>
                  </TouchableOpacity>

                  {/* VIEW DETAILS */}

                  {String(
                    order.status
                  ).toLowerCase() !==
                    'cancelled' && (
                    <TouchableOpacity
                      style={
                        styles.cancelButton
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            '/order-details/[id]',
                          params: {
                            id: String(
                              order.id
                            ),
                          },
                        })
                      }
                    >
                      <Text
                        style={
                          styles.cancelText
                        }
                      >
                        View Details
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}
          </>
        )}

        <View
          style={{
            height: 40,
          }}
        />
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },

  countText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 12,
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

  errorContainer: {
    flex: 1,
    minHeight: 550,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  errorIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  errorTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#181818',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 10,
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 10,
  },

  retryText: {
    color: '#fff',
    fontWeight: '800',
  },

  orderCard: {
    backgroundColor: '#ffffff',
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

  cancelledStatus: {
    color: '#dc2626',
  },

  paymentText: {
    marginTop: 10,
    fontSize: 12,
    color: '#777',
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

  noItemsText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
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

  trackButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 15,
  },

  trackIcon: {
    fontSize: 17,
    marginRight: 7,
  },

  trackText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  cancelButton: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff7f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  cancelText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },
});