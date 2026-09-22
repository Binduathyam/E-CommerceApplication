import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function DeliveryOrderDetailsScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      orderId?: string;
    }>();

  const orderId = params.orderId;

  const [order, setOrder] =
    React.useState<DeliveryOrder | null>(
      null
    );

  const [loading, setLoading] =
    React.useState(true);

  const [refreshing, setRefreshing] =
    React.useState(false);

  const [updating, setUpdating] =
    React.useState(false);

  const [collectingCOD, setCollectingCOD] =
    React.useState(false);

  const [rejecting, setRejecting] =
    React.useState(false);

  /*
   =================================
   GET LOGGED-IN USER
   =================================
  */

  const getLoggedInUser = async () => {
    const savedUser =
      await AsyncStorage.getItem(
        'loggedInUser'
      );

    if (!savedUser) {
      router.replace('/login');
      return null;
    }

    const user =
      JSON.parse(savedUser);

    if (user.role !== 'delivery') {
      Alert.alert(
        'Access Denied',
        'This page is only for delivery partners.'
      );

      router.replace('/login');
      return null;
    }

    return user;
  };

  /*
   =================================
   GET AUTH HEADERS
   =================================
  */

  const getHeaders = async () => {
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

    return headers;
  };

  /*
   =================================
   LOAD ORDER
   =================================
  */

  const loadOrder = async () => {
    try {
      if (!orderId) {
        Alert.alert(
          'Error',
          'Order ID is missing.'
        );

        router.back();
        return;
      }

      const user =
        await getLoggedInUser();

      if (!user) {
        return;
      }

      const deliveryPartnerId =
        user.id;

      const headers =
        await getHeaders();

      console.log(
        'Loading delivery orders for:',
        deliveryPartnerId
      );

      /*
       Backend does not currently
       provide a separate single-order
       delivery endpoint.

       So we use:
       /my-orders/:delivery_partner_id

       and find the requested order.
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
        'Delivery order details response:',
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to load order'
        );
      }

      const foundOrder =
        (data.orders || []).find(
          (item: DeliveryOrder) =>
            String(item.id) ===
            String(orderId)
        );

      if (!foundOrder) {
        Alert.alert(
          'Order Not Found',
          'This order is not assigned to you or is no longer available.'
        );

        router.back();
        return;
      }

      setOrder(foundOrder);
    } catch (error) {
      console.error(
        'Load order details error:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to load order'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   =================================
   INITIAL LOAD
   =================================
  */

  React.useEffect(() => {
    loadOrder();
  }, [orderId]);

  /*
   =================================
   REFRESH
   =================================
  */

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrder();
  };

  /*
   =================================
   NEXT DELIVERY STATUS
   =================================
  */

  const getNextStatus = () => {
    if (!order) {
      return null;
    }

    switch (
      order.delivery_status
    ) {
      case 'Assigned':
        return 'Accepted';

      case 'Accepted':
        return 'Picked Up';

      case 'Picked Up':
        return 'Out for Delivery';

      case 'Out for Delivery':
        return 'Delivered';

      default:
        return null;
    }
  };

  /*
   =================================
   NEXT STATUS BUTTON TEXT
   =================================
  */

  const getNextStatusText = () => {
    if (!order) {
      return 'Update Status';
    }

    switch (
      order.delivery_status
    ) {
      case 'Assigned':
        return 'Accept Order';

      case 'Accepted':
        return 'Mark as Picked Up';

      case 'Picked Up':
        return 'Start Delivery';

      case 'Out for Delivery':
        return 'Mark as Delivered';

      case 'Delivered':
        return 'Delivered';

      default:
        return 'Update Status';
    }
  };

  /*
   =================================
   UPDATE DELIVERY STATUS
   =================================
  */

  const handleUpdateStatus = () => {
    if (!order) {
      return;
    }

    const nextStatus =
      getNextStatus();

    if (!nextStatus) {
      return;
    }

    let message =
      `Change delivery status to "${nextStatus}"?`;

    if (
      nextStatus ===
      'Delivered'
    ) {
      message =
        'Are you sure the order has been delivered to the customer?';
    }

    Alert.alert(
      'Update Delivery',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () =>
            updateDeliveryStatus(
              nextStatus
            ),
        },
      ]
    );
  };

  /*
   =================================
   SEND STATUS UPDATE
   =================================
  */

  const updateDeliveryStatus =
    async (
      newStatus: string
    ) => {
      if (!order) {
        return;
      }

      try {
        setUpdating(true);

        const user =
          await getLoggedInUser();

        if (!user) {
          return;
        }

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${API_BASE_URL}/api/delivery/update-status`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                order_id:
                  order.id,

                delivery_partner_id:
                  user.id,

                delivery_status:
                  newStatus,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Update status response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Failed to update delivery status'
          );
        }

        /*
         Update local order
        */

        setOrder(
          previous =>
            previous
              ? {
                  ...previous,
                  delivery_status:
                    data.order
                      ?.delivery_status ||
                    newStatus,

                  order_status:
                    data.order
                      ?.order_status ||
                    previous.order_status,
                }
              : previous
        );

        /*
         If delivered,
         backend automatically
         makes partner Online.
        */

        Alert.alert(
          'Success',
          data.message ||
            'Delivery status updated successfully'
        );

        /*
         Refresh complete order data
        */

        loadOrder();
      } catch (error) {
        console.error(
          'Update delivery status error:',
          error
        );

        Alert.alert(
          'Error',
          error instanceof Error
            ? error.message
            : 'Failed to update delivery status'
        );
      } finally {
        setUpdating(false);
      }
    };

  /*
   =================================
   REJECT ORDER
   =================================
  */

  const handleRejectOrder = () => {
    if (!order) {
      return;
    }

    if (
      order.delivery_status !==
      'Assigned'
    ) {
      Alert.alert(
        'Cannot Reject',
        'Only newly assigned orders can be rejected.'
      );

      return;
    }

    Alert.alert(
      'Reject Order',
      `Are you sure you want to reject Order #${order.id}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress:
            rejectOrder,
        },
      ]
    );
  };

  /*
   =================================
   SEND REJECT REQUEST
   =================================
  */

  const rejectOrder =
    async () => {
      if (!order) {
        return;
      }

      try {
        setRejecting(true);

        const user =
          await getLoggedInUser();

        if (!user) {
          return;
        }

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${API_BASE_URL}/api/delivery/reject-order`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                order_id:
                  order.id,

                delivery_partner_id:
                  user.id,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Reject response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Failed to reject order'
          );
        }

        Alert.alert(
          'Order Rejected',
          data.message ||
            'Order has been returned for reassignment.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.back(),
            },
          ]
        );
      } catch (error) {
        console.error(
          'Reject order error:',
          error
        );

        Alert.alert(
          'Error',
          error instanceof Error
            ? error.message
            : 'Failed to reject order'
        );
      } finally {
        setRejecting(false);
      }
    };

  /*
   =================================
   COLLECT COD
   =================================
  */

  const handleCollectCOD =
    () => {
      if (!order) {
        return;
      }

      if (
        order.payment_method !==
        'Cash on Delivery'
      ) {
        Alert.alert(
          'Not a COD Order',
          'This order does not use Cash on Delivery.'
        );

        return;
      }

      if (
        order.delivery_status !==
        'Delivered'
      ) {
        Alert.alert(
          'Delivery Required',
          'COD can only be collected after delivery.'
        );

        return;
      }

      if (
        order.payment_status ===
        'Paid'
      ) {
        Alert.alert(
          'Already Paid',
          'COD payment has already been collected.'
        );

        return;
      }

      Alert.alert(
        'Collect COD',
        `Collect ₹${Number(
          order.total_amount || 0
        ).toFixed(
          2
        )} from the customer?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Collected',
            onPress:
              collectCOD,
          },
        ]
      );
    };

  /*
   =================================
   SEND COD COLLECTION
   =================================
  */

  const collectCOD =
    async () => {
      if (!order) {
        return;
      }

      try {
        setCollectingCOD(
          true
        );

        const user =
          await getLoggedInUser();

        if (!user) {
          return;
        }

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${API_BASE_URL}/api/delivery/collect-cod`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                order_id:
                  order.id,

                delivery_partner_id:
                  user.id,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          'COD response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Failed to collect COD payment'
          );
        }

        setOrder(
          previous =>
            previous
              ? {
                  ...previous,
                  payment_status:
                    'Paid',
                }
              : previous
        );

        Alert.alert(
          'Payment Collected',
          data.message ||
            'COD payment collected successfully.'
        );

        loadOrder();
      } catch (error) {
        console.error(
          'COD collection error:',
          error
        );

        Alert.alert(
          'Error',
          error instanceof Error
            ? error.message
            : 'Failed to collect COD payment'
        );
      } finally {
        setCollectingCOD(
          false
        );
      }
    };

  /*
   =================================
   FORMAT DATE
   =================================
  */

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

  /*
   =================================
   GET ADDRESS
   =================================
  */

  const getAddress = () => {
    if (!order) {
      return 'Address not available';
    }

    const parts = [
      order.address_line,
      order.city,
      order.state,
      order.pincode,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    let shipping =
      order.shipping_address;

    if (!shipping) {
      return 'Address not available';
    }

    if (
      typeof shipping ===
      'string'
    ) {
      try {
        shipping =
          JSON.parse(
            shipping
          );
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
   STATUS COLOR STYLE
   =================================
  */

  const getStatusStyle = () => {
    if (!order) {
      return styles.defaultStatus;
    }

    switch (
      order.delivery_status
    ) {
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
          Loading order...
        </Text>
      </View>
    );
  }

  /*
   =================================
   NO ORDER
   =================================
  */

  if (!order) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Text
          style={styles.errorTitle}
        >
          Order not found
        </Text>

        <TouchableOpacity
          style={styles.backButtonLarge}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonLargeText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextStatus =
    getNextStatus();

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
              Order #{order.id}
            </Text>

            <Text
              style={styles.subtitle}
            >
              Delivery details
            </Text>
          </View>
        </View>

        {/* =================================
            DELIVERY STATUS
        ================================= */}

        <View
          style={styles.statusCard}
        >
          <Text
            style={styles.statusLabel}
          >
            Current Delivery Status
          </Text>

          <View
            style={[
              styles.largeStatusBadge,
              getStatusStyle(),
            ]}
          >
            <Text
              style={
                styles.largeStatusText
              }
            >
              {order.delivery_status}
            </Text>
          </View>

          <Text
            style={
              styles.statusExplanation
            }
          >
            {order.delivery_status ===
            'Assigned'
              ? 'This order is newly assigned to you.'
              : order.delivery_status ===
                'Accepted'
              ? 'You have accepted this delivery.'
              : order.delivery_status ===
                'Picked Up'
              ? 'You have picked up the order from the merchant.'
              : order.delivery_status ===
                'Out for Delivery'
              ? 'You are currently delivering this order to the customer.'
              : order.delivery_status ===
                'Delivered'
              ? 'This order has been delivered.'
              : 'Current delivery status.'}
          </Text>
        </View>

        {/* =================================
            CUSTOMER
        ================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardTitle}
          >
            Customer Details
          </Text>

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.icon}
            >
              👤
            </Text>

            <View
              style={styles.detailContent}
            >
              <Text
                style={styles.label}
              >
                Name
              </Text>

              <Text
                style={styles.value}
              >
                {order.customer_name ||
                  'Customer'}
              </Text>
            </View>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.icon}
            >
              📞
            </Text>

            <View
              style={styles.detailContent}
            >
              <Text
                style={styles.label}
              >
                Phone
              </Text>

              <Text
                style={styles.value}
              >
                {order.customer_phone ||
                  'Not available'}
              </Text>
            </View>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.icon}
            >
              ✉️
            </Text>

            <View
              style={styles.detailContent}
            >
              <Text
                style={styles.label}
              >
                Email
              </Text>

              <Text
                style={styles.value}
              >
                {order.customer_email ||
                  'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================
            DELIVERY ADDRESS
        ================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardTitle}
          >
            Delivery Address
          </Text>

          <View
            style={styles.addressRow}
          >
            <Text
              style={styles.addressIcon}
            >
              📍
            </Text>

            <Text
              style={styles.addressText}
            >
              {getAddress()}
            </Text>
          </View>

          {order.address_phone ? (
            <Text
              style={
                styles.addressPhone
              }
            >
              Contact: {
                order.address_phone
              }
            </Text>
          ) : null}
        </View>

        {/* =================================
            PAYMENT
        ================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardTitle}
          >
            Payment Details
          </Text>

          <View
            style={styles.paymentLine}
          >
            <Text
              style={styles.paymentLabel}
            >
              Payment Method
            </Text>

            <Text
              style={styles.paymentValue}
            >
              {order.payment_method ||
                'N/A'}
            </Text>
          </View>

          <View
            style={styles.paymentLine}
          >
            <Text
              style={styles.paymentLabel}
            >
              Payment Status
            </Text>

            <Text
              style={[
                styles.paymentValue,
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

          <View
            style={styles.totalLine}
          >
            <Text
              style={styles.totalLabel}
            >
              Order Total
            </Text>

            <Text
              style={styles.totalAmount}
            >
              ₹
              {Number(
                order.total_amount ||
                  0
              ).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* =================================
            ORDER INFORMATION
        ================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardTitle}
          >
            Order Information
          </Text>

          <View
            style={styles.paymentLine}
          >
            <Text
              style={styles.paymentLabel}
            >
              Order Status
            </Text>

            <Text
              style={styles.paymentValue}
            >
              {order.order_status}
            </Text>
          </View>

          <View
            style={styles.paymentLine}
          >
            <Text
              style={styles.paymentLabel}
            >
              Created
            </Text>

            <Text
              style={styles.dateValue}
            >
              {formatDate(
                order.created_at
              )}
            </Text>
          </View>

          <View
            style={styles.paymentLine}
          >
            <Text
              style={styles.paymentLabel}
            >
              Assigned
            </Text>

            <Text
              style={styles.dateValue}
            >
              {formatDate(
                order.assigned_at
              )}
            </Text>
          </View>

          {order.delivered_at ? (
            <View
              style={styles.paymentLine}
            >
              <Text
                style={
                  styles.paymentLabel
                }
              >
                Delivered
              </Text>

              <Text
                style={
                  styles.dateValue
                }
              >
                {formatDate(
                  order.delivered_at
                )}
              </Text>
            </View>
          ) : null}
        </View>

        {/* =================================
            RETURN INFORMATION
        ================================= */}

        {order.return_status ? (
          <View
            style={styles.returnCard}
          >
            <Text
              style={
                styles.returnTitle
              }
            >
              Return Status
            </Text>

            <Text
              style={
                styles.returnStatus
              }
            >
              {order.return_status}
            </Text>

            {order.return_reason ? (
              <Text
                style={
                  styles.returnReason
                }
              >
                Reason: {
                  order.return_reason
                }
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* =================================
            ACTIONS
        ================================= */}

        {nextStatus ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              updating &&
                styles.disabledButton,
            ]}
            onPress={
              handleUpdateStatus
            }
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {getNextStatusText()}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* =================================
            REJECT
        ================================= */}

        {order.delivery_status ===
        'Assigned' ? (
          <TouchableOpacity
            style={[
              styles.rejectButton,
              rejecting &&
                styles.disabledButton,
            ]}
            onPress={
              handleRejectOrder
            }
            disabled={rejecting}
          >
            {rejecting ? (
              <ActivityIndicator
                size="small"
                color="#dc2626"
              />
            ) : (
              <Text
                style={
                  styles.rejectButtonText
                }
              >
                Reject Order
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* =================================
            COD COLLECTION
        ================================= */}

        {order.payment_method ===
          'Cash on Delivery' &&
        order.delivery_status ===
          'Delivered' &&
        order.payment_status !==
          'Paid' ? (
          <TouchableOpacity
            style={[
              styles.codButton,
              collectingCOD &&
                styles.disabledButton,
            ]}
            onPress={
              handleCollectCOD
            }
            disabled={
              collectingCOD
            }
          >
            {collectingCOD ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.codButtonText
                }
              >
                Collect COD ₹
                {Number(
                  order.total_amount ||
                    0
                ).toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* =================================
            BACK BUTTON
        ================================= */}

        <TouchableOpacity
          style={
            styles.backToOrdersButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backToOrdersText
            }
          >
            ← Back to My Deliveries
          </Text>
        </TouchableOpacity>

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
    paddingBottom: 45,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#222',
    marginBottom: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 23,
    fontWeight: '900',
    color: '#181818',
  },

  subtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 15,
  },

  statusLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '700',
  },

  largeStatusBadge: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  largeStatusText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  statusExplanation: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
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

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#222',
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  icon: {
    fontSize: 19,
    width: 34,
  },

  detailContent: {
    flex: 1,
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
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  addressIcon: {
    fontSize: 21,
    marginRight: 10,
  },

  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    lineHeight: 20,
  },

  addressPhone: {
    fontSize: 12,
    color: '#777',
    marginTop: 12,
    marginLeft: 31,
  },

  paymentLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  paymentLabel: {
    fontSize: 13,
    color: '#777',
    flex: 1,
  },

  paymentValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '800',
    textAlign: 'right',
    maxWidth: '55%',
  },

  dateValue: {
    fontSize: 11,
    color: '#555',
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '55%',
  },

  paid: {
    color: '#16a34a',
  },

  pending: {
    color: '#d97706',
  },

  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 5,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222',
  },

  totalAmount: {
    fontSize: 21,
    fontWeight: '900',
    color: '#7c3aed',
  },

  returnCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },

  returnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9a3412',
  },

  returnStatus: {
    fontSize: 16,
    fontWeight: '900',
    color: '#c2410c',
    marginTop: 5,
  },

  returnReason: {
    fontSize: 12,
    color: '#9a3412',
    marginTop: 6,
  },

  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.6,
  },

  rejectButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  rejectButtonText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '900',
  },

  codButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  codButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  backToOrdersButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  backToOrdersText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '900',
  },

  backButtonLarge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonLargeText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});