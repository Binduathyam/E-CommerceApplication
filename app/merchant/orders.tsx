import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "../../config/api";

// =====================================================
// TYPES
// =====================================================

type OrderItem = {
  id?: number;
  order_id?: number;
  product_id?: number;
  product_name?: string;
  name?: string;
  brand?: string;
  category?: string;
  quantity?: number;
  price?: number | string;
  product_image?: string;
  image?: string;
};

type Address = {
  id?: number;
  user_id?: number;
  full_name?: string;
  phone?: string;
  address_line?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

type Order = {
  id: number;

  customer_id?: number;
  user_id?: number;

  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  total_amount?: number | string;
  total?: number | string;
  total_quantity?: number | string;

  product_names?: string;

  status?: string;
  order_status?: string;

  payment_status?: string;
  payment_method?: string;

  // RETURN (same fields as the web app)
  return_status?: string;
  return_reason?: string;
  return_requested_at?: string;

  created_at?: string;

  items?: OrderItem[];

  address_id?: number;
  shipping_address?: any;

  address_name?: string;
  address_phone?: string;

  full_name?: string;
  phone?: string;
  address_line?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

// =====================================================
// COMPONENT
// =====================================================

export default function MerchantOrders() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = async () => {
    const token = await AsyncStorage.getItem("authToken");

    if (!token) {
      throw new Error("Login session expired. Please login again.");
    }

    return token;
  };

  // =====================================================
  // GET CURRENT LOGGED-IN MERCHANT ID
  // =====================================================

  const getCurrentMerchantId = async (): Promise<number> => {
    const storedUser = await AsyncStorage.getItem("loggedInUser");

    if (!storedUser) {
      throw new Error(
        "Merchant login information not found. Please login again."
      );
    }

    let user: any;

    try {
      user = JSON.parse(storedUser);
    } catch {
      throw new Error("Invalid merchant login information. Please login again.");
    }

    const merchantId = Number(user?.id);

    if (!merchantId || Number.isNaN(merchantId)) {
      throw new Error("Merchant ID not found. Please login again.");
    }

    if (user?.role && user.role !== "merchant") {
      throw new Error("This account is not a merchant account.");
    }

    return merchantId;
  };

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = useCallback(async () => {
    try {
      setError("");

      const token = await getToken();
      const merchantId = await getCurrentMerchantId();

      const response = await fetch(
        `${API_BASE_URL}/api/orders/merchant/${merchantId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-user-id": String(merchantId),
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load orders.");
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (err: any) {
      console.error("MERCHANT ORDERS ERROR:", err);
      setError(err?.message || "Unable to load orders.");
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };

    load();
  }, [fetchOrders]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // =====================================================
  // LOAD CUSTOMER ADDRESS
  // =====================================================

  const loadCustomerAddress = async (
    customerId: number,
    order: Order
  ): Promise<Order> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addresses/${customerId}`);
      const data = await response.json();

      const addresses: Address[] = Array.isArray(data?.addresses)
        ? data.addresses
        : [];

      if (addresses.length === 0) {
        return order;
      }

      if (order.address_id) {
        const matched = addresses.find(
          (address) => Number(address.id) === Number(order.address_id)
        );

        if (matched) {
          return { ...order, ...matched };
        }
      }

      return { ...order, ...addresses[0] };
    } catch (err) {
      console.error("ADDRESS LOAD ERROR:", err);
      return order;
    }
  };

  // =====================================================
  // VIEW ORDER DETAILS
  // =====================================================

  const handleViewDetails = async (order: Order) => {
    try {
      setDetailsLoading(true);
      setDetailsVisible(true);

      const token = await getToken();
      const merchantId = await getCurrentMerchantId();

      const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-id": String(merchantId),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      let fullOrder: Order = { ...order };

      if (response.ok && data?.success) {
        const apiOrder = data?.order || data?.data;

        if (apiOrder) {
          fullOrder = {
            ...order,
            ...apiOrder,
            items: Array.isArray(apiOrder.items) ? apiOrder.items : [],
          };
        }
      }

      const customerId = Number(
        fullOrder.user_id ||
          fullOrder.customer_id ||
          order.user_id ||
          order.customer_id
      );

      if (customerId) {
        fullOrder = await loadCustomerAddress(customerId, fullOrder);
      }

      if (typeof fullOrder.shipping_address === "string") {
        try {
          fullOrder.shipping_address = JSON.parse(fullOrder.shipping_address);
        } catch {
          // ignore
        }
      }

      setSelectedOrder(fullOrder);
    } catch (err: any) {
      console.error("VIEW ORDER DETAILS ERROR:", err);

      Alert.alert("Error", err?.message || "Unable to load order details.");

      setDetailsVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setSelectedOrder(null);
  };

  // =====================================================
  // UPDATE ORDER STATUS (+ CREATE SHIPMENT BEFORE "Shipped")
  // Same flow as the web app
  // =====================================================

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setStatusLoading(orderId);

      const token = await getToken();
      const merchantId = await getCurrentMerchantId();

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-user-id": String(merchantId),
      };

      let trackingNumber = "";

      // STEP 1: create the shipment before marking the order as shipped
      if (newStatus === "Shipped") {
        const shipmentResponse = await fetch(
          `${API_BASE_URL}/api/orders/${orderId}/ready-for-pickup`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({}),
          }
        );

        const shipmentData = await shipmentResponse.json();

        if (!shipmentResponse.ok || !shipmentData.success) {
          throw new Error(shipmentData.message || "Shipment creation failed.");
        }

        trackingNumber = shipmentData?.shipment?.tracking_number || "";
      }

      // STEP 2: update the order status
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ order_status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update order status.");
      }

      // STEP 3: update the screen
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, order_status: newStatus }
            : order
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          order_status: newStatus,
        });
      }

      if (newStatus === "Shipped") {
        Alert.alert(
          "Shipment created",
          trackingNumber
            ? `Order marked as Shipped.\nTracking Number: ${trackingNumber}`
            : "Order marked as Shipped."
        );
      } else {
        Alert.alert("Success", `Order marked as ${newStatus}.`);
      }
    } catch (err: any) {
      console.error("STATUS UPDATE ERROR:", err);

      Alert.alert("Update Failed", err?.message || "Unable to update order.");
    } finally {
      setStatusLoading(null);
    }
  };

  // =====================================================
  // STYLE HELPERS
  // =====================================================

  const getStatusStyle = (status?: string) => {
    const value = (status || "Placed").toLowerCase();

    if (value === "delivered") {
      return { background: "#dcfce7", text: "#15803d" };
    }

    if (value === "shipped" || value === "confirmed") {
      return { background: "#dbeafe", text: "#1d4ed8" };
    }

    if (value === "cancelled" || value === "canceled") {
      return { background: "#fee2e2", text: "#dc2626" };
    }

    return { background: "#fef3c7", text: "#b45309" };
  };

  const getPaymentStyle = (status?: string) => {
    const value = (status || "Not Paid").toLowerCase();

    if (value === "paid" || value === "success" || value === "completed") {
      return { background: "#dcfce7", text: "#15803d" };
    }

    return { background: "#f4f4f5", text: "#52525b" };
  };

  const getReturnStyle = (status?: string) => {
    const value = (status || "").toLowerCase();

    if (value === "return completed") {
      return { background: "#dcfce7", text: "#15803d" };
    }

    return { background: "#ffedd5", text: "#c2410c" };
  };

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatAmount = (amount?: number | string) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (date?: string) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) {
      return "N/A";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getDisplayAddress = (order: Order) => {
    const parts: string[] = [];

    if (order.address_line || order.address) {
      parts.push(order.address_line || order.address || "");
    }

    if (order.city) parts.push(order.city);
    if (order.district) parts.push(order.district);
    if (order.state) parts.push(order.state);
    if (order.pincode) parts.push(order.pincode);

    if (parts.length === 0 && order.shipping_address) {
      const shipping =
        typeof order.shipping_address === "string"
          ? (() => {
              try {
                return JSON.parse(order.shipping_address);
              } catch {
                return null;
              }
            })()
          : order.shipping_address;

      if (shipping) {
        return [
          shipping.address_line,
          shipping.address,
          shipping.street,
          shipping.area,
          shipping.city,
          shipping.district,
          shipping.state,
          shipping.pincode,
        ]
          .filter(Boolean)
          .join(", ");
      }
    }

    return parts.join(", ");
  };

  const getStatusOf = (order: Order) =>
    String(order.order_status || order.status || "Placed");

  // =====================================================
  // ORDER COUNTS (same summary as the web app)
  // =====================================================

  const countByStatus = (status: string) =>
    orders.filter((order) => getStatusOf(order).toLowerCase() === status).length;

  const summary = [
    { label: "Total", value: orders.length },
    { label: "Placed", value: countByStatus("placed") },
    { label: "Confirmed", value: countByStatus("confirmed") },
    { label: "Shipped", value: countByStatus("shipped") },
    { label: "Delivered", value: countByStatus("delivered") },
  ];

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7c3aed"
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MERCHANT</Text>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.subtitle}>Manage customer orders</Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* SUMMARY */}

        <View style={styles.summaryGrid}>
          {summary.map((item) => (
            <View key={item.label} style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>{item.label}</Text>
              <Text style={styles.summaryBoxValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* ERROR */}

        {error !== "" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Unable to load orders</Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY */}

        {error === "" && orders.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>🛒</Text>
            </View>

            <Text style={styles.emptyTitle}>No Orders Yet</Text>

            <Text style={styles.emptyDescription}>
              Customer orders will appear here when someone purchases your
              products.
            </Text>
          </View>
        )}

        {/* ORDERS */}

        {error === "" && orders.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                <Text style={styles.sectionSubtitle}>View and manage orders</Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>{orders.length}</Text>
              </View>
            </View>

            {orders.map((order) => {
              const actualStatus = getStatusOf(order);
              const status = getStatusStyle(actualStatus);
              const payment = getPaymentStyle(order.payment_status);
              const returnStyle = getReturnStyle(order.return_status);
              const amount = order.total_amount ?? order.total ?? 0;
              const orderStatus = actualStatus.toLowerCase();

              const customerName =
                order.customer_name || order.address_name || "Customer";

              const customerPhone =
                order.customer_phone || order.address_phone || order.phone || "";

              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* ORDER TOP */}

                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderLabel}>ORDER</Text>
                      <Text style={styles.orderNumber}>#{order.id}</Text>
                    </View>

                    <View style={styles.topBadges}>
                      <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>
                          {actualStatus}
                        </Text>
                      </View>

                      {order.return_status ? (
                        <View
                          style={[
                            styles.returnBadge,
                            { backgroundColor: returnStyle.background },
                          ]}
                        >
                          <Text style={[styles.returnBadgeText, { color: returnStyle.text }]}>
                            ↩ {order.return_status}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* CUSTOMER */}

                  <View style={styles.infoGroup}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>CUSTOMER</Text>
                      <Text style={styles.infoValue}>{customerName}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>EMAIL</Text>
                      <Text style={styles.infoValue}>{order.customer_email || "N/A"}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>PHONE</Text>
                      <Text style={styles.infoValue}>{customerPhone || "N/A"}</Text>
                    </View>
                  </View>

                  {/* PRODUCTS */}

                  <View style={styles.productsBox}>
                    <Text style={styles.productsTitle}>Products</Text>

                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        const itemName = item.product_name || item.name || "Product";
                        const itemImage = item.product_image || item.image;

                        return (
                          <View
                            key={item.id || `${item.product_id}-${index}`}
                            style={styles.productRow}
                          >
                            {itemImage ? (
                              <Image source={{ uri: itemImage }} style={styles.productImage} />
                            ) : (
                              <View style={styles.productImagePlaceholder}>
                                <Text>📦</Text>
                              </View>
                            )}

                            <View style={styles.productInfo}>
                              <Text style={styles.productName} numberOfLines={2}>
                                {itemName}
                              </Text>

                              <Text style={styles.productMeta}>
                                {item.brand || item.category || "Product"}
                              </Text>
                            </View>

                            <View style={styles.productRight}>
                              <Text style={styles.productQty}>Qty {item.quantity || 0}</Text>
                              <Text style={styles.productPrice}>{formatAmount(item.price)}</Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.noItems}>Product details unavailable.</Text>
                    )}
                  </View>

                  {/* RETURN ORDER BOX */}

                  {order.return_status ? (
                    <View style={styles.returnBox}>
                      <Text style={styles.returnTitle}>↩ Return Order</Text>

                      <View style={styles.returnRow}>
                        <Text style={styles.returnLabel}>Return Status</Text>
                        <Text style={styles.returnValue}>{order.return_status}</Text>
                      </View>

                      <View style={styles.returnRow}>
                        <Text style={styles.returnLabel}>Return Reason</Text>
                        <Text style={styles.returnValue}>
                          {order.return_reason || "Not provided"}
                        </Text>
                      </View>

                      {order.return_requested_at ? (
                        <View style={styles.returnRow}>
                          <Text style={styles.returnLabel}>Requested On</Text>
                          <Text style={styles.returnValue}>
                            {formatDateTime(order.return_requested_at)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* DELIVERY ADDRESS */}

                  <View style={styles.cardAddress}>
                    <Text style={styles.cardAddressTitle}>📍 Delivery Address</Text>

                    <Text style={styles.cardAddressName}>
                      {order.address_name || order.full_name || customerName}
                    </Text>

                    <Text style={styles.cardAddressText}>
                      {getDisplayAddress(order) || "Address not available"}
                    </Text>

                    <Text style={styles.cardAddressText}>
                      Phone: {order.address_phone || order.phone || customerPhone || "N/A"}
                    </Text>
                  </View>

                  {/* PAYMENT */}

                  <View style={styles.paymentGrid}>
                    <View style={styles.paymentCell}>
                      <Text style={styles.infoLabel}>PAYMENT METHOD</Text>
                      <Text style={styles.infoValue}>{order.payment_method || "N/A"}</Text>
                    </View>

                    <View style={styles.paymentCell}>
                      <Text style={styles.infoLabel}>PAYMENT STATUS</Text>
                      <Text style={[styles.infoValue, { color: payment.text }]}>
                        {order.payment_status || "Pending"}
                      </Text>
                    </View>

                    <View style={styles.paymentCell}>
                      <Text style={styles.infoLabel}>ORDER DATE</Text>
                      <Text style={styles.infoValue}>{formatDateTime(order.created_at)}</Text>
                    </View>

                    <View style={styles.paymentCell}>
                      <Text style={styles.infoLabel}>ORDER TOTAL</Text>
                      <Text style={styles.totalValue}>{formatAmount(amount)}</Text>
                    </View>
                  </View>

                  {/* STATUS ACTION */}

                  <View style={styles.actionsContainer}>
                    {orderStatus === "placed" && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        disabled={statusLoading === order.id}
                        onPress={() => updateOrderStatus(order.id, "Confirmed")}
                      >
                        {statusLoading === order.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.confirmButtonText}>✓ Confirm Order</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {orderStatus === "confirmed" && (
                      <TouchableOpacity
                        style={styles.shipButton}
                        disabled={statusLoading === order.id}
                        onPress={() => updateOrderStatus(order.id, "Shipped")}
                      >
                        {statusLoading === order.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.shipButtonText}>🚚 Mark as Shipped</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {orderStatus === "shipped" && (
                      <View style={styles.shippedInfo}>
                        <Text style={styles.shippedInfoText}>🚚 Order has been shipped</Text>
                      </View>
                    )}

                    {orderStatus === "delivered" && (
                      <View style={styles.deliveredInfo}>
                        <Text style={styles.deliveredInfoText}>✓ Order delivered</Text>
                      </View>
                    )}

                    {(orderStatus === "cancelled" || orderStatus === "canceled") && (
                      <View style={styles.cancelledInfo}>
                        <Text style={styles.cancelledInfoText}>✕ Order cancelled</Text>
                      </View>
                    )}
                  </View>

                  {/* VIEW DETAILS */}

                  <TouchableOpacity
                    style={styles.viewOrderRow}
                    onPress={() => handleViewDetails(order)}
                  >
                    <Text style={styles.viewOrderText}>View Full Details</Text>
                    <Text style={styles.viewOrderArrow}>→</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>ORDER DETAILS</Text>
                <Text style={styles.modalTitle}>
                  {selectedOrder ? `Order #${selectedOrder.id}` : "Order"}
                </Text>
              </View>

              <TouchableOpacity style={styles.modalClose} onPress={closeDetails}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <View style={styles.detailsLoading}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.detailsLoadingText}>Loading order details...</Text>
              </View>
            ) : (
              selectedOrder && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* CUSTOMER */}

                  <Text style={styles.detailLabel}>CUSTOMER</Text>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailName}>
                      {selectedOrder.customer_name ||
                        selectedOrder.full_name ||
                        "Customer"}
                    </Text>

                    {selectedOrder.customer_email ? (
                      <Text style={styles.detailValue}>{selectedOrder.customer_email}</Text>
                    ) : null}

                    {selectedOrder.phone ? (
                      <Text style={styles.detailValue}>📞 {selectedOrder.phone}</Text>
                    ) : null}
                  </View>

                  {/* DELIVERY ADDRESS */}

                  <Text style={styles.detailLabel}>DELIVERY ADDRESS</Text>

                  <View style={styles.addressCard}>
                    <Text style={styles.addressName}>
                      {selectedOrder.full_name ||
                        selectedOrder.address_name ||
                        selectedOrder.customer_name ||
                        "Customer"}
                    </Text>

                    {selectedOrder.phone ? (
                      <Text style={styles.addressPhone}>📞 {selectedOrder.phone}</Text>
                    ) : null}

                    <Text style={styles.addressText}>
                      {getDisplayAddress(selectedOrder) || "Address not available"}
                    </Text>
                  </View>

                  {/* ORDER STATUS */}

                  <Text style={styles.detailLabel}>ORDER STATUS</Text>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailValue}>{getStatusOf(selectedOrder)}</Text>
                  </View>

                  {/* RETURN */}

                  {selectedOrder.return_status ? (
                    <>
                      <Text style={styles.detailLabel}>RETURN</Text>

                      <View style={styles.returnBox}>
                        <Text style={styles.returnTitle}>↩ Return Order</Text>

                        <View style={styles.returnRow}>
                          <Text style={styles.returnLabel}>Return Status</Text>
                          <Text style={styles.returnValue}>{selectedOrder.return_status}</Text>
                        </View>

                        <View style={styles.returnRow}>
                          <Text style={styles.returnLabel}>Return Reason</Text>
                          <Text style={styles.returnValue}>
                            {selectedOrder.return_reason || "Not provided"}
                          </Text>
                        </View>

                        {selectedOrder.return_requested_at ? (
                          <View style={styles.returnRow}>
                            <Text style={styles.returnLabel}>Requested On</Text>
                            <Text style={styles.returnValue}>
                              {formatDateTime(selectedOrder.return_requested_at)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </>
                  ) : null}

                  {/* PAYMENT */}

                  <Text style={styles.detailLabel}>PAYMENT</Text>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailValue}>
                      Status: {selectedOrder.payment_status || "Not Paid"}
                    </Text>

                    <Text style={styles.detailValue}>
                      Method: {selectedOrder.payment_method || "Not available"}
                    </Text>

                    <Text style={styles.detailValue}>
                      Order Date: {formatDateTime(selectedOrder.created_at)}
                    </Text>
                  </View>

                  {/* ITEMS */}

                  <Text style={styles.detailLabel}>ORDER ITEMS</Text>

                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => {
                      const itemName = item.product_name || item.name || "Product";
                      const itemImage = item.product_image || item.image;

                      return (
                        <View
                          key={item.id || `${item.product_id}-${index}`}
                          style={styles.itemCard}
                        >
                          {itemImage ? (
                            <Image source={{ uri: itemImage }} style={styles.itemImage} />
                          ) : (
                            <View style={styles.itemImagePlaceholder}>
                              <Text>📦</Text>
                            </View>
                          )}

                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={2}>
                              {itemName}
                            </Text>

                            <Text style={styles.itemQuantity}>
                              Quantity: {item.quantity || 0}
                            </Text>

                            <Text style={styles.itemUnitPrice}>
                              Price: {formatAmount(item.price)}
                            </Text>
                          </View>

                          <Text style={styles.itemPrice}>
                            {formatAmount(
                              Number(item.price || 0) * Number(item.quantity || 0)
                            )}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailValue}>Product details unavailable</Text>
                    </View>
                  )}

                  {/* TOTAL */}

                  <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>
                      {formatAmount(selectedOrder.total_amount ?? selectedOrder.total)}
                    </Text>
                  </View>

                  <View style={styles.modalBottomSpace} />
                </ScrollView>
              )
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7fb" },
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  content: { padding: 16, paddingBottom: 30 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 2,
  },
  backText: { fontSize: 24, color: "#27272a" },
  headerText: { flex: 1 },
  eyebrow: { color: "#7c3aed", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#18181b", fontSize: 25, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 11, marginTop: 3 },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  refreshText: { fontSize: 23, color: "#52525b" },

  // summary (5 counts like the web app)
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 18 },
  summaryBox: {
    width: "31%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: "2%",
    marginBottom: 10,
    elevation: 2,
  },
  summaryBoxLabel: { color: "#71717a", fontSize: 10, fontWeight: "700" },
  summaryBoxValue: { color: "#18181b", fontSize: 21, fontWeight: "800", marginTop: 3 },

  errorCard: {
    backgroundColor: "#fff1f2",
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  errorIcon: { fontSize: 21, marginRight: 9 },
  errorContent: { flex: 1 },
  errorTitle: { color: "#be123c", fontSize: 12, fontWeight: "800" },
  errorMessage: { color: "#9f1239", fontSize: 10, marginTop: 3 },
  retryButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: "#be123c", fontSize: 10, fontWeight: "800" },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 42,
    paddingHorizontal: 24,
    alignItems: "center",
    elevation: 2,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 21,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyIconText: { fontSize: 31 },
  emptyTitle: { color: "#18181b", fontSize: 18, fontWeight: "800" },
  emptyDescription: {
    color: "#71717a",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 7,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { color: "#18181b", fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: "#71717a", fontSize: 10, marginTop: 3 },
  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: { color: "#7c3aed", fontSize: 12, fontWeight: "800" },

  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
    elevation: 2,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  orderLabel: { color: "#a1a1aa", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  orderNumber: { color: "#18181b", fontSize: 17, fontWeight: "800", marginTop: 2 },
  orderDate: { color: "#71717a", fontSize: 10 },

  customerRow: { flexDirection: "row", alignItems: "center", marginTop: 13 },
  customerIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  customerInfo: { flex: 1, marginLeft: 10 },
  customerName: { color: "#27272a", fontSize: 13, fontWeight: "800" },
  customerEmail: { color: "#71717a", fontSize: 10, marginTop: 2 },

  // products on the card
  productsBox: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
  },
  productsTitle: { color: "#71717a", fontSize: 10, fontWeight: "800", marginBottom: 8 },
  productRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  productImage: { width: 46, height: 46, borderRadius: 9, backgroundColor: "#f4f4f5" },
  productImagePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 9,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1, marginLeft: 10 },
  productName: { color: "#18181b", fontSize: 12, fontWeight: "800" },
  productMeta: { color: "#71717a", fontSize: 10, marginTop: 2 },
  productRight: { alignItems: "flex-end", marginLeft: 8 },
  productQty: { color: "#71717a", fontSize: 10 },
  productPrice: { color: "#18181b", fontSize: 12, fontWeight: "800", marginTop: 2 },


  topBadges: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", flex: 1 },

  infoGroup: { marginTop: 13 },
  infoItem: { marginBottom: 9 },
  infoLabel: { color: "#a1a1aa", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  infoValue: { color: "#27272a", fontSize: 13, fontWeight: "700", marginTop: 3 },
  noItems: { color: "#71717a", fontSize: 11 },

  cardAddress: {
    marginTop: 13,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f7f7fb",
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
  },
  cardAddressTitle: { color: "#18181b", fontSize: 12, fontWeight: "800", marginBottom: 6 },
  cardAddressName: { color: "#18181b", fontSize: 13, fontWeight: "800" },
  cardAddressText: { color: "#52525b", fontSize: 12, lineHeight: 18, marginTop: 3 },

  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
  },
  paymentCell: { width: "50%", marginBottom: 10, paddingRight: 8 },
  totalValue: { color: "#5b21b6", fontSize: 17, fontWeight: "800", marginTop: 3 },

  // return
  returnBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 12,
    marginTop: 13,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  returnTitle: { color: "#c2410c", fontSize: 12, fontWeight: "800", marginBottom: 8 },
  returnRow: { marginBottom: 6 },
  returnLabel: { color: "#9a3412", fontSize: 9, fontWeight: "700" },
  returnValue: { color: "#431407", fontSize: 12, fontWeight: "700", marginTop: 2 },
  returnBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6 },
  returnBadgeText: { fontSize: 9, fontWeight: "800" },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  amountLabel: { color: "#71717a", fontSize: 10 },
  amount: { color: "#18181b", fontSize: 17, fontWeight: "800" },

  badgesRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6 },
  statusText: { fontSize: 9, fontWeight: "800" },
  paymentBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  paymentText: { fontSize: 9, fontWeight: "800" },

  actionsContainer: { marginTop: 13 },
  confirmButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  confirmButtonText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  shipButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  shipButtonText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  shippedInfo: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  shippedInfoText: { color: "#2563eb", fontSize: 11, fontWeight: "800" },
  deliveredInfo: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  deliveredInfoText: { color: "#15803d", fontSize: 11, fontWeight: "800" },
  cancelledInfo: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  cancelledInfoText: { color: "#dc2626", fontSize: 11, fontWeight: "800" },

  viewOrderRow: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    marginTop: 13,
    paddingTop: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewOrderText: { color: "#7c3aed", fontSize: 10, fontWeight: "800" },
  viewOrderArrow: { color: "#7c3aed", fontSize: 17 },

  // modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: "#f7f7fb",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 18,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalEyebrow: { color: "#7c3aed", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  modalTitle: { color: "#18181b", fontSize: 22, fontWeight: "800", marginTop: 3 },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { fontSize: 24, color: "#52525b" },

  detailsLoading: { minHeight: 300, alignItems: "center", justifyContent: "center" },
  detailsLoadingText: { color: "#71717a", fontSize: 12, marginTop: 10 },

  detailLabel: {
    color: "#71717a",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 7,
  },
  detailCard: { backgroundColor: "#ffffff", borderRadius: 13, padding: 13, marginBottom: 5 },
  detailName: { color: "#18181b", fontSize: 14, fontWeight: "800" },
  detailValue: { color: "#52525b", fontSize: 12, marginTop: 5 },

  addressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 13,
    padding: 14,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
  },
  addressName: { color: "#18181b", fontSize: 14, fontWeight: "800" },
  addressPhone: { color: "#52525b", fontSize: 11, marginTop: 4 },
  addressText: { color: "#52525b", fontSize: 12, lineHeight: 19, marginTop: 8 },

  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 13,
    padding: 11,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: { width: 62, height: 62, borderRadius: 10, backgroundColor: "#f4f4f5" },
  itemImagePlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemName: { color: "#18181b", fontSize: 13, fontWeight: "800" },
  itemQuantity: { color: "#71717a", fontSize: 10, marginTop: 4 },
  itemUnitPrice: { color: "#71717a", fontSize: 10, marginTop: 2 },
  itemPrice: { color: "#18181b", fontSize: 13, fontWeight: "800", marginLeft: 8 },

  totalCard: {
    backgroundColor: "#ede9fe",
    borderRadius: 14,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: "#5b21b6", fontSize: 13, fontWeight: "700" },
  totalAmount: { color: "#5b21b6", fontSize: 19, fontWeight: "800" },
  modalBottomSpace: { height: 30 },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#71717a", fontSize: 13, marginTop: 12 },
  bottomSpace: { height: 25 },
});
