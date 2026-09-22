import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

type DeliveryOrder = {
  id: number;
  user_id: number;
  address_id: number | null;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_status: string;
  return_status?: string | null;
  return_reason?: string | null;
  return_requested_at?: string | null;
  shipping_address?: any;
  created_at: string;
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
};

export default function DeliveryOrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] =
    React.useState<DeliveryOrder[]>([]);

  const [loading, setLoading] =
    React.useState(true);

  const [refreshing, setRefreshing] =
    React.useState(false);

  const loadOrders = async () => {
    try {
      /*
       =================================
       GET LOGGED-IN DELIVERY PARTNER
       =================================
      */

      const savedUser =
        await AsyncStorage.getItem(
          'loggedInUser'
        );

      if (!savedUser) {
        Alert.alert(
          'Login Required',
          'Please login again.'
        );

        router.replace('/login');
        return;
      }

      const user =
        JSON.parse(savedUser);

      if (user.role !== 'delivery') {
        Alert.alert(
          'Access Denied',
          'This page is only for delivery partners.'
        );

        router.replace('/login');
        return;
      }

      const deliveryPartnerId =
        user.id;

      /*
       =================================
       GET JWT TOKEN
       =================================
      */

      const token =
        await AsyncStorage.getItem(
          'authToken'
        );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      console.log(
        'Loading orders for delivery partner:',
        deliveryPartnerId
      );

      /*
       =================================
       GET MY ORDERS
       =================================
      */

      const response =
        await fetch(
          `${API_BASE_URL}/api/delivery/my-orders/${deliveryPartnerId}`,
          {
            method: 'GET',
            headers,
          }
        );

      const data =
        await response.json();

      console.log(
        'Delivery orders response:',
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to load delivery orders'
        );
      }

      setOrders(
        data.orders || []
      );
    } catch (error) {
      console.error(
        'Load delivery orders error:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to load delivery orders'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   =================================
   LOAD WHEN SCREEN OPENS
   =================================
  */

  React.useEffect(() => {
    loadOrders();
  }, []);

  /*
   =================================
   REFRESH
   =================================
  */

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  /*
   =================================
   OPEN ORDER DETAILS
   =================================
  */

  const handleOrderPress = (
    order: DeliveryOrder
  ) => {
    router.push({
      pathname:
        '/delivery/order-details',
      params: {
        orderId: String(order.id),
      },
    });
  };

  /*
   =================================
   GET STATUS STYLE
   =================================
  */

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case 'Assigned':
        return styles.assignedStatus;

      case 'Accepted':
        return styles.acceptedStatus;

      case 'Picked Up':
        return styles.pickedUpStatus;

      case 'Out for Delivery':
        return styles.outDeliveryStatus;

      case 'Delivered':
        return styles.deliveredStatus;

      default:
        return styles.defaultStatus;
    }
  };

  /*
   =================================
   GET STATUS DESCRIPTION
   =================================
  */

  const getStatusDescription = (
    status: string
  ) => {
    switch (status) {
      case 'Assigned':
        return 'New order assigned to you';

      case 'Accepted':
        return 'Order accepted';

      case 'Picked Up':
        return 'Order picked up from merchant';

      case 'Out for Delivery':
        return 'On the way to customer';

      case 'Delivered':
        return 'Order delivered';

      default:
        return status;
    }
  };

  /*
   =================================
   FORMAT DATE
   =================================
  */

  const formatDate = (
    dateString?: string | null
  ) => {
    if (!dateString) {
      return 'N/A';
    }

    const date =
      new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  /*
   =================================
   DELIVERY ADDRESS
   =================================
  */

  const getDeliveryAddress = (
    order: DeliveryOrder
  ) => {
    const parts = [
      order.address_line,
      order.city,
      order.state,
      order.pincode,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    /*
     Fallback to shipping_address
     */

    let shipping =
      order.shipping_address;

    if (!shipping) {
      return 'Address not available';
    }

    if (typeof shipping === 'string') {
      try {
        shipping =
          JSON.parse(shipping);
      } catch {
        return shipping;
      }
    }

    if (
      typeof shipping ===
      'object'
    ) {
      const shippingParts = [
        shipping.address_line,
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.pincode,
      ].filter(Boolean);

      if (
        shippingParts.length > 0
      ) {
        return shippingParts.join(
          ', '
        );
      }
    }

    return 'Address not available';
  };

  /*
   =================================
   LOADING
   =================================
  */

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
          style={styles.loadingText}
        >
          Loading deliveries...
        </Text>
      </View>
    );
  }

  /*
   =================================
   SCREEN
   =================================
  */

  return (
    <View
      style={styles.container}
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
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
          />
        }
      >

        {/* =================================
            HEADER
        ================================= */}

        <View
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
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
            style={styles.headerCenter}
          >
            <Text
              style={styles.title}
            >
              My Deliveries
            </Text>

            <Text
              style={styles.subtitle}
            >
              Orders assigned to you
            </Text>
          </View>

          <View
            style={styles.countBadge}
          >
            <Text
              style={styles.countText}
            >
              {orders.length}
            </Text>
          </View>
        </View>

        {/* =================================
            EMPTY STATE
        ================================= */}

        {orders.length === 0 ? (
          <View
            style={styles.emptyContainer}
          >
            <Text
              style={styles.emptyIcon}
            >
              📦
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No Deliveries
            </Text>

            <Text
              style={styles.emptyText}
            >
              You don't have any assigned
              deliveries right now.
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
                ACTIVE ORDERS COUNT
            ================================= */}

            <View
              style={styles.infoCard}
            >
              <Text
                style={styles.infoTitle}
              >
                Assigned Deliveries
              </Text>

              <Text
                style={styles.infoText}
              >
                Tap an order to view customer
                details and update delivery
                status.
              </Text>
            </View>

            {/* =================================
                ORDERS
            ================================= */}

            {orders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  handleOrderPress(
                    order
                  )
                }
                activeOpacity={0.8}
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
                        order.created_at
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      getStatusStyle(
                        order.delivery_status
                      ),
                    ]}
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {order.delivery_status ||
                        'Unknown'}
                    </Text>
                  </View>
                </View>

                {/* STATUS DESCRIPTION */}

                <Text
                  style={
                    styles.statusDescription
                  }
                >
                  {getStatusDescription(
                    order.delivery_status
                  )}
                </Text>

                {/* CUSTOMER */}

                <View
                  style={styles.detailRow}
                >
                  <Text
                    style={styles.detailIcon}
                  >
                    👤
                  </Text>

                  <View
                    style={
                      styles.detailContent
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Customer
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {order.customer_name ||
                        'Customer'}
                    </Text>

                    {order.customer_phone ? (
                      <Text
                        style={
                          styles.secondaryText
                        }
                      >
                        {order.customer_phone}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* ADDRESS */}

                <View
                  style={styles.detailRow}
                >
                  <Text
                    style={styles.detailIcon}
                  >
                    📍
                  </Text>

                  <View
                    style={
                      styles.detailContent
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Delivery Address
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                      numberOfLines={3}
                    >
                      {getDeliveryAddress(
                        order
                      )}
                    </Text>
                  </View>
                </View>

                {/* PAYMENT */}

                <View
                  style={styles.paymentRow}
                >
                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Payment
                    </Text>

                    <Text
                      style={
                        styles.detailValue
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
                        styles.detailLabel
                      }
                    >
                      Amount
                    </Text>

                    <Text
                      style={
                        styles.amount
                      }
                    >
                      ₹
                      {Number(
                        order.total_amount ||
                          0
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* PAYMENT STATUS */}

                <View
                  style={
                    styles.paymentStatusRow
                  }
                >
                  <Text
                    style={
                      styles.paymentStatusLabel
                    }
                  >
                    Payment Status:
                  </Text>

                  <Text
                    style={[
                      styles.paymentStatus,
                      order.payment_status ===
                        'Paid'
                        ? styles.paid
                        : styles.pending,
                    ]}
                  >
                    {order.payment_status ||
                      'Pending'}
                  </Text>
                </View>

                {/* RETURN INFO */}

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
                      Return: {
                        order.return_status
                      }
                    </Text>

                    {order.return_reason ? (
                      <Text
                        style={
                          styles.returnReason
                        }
                      >
                        {order.return_reason}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* VIEW DETAILS */}

                <View
                  style={
                    styles.viewDetails
                  }
                >
                  <Text
                    style={
                      styles.viewDetailsText
                    }
                  >
                    View Details →
                  </Text>
                </View>

              </TouchableOpacity>
            ))}
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

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    fontSize: 24,
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
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  countText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  infoCard: {
    backgroundColor: '#ede9fe',
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

  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 35,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },

  refreshButton: {
    marginTop: 18,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },

  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    maxWidth: 145,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },

  assignedStatus: {
    backgroundColor: '#7c3aed',
  },

  acceptedStatus: {
    backgroundColor: '#2563eb',
  },

  pickedUpStatus: {
    backgroundColor: '#d97706',
  },

  outDeliveryStatus: {
    backgroundColor: '#0891b2',
  },

  deliveredStatus: {
    backgroundColor: '#16a34a',
  },

  defaultStatus: {
    backgroundColor: '#6b7280',
  },

  statusDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 10,
    marginBottom: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  detailIcon: {
    fontSize: 18,
    width: 32,
    marginTop: 1,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
    lineHeight: 19,
  },

  secondaryText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 13,
    marginTop: 2,
  },

  amountContainer: {
    alignItems: 'flex-end',
  },

  amount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7c3aed',
  },

  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  paymentStatusLabel: {
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

  returnBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
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

  viewDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    marginTop: 14,
    paddingTop: 13,
    alignItems: 'center',
  },

  viewDetailsText: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '900',
  },
});