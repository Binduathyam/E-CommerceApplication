import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

type HistoryOrder = {
  id: number;
  user_id?: number;
  address_id?: number | null;

  total_amount?: number | string;

  payment_method?: string;
  payment_status?: string;

  order_status?: string;
  delivery_status?: string;

  return_status?: string | null;
  return_reason?: string | null;
  return_requested_at?: string | null;

  shipping_address?: any;

  created_at?: string;
  assigned_at?: string | null;
  delivered_at?: string | null;

  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  address_name?: string;
  address_phone?: string;

  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;

  priority?: string;

  delivery_address?: string;

  name?: string;
  user_name?: string;

  phone?: string;
  phone_number?: string;

  [key: string]: any;
};

export default function DeliveryHistoryScreen() {
  const router = useRouter();

  const [orders, setOrders] =
    React.useState<HistoryOrder[]>([]);

  const [loading, setLoading] =
    React.useState(true);

  const [refreshing, setRefreshing] =
    React.useState(false);

  // ============================================
  // GET DELIVERY PARTNER
  // ============================================

  const getDeliveryPartner = async () => {
    const savedUser =
      await AsyncStorage.getItem(
        'loggedInUser'
      );

    if (!savedUser) {
      router.replace('/login');
      return null;
    }

    let user: any;

    try {
      user = JSON.parse(savedUser);
    } catch {
      await AsyncStorage.multiRemove([
        'loggedInUser',
        'authToken',
        'userRole',
      ]);

      router.replace('/login');
      return null;
    }

    if (user?.role !== 'delivery') {
      router.replace('/login');
      return null;
    }

    if (!user?.id) {
      throw new Error(
        'Delivery partner ID not found.'
      );
    }

    return user;
  };

  // ============================================
  // GET CUSTOMER NAME
  // SAME LOGIC AS MY DELIVERIES
  // ============================================

  const getCustomerName = (
    order: HistoryOrder
  ) => {
    return (
      order.customer_name ||
      order.address_name ||
      order.name ||
      order.user_name ||
      'Customer'
    );
  };

  // ============================================
  // GET CUSTOMER PHONE
  // SAME LOGIC AS MY DELIVERIES
  // ============================================

  const getCustomerPhone = (
    order: HistoryOrder
  ) => {
    return (
      order.customer_phone ||
      order.address_phone ||
      order.phone ||
      order.phone_number ||
      'Not available'
    );
  };

  // ============================================
  // LOAD HISTORY
  //
  // IMPORTANT:
  // Uses SAME API as My Deliveries
  // ============================================

  const loadHistory = async () => {
    try {
      setLoading(true);

      const deliveryPartner =
        await getDeliveryPartner();

      if (!deliveryPartner?.id) {
        return;
      }

      // ==========================================
      // GET JWT TOKEN
      // ==========================================

      const token =
        await AsyncStorage.getItem(
          'authToken'
        );

      if (!token) {
        throw new Error(
          'Authentication required. Please login again.'
        );
      }

      // ==========================================
      // SAME API AS MY DELIVERIES
      // ==========================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/delivery/my-orders/${deliveryPartner.id}`,
          {
            method: 'GET',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(
                  deliveryPartner.id
                ),
            },
          }
        );

      let data: any;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          'Server returned an invalid response.'
        );
      }

      console.log(
        'HISTORY - MY ORDERS RESPONSE:',
        data
      );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            'Failed to load delivery history.'
        );
      }

      // ==========================================
      // GET SAME ORDERS AS MY DELIVERIES
      // ==========================================

      const allOrders: HistoryOrder[] =
        Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
          ? data.data
          : [];

      console.log(
        'HISTORY - ALL ORDERS:',
        JSON.stringify(
          allOrders,
          null,
          2
        )
      );

      // ==========================================
      // HISTORY = DELIVERED / CANCELLED
      // RETURN COMPLETED ALSO INCLUDED
      // ==========================================

      const historyOrders =
        allOrders.filter(
          (order) => {
            const deliveryStatus =
              String(
                order?.delivery_status ||
                  ''
              )
                .trim()
                .toLowerCase();

            const orderStatus =
              String(
                order?.order_status ||
                  ''
              )
                .trim()
                .toLowerCase();

            const returnStatus =
              String(
                order?.return_status ||
                  ''
              )
                .trim()
                .toLowerCase();

            return (
              deliveryStatus ===
                'delivered' ||
              deliveryStatus ===
                'cancelled' ||
              orderStatus ===
                'delivered' ||
              orderStatus ===
                'cancelled' ||
              returnStatus ===
                'return completed'
            );
          }
        );

      console.log(
        'HISTORY - FILTERED ORDERS:',
        JSON.stringify(
          historyOrders,
          null,
          2
        )
      );

      setOrders(
        historyOrders
      );
    } catch (error: any) {
      console.error(
        'Delivery history error:',
        error
      );

      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================
  // LOAD ON SCREEN OPEN
  // ============================================

  React.useEffect(() => {
    loadHistory();
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return 'N/A';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  };

  // ============================================
  // FORMAT AMOUNT
  // ============================================

  const formatAmount = (
    amount?: number | string
  ) => {
    const value =
      Number(amount || 0);

    return `₹${value.toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ============================================
  // GET DISPLAY STATUS
  // ============================================

  const getDisplayStatus = (
    order: HistoryOrder
  ) => {
    if (
      order.return_status ===
      'Return Completed'
    ) {
      return 'Return Completed';
    }

    if (
      order.delivery_status
    ) {
      return order.delivery_status;
    }

    if (
      order.order_status
    ) {
      return order.order_status;
    }

    return 'Completed';
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
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
          Loading delivery history...
        </Text>
      </View>
    );
  }

  // ============================================
  // MAIN SCREEN
  // ============================================

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >

        {/* ======================================
            HEADER
        ====================================== */}

        <View
          style={
            styles.header
          }
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
              style={
                styles.backButtonText
              }
            >
              ‹
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Delivery History
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Your completed deliveries
            </Text>
          </View>

          <View
            style={
              styles.countBadge
            }
          >
            <Text
              style={
                styles.countText
              }
            >
              {orders.length}
            </Text>
          </View>

        </View>

        {/* ======================================
            EMPTY
        ====================================== */}

        {orders.length === 0 ? (

          <View
            style={
              styles.emptyCard
            }
          >

            <Text
              style={
                styles.emptyIcon
              }
            >
              🕘
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No Delivery History
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Your completed deliveries
              will appear here.
            </Text>

            <TouchableOpacity
              style={
                styles.refreshButton
              }
              onPress={
                handleRefresh
              }
            >
              <Text
                style={
                  styles.refreshButtonText
                }
              >
                Refresh
              </Text>
            </TouchableOpacity>

          </View>

        ) : (

          <>

            {/* =================================
                INFO
            ================================= */}

            <View
              style={
                styles.infoCard
              }
            >

              <Text
                style={
                  styles.infoTitle
                }
              >
                Completed Deliveries
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                These are deliveries completed
                by your delivery account.
              </Text>

            </View>

            {/* =================================
                HISTORY LIST
            ================================= */}

            {orders.map(
              (order) => {

                const customerName =
                  getCustomerName(
                    order
                  );

                const customerPhone =
                  getCustomerPhone(
                    order
                  );

                const displayStatus =
                  getDisplayStatus(
                    order
                  );

                const isReturnCompleted =
                  String(
                    order.return_status ||
                      ''
                  )
                    .trim()
                    .toLowerCase() ===
                  'return completed';

                const isCancelled =
                  String(
                    order.delivery_status ||
                      ''
                  )
                    .trim()
                    .toLowerCase() ===
                  'cancelled';

                return (

                  <View
                    key={
                      order.id
                    }
                    style={
                      styles.orderCard
                    }
                  >

                    {/* ======================
                        ORDER HEADER
                    ====================== */}

                    <View
                      style={
                        styles.orderHeader
                      }
                    >

                      <View>
                        <Text
                          style={
                            styles.orderNumber
                          }
                        >
                          Order #
                          {order.id}
                        </Text>

                        <Text
                          style={
                            styles.orderDate
                          }
                        >
                          {formatDate(
                            order.delivered_at ||
                              order.created_at
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          isReturnCompleted
                            ? styles.returnBadge
                            : isCancelled
                            ? styles.cancelledBadge
                            : styles.deliveredBadge
                        }
                      >
                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {displayStatus}
                        </Text>
                      </View>

                    </View>

                    {/* ======================
                        CUSTOMER
                    ====================== */}

                    <View
                      style={
                        styles.detailRow
                      }
                    >

                      <Text
                        style={
                          styles.icon
                        }
                      >
                        👤
                      </Text>

                      <View
                        style={
                          styles.detailContent
                        }
                      >

                        {/* ACTUAL CUSTOMER NAME */}

                        <Text
                          style={
                            styles.customerName
                          }
                        >
                          {customerName}
                        </Text>

                        {/* SAME PHONE AS
                            MY DELIVERIES */}

                        <Text
                          style={
                            styles.secondaryText
                          }
                        >
                          📞 {customerPhone}
                        </Text>

                      </View>

                    </View>

                    {/* ======================
                        PAYMENT
                    ====================== */}

                    <View
                      style={
                        styles.paymentRow
                      }
                    >

                      <View>

                        <Text
                          style={
                            styles.label
                          }
                        >
                          Payment
                        </Text>

                        <Text
                          style={
                            styles.value
                          }
                        >
                          {order.payment_method ||
                            'N/A'}
                        </Text>

                      </View>

                      <View
                        style={
                          styles.amountContainer
                        }
                      >

                        <Text
                          style={
                            styles.label
                          }
                        >
                          Order Total
                        </Text>

                        <Text
                          style={
                            styles.amount
                          }
                        >
                          {formatAmount(
                            order.total_amount
                          )}
                        </Text>

                      </View>

                    </View>

                    {/* ======================
                        PAYMENT STATUS
                    ====================== */}

                    <View
                      style={
                        styles.paymentStatusRow
                      }
                    >

                      <Text
                        style={
                          styles.paymentLabel
                        }
                      >
                        Payment Status:
                      </Text>

                      <Text
                        style={[
                          styles.paymentStatus,
                          String(
                            order.payment_status ||
                              ''
                          )
                            .toLowerCase() ===
                          'paid'
                            ? styles.paid
                            : styles.pending,
                        ]}
                      >
                        {order.payment_status ||
                          'Pending'}
                      </Text>

                    </View>

                    {/* ======================
                        DELIVERY STATUS
                    ====================== */}

                    <View
                      style={
                        styles.deliveryStatusRow
                      }
                    >

                      <Text
                        style={
                          styles.paymentLabel
                        }
                      >
                        Delivery Status:
                      </Text>

                      <Text
                        style={[
                          styles.deliveryStatusText,
                          isCancelled
                            ? styles.cancelledText
                            : isReturnCompleted
                            ? styles.returnText
                            : styles.deliveredText,
                        ]}
                      >
                        {displayStatus}
                      </Text>

                    </View>

                    {/* ======================
                        RETURN INFO
                    ====================== */}

                    {order.return_status ? (

                      <View
                        style={
                          styles.returnBox
                        }
                      >

                        <Text
                          style={
                            styles.returnTitle
                          }
                        >
                          Return:{' '}
                          {
                            order.return_status
                          }
                        </Text>

                        {order.return_reason ? (

                          <Text
                            style={
                              styles.returnReason
                            }
                          >
                            Reason:{' '}
                            {
                              order.return_reason
                            }
                          </Text>

                        ) : null}

                      </View>

                    ) : null}

                    {/* ======================
                        TIME INFO
                    ====================== */}

                    <View
                      style={
                        styles.timeContainer
                      }
                    >

                      <Text
                        style={
                          styles.timeText
                        }
                      >
                        Assigned:{' '}
                        {formatDate(
                          order.assigned_at
                        )}
                      </Text>

                      {order.delivered_at ? (

                        <Text
                          style={
                            styles.timeText
                          }
                        >
                          Delivered:{' '}
                          {formatDate(
                            order.delivered_at
                          )}
                        </Text>

                      ) : null}

                    </View>

                  </View>
                );
              }
            )}

          </>
        )}

      </ScrollView>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#f8f8f8',
    },

    content: {
      padding: 20,
      paddingBottom: 45,
    },

    // ==========================================
    // LOADING
    // ==========================================

    loadingContainer: {
      flex: 1,
      backgroundColor:
        '#f8f8f8',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#666',
    },

    // ==========================================
    // HEADER
    // ==========================================

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 22,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#ffffff',
      justifyContent:
        'center',
      alignItems:
        'center',
      borderWidth: 1,
      borderColor:
        '#e5e7eb',
    },

    backButtonText: {
      fontSize: 34,
      color: '#333',
      lineHeight: 36,
      marginTop: -3,
    },

    headerCenter: {
      flex: 1,
      marginLeft: 12,
    },

    title: {
      fontSize: 23,
      fontWeight: '900',
      color: '#181818',
    },

    subtitle: {
      fontSize: 12,
      color: '#777',
      marginTop: 3,
    },

    countBadge: {
      minWidth: 40,
      height: 40,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor:
        '#7c3aed',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    countText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '900',
    },

    // ==========================================
    // INFO
    // ==========================================

    infoCard: {
      backgroundColor:
        '#ede9fe',
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
    },

    infoTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#5b21b6',
    },

    infoText: {
      fontSize: 12,
      color: '#6d28d9',
      marginTop: 5,
      lineHeight: 18,
    },

    // ==========================================
    // EMPTY
    // ==========================================

    emptyCard: {
      backgroundColor:
        '#ffffff',
      borderRadius: 18,
      padding: 35,
      alignItems:
        'center',
      marginTop: 20,
      borderWidth: 1,
      borderColor:
        '#e5e7eb',
    },

    emptyIcon: {
      fontSize: 50,
      marginBottom: 15,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: '#222',
    },

    emptyText: {
      fontSize: 13,
      color: '#777',
      textAlign:
        'center',
      lineHeight: 19,
      marginTop: 7,
    },

    refreshButton: {
      marginTop: 18,
      backgroundColor:
        '#7c3aed',
      paddingHorizontal: 24,
      paddingVertical: 11,
      borderRadius: 10,
    },

    refreshButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },

    // ==========================================
    // ORDER CARD
    // ==========================================

    orderCard: {
      backgroundColor:
        '#ffffff',
      borderRadius: 16,
      padding: 17,
      marginBottom: 15,
      borderWidth: 1,
      borderColor:
        '#e5e7eb',
    },

    orderHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      marginBottom: 15,
    },

    orderNumber: {
      fontSize: 18,
      fontWeight: '900',
      color: '#222',
    },

    orderDate: {
      fontSize: 11,
      color: '#888',
      marginTop: 4,
    },

    deliveredBadge: {
      backgroundColor:
        '#16a34a',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
    },

    returnBadge: {
      backgroundColor:
        '#d97706',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
    },

    cancelledBadge: {
      backgroundColor:
        '#dc2626',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
    },

    statusText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '800',
    },

    // ==========================================
    // CUSTOMER
    // ==========================================

    detailRow: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      marginBottom: 15,
    },

    icon: {
      fontSize: 19,
      width: 34,
    },

    detailContent: {
      flex: 1,
    },

    customerName: {
      fontSize: 17,
      color: '#222',
      fontWeight: '900',
      lineHeight: 22,
    },

    secondaryText: {
      fontSize: 12,
      color: '#777',
      marginTop: 3,
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    paymentRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-end',
      borderTopWidth: 1,
      borderTopColor:
        '#eeeeee',
      paddingTop: 13,
      marginTop: 2,
    },

    amountContainer: {
      alignItems:
        'flex-end',
    },

    label: {
      fontSize: 11,
      color: '#888',
      fontWeight: '600',
      marginBottom: 3,
    },

    value: {
      fontSize: 14,
      color: '#333',
      fontWeight: '700',
      lineHeight: 19,
    },

    amount: {
      fontSize: 18,
      fontWeight: '900',
      color: '#7c3aed',
    },

    // ==========================================
    // STATUS
    // ==========================================

    paymentStatusRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 13,
    },

    deliveryStatusRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 9,
    },

    paymentLabel: {
      fontSize: 12,
      color: '#777',
      fontWeight: '600',
    },

    paymentStatus: {
      fontSize: 12,
      fontWeight: '900',
      marginLeft: 5,
    },

    paid: {
      color: '#16a34a',
    },

    pending: {
      color: '#d97706',
    },

    deliveryStatusText: {
      fontSize: 12,
      fontWeight: '900',
      marginLeft: 5,
    },

    deliveredText: {
      color: '#16a34a',
    },

    returnText: {
      color: '#d97706',
    },

    cancelledText: {
      color: '#dc2626',
    },

    // ==========================================
    // RETURN
    // ==========================================

    returnBox: {
      backgroundColor:
        '#fff7ed',
      borderRadius: 10,
      padding: 10,
      marginTop: 13,
      borderWidth: 1,
      borderColor:
        '#fed7aa',
    },

    returnTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#c2410c',
    },

    returnReason: {
      fontSize: 11,
      color: '#9a3412',
      marginTop: 3,
    },

    // ==========================================
    // TIME
    // ==========================================

    timeContainer: {
      borderTopWidth: 1,
      borderTopColor:
        '#eeeeee',
      marginTop: 14,
      paddingTop: 12,
    },

    timeText: {
      fontSize: 11,
      color: '#777',
      marginBottom: 3,
    },
  });