import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { API_BASE_URL } from "../../config/api";

type ReturnOrder = {
  id: number;

  product_names?: string;

  customer_name?: string;
  user_name?: string;

  return_reason?: string;
  return_status?: string;

  address_line?: string;
  shipping_address?: string;

  [key: string]: any;
};

const RETURN_FILTERS = [
  "All",
  "Requested",
  "Pickup Scheduled",
  "Picked Up",
  "Return Completed",
];

export default function DeliveryReturns() {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] =
    useState("All");

  const [returns, setReturns] =
    useState<ReturnOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  // ==========================================
  // GET DELIVERY PARTNER
  // ==========================================

  const getDeliveryPartner = async () => {
    const userData =
      await AsyncStorage.getItem(
        "loggedInUser"
      );

    if (!userData) {
      router.replace("/login");
      return null;
    }

    const user = JSON.parse(userData);

    if (user.role !== "delivery") {
      Alert.alert(
        "Access Denied",
        "Delivery partner login required."
      );

      router.replace("/login");
      return null;
    }

    return user;
  };

  // ==========================================
  // LOAD RETURN ORDERS
  // ==========================================

  const loadReturns = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const deliveryPartner =
          await getDeliveryPartner();

        if (!deliveryPartner?.id) {
          throw new Error(
            "Delivery partner ID not found."
          );
        }

        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        if (!token) {
          throw new Error(
            "Login token not found. Please login again."
          );
        }

        console.log(
          "DELIVERY PARTNER:",
          deliveryPartner
        );

        const response = await fetch(
          `${API_BASE_URL}/api/delivery/my-orders/${deliveryPartner.id}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,

              "x-user-id":
                String(deliveryPartner.id),
            },
          }
        );

        const data =
          await response.json();

        console.log(
          "ALL DELIVERY ORDERS:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch orders"
          );
        }

        const orders =
          data.orders || [];

        console.log(
          "FIRST ORDER:",
          orders[0]
        );

        // ==========================================
        // FILTER RETURN ORDERS
        // SAME LOGIC AS WEBSITE
        // ==========================================

        const returnOrders =
          orders.filter(
            (order: ReturnOrder) => {
              return (
                order.delivery_status ===
                  "Return Requested" ||

                order.delivery_status ===
                  "Returned" ||

                order.return_status ===
                  "Requested" ||

                order.return_status ===
                  "Return Requested" ||

                order.return_status ===
                  "Pickup Scheduled" ||

                order.return_status ===
                  "Picked Up" ||

                order.return_status ===
                  "Return Completed" ||

                order.status ===
                  "Return Requested" ||

                order.status ===
                  "Returned"
              );
            }
          );

        console.log(
          "FILTERED RETURNS:",
          returnOrders
        );

        setReturns(
          returnOrders
        );
      } catch (err: any) {
        console.error(
          "Fetch returns error:",
          err
        );

        setReturns([]);

        setError(
          err?.message ||
            "Failed to load returns"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // ==========================================
  // REFRESH
  // ==========================================

  const onRefresh = () => {
    setRefreshing(true);
    loadReturns();
  };

  // ==========================================
  // FILTER RETURNS
  // ==========================================

  const filteredReturns = useMemo(() => {
    if (selectedStatus === "All") {
      return returns;
    }

    return returns.filter(
      (item) =>
        item.return_status ===
        selectedStatus
    );
  }, [
    returns,
    selectedStatus,
  ]);

  // ==========================================
  // UPDATE RETURN STATUS
  // ==========================================

  const updateReturnStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      const deliveryPartner =
        await getDeliveryPartner();

      if (!deliveryPartner?.id) {
        throw new Error(
          "Delivery partner ID not found."
        );
      }

      const token =
        await AsyncStorage.getItem(
          "authToken"
        );

      if (!token) {
        Alert.alert(
          "Login Required",
          "Login token not found. Please login again."
        );
        return;
      }

      setUpdatingOrderId(orderId);

      console.log(
        "RETURN UPDATE:",
        orderId,
        newStatus
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/orders/${orderId}/return/status`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,

              "x-user-id":
                String(
                  deliveryPartner.id
                ),
            },

            body: JSON.stringify({
              return_status:
                newStatus,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "UPDATE RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update return"
        );
      }

      // ==========================================
      // UPDATE UI IMMEDIATELY
      // ==========================================

      setReturns(
        (previousReturns) =>
          previousReturns.map(
            (item) =>
              Number(item.id) ===
              Number(orderId)
                ? {
                    ...item,
                    return_status:
                      newStatus,
                  }
                : item
          )
      );

      Alert.alert(
        "Success",
        `Return status updated to "${newStatus}".`
      );
    } catch (err: any) {
      console.error(
        "Update return error:",
        err
      );

      Alert.alert(
        "Error",
        err?.message ||
          "Failed to update return"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ==========================================
  // RETURN ACTION BUTTON
  // ==========================================

  const renderActionButton = (
    item: ReturnOrder
  ) => {
    const status =
      item.return_status ||
      "Requested";

    const updating =
      updatingOrderId === item.id;

    // REQUESTED
    if (status === "Requested") {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateReturnStatus(
              item.id,
              "Pickup Scheduled"
            )
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
              style={styles.primaryButtonText}
            >
              Schedule Pickup
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // PICKUP SCHEDULED
    if (
      status ===
      "Pickup Scheduled"
    ) {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateReturnStatus(
              item.id,
              "Picked Up"
            )
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
              style={styles.primaryButtonText}
            >
              Mark as Picked Up
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // PICKED UP
    if (status === "Picked Up") {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateReturnStatus(
              item.id,
              "Return Completed"
            )
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
              style={styles.primaryButtonText}
            >
              Complete Return
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case "Requested":
      case "Return Requested":
        return {
          backgroundColor: "#fff7ed",
          color: "#c2410c",
        };

      case "Pickup Scheduled":
        return {
          backgroundColor: "#eff6ff",
          color: "#2563eb",
        };

      case "Picked Up":
        return {
          backgroundColor: "#f5f3ff",
          color: "#7c3aed",
        };

      case "Return Completed":
        return {
          backgroundColor: "#dcfce7",
          color: "#15803d",
        };

      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#4b5563",
        };
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={styles.loadingText}
          >
            Loading returns...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* ====================================
            HEADER
        ==================================== */}

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

          <View
            style={styles.headerText}
          >
            <Text
              style={styles.headerSmall}
            >
              RETURN MANAGEMENT
            </Text>

            <Text
              style={styles.headerTitle}
            >
              Returns
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Manage product return pickups
              and updates.
            </Text>
          </View>

          {/* Total Returns */}

          <View
            style={styles.totalReturns}
          >
            <Text
              style={styles.totalLabel}
            >
              Total Returns
            </Text>

            <Text
              style={styles.totalValue}
            >
              {returns.length}
            </Text>
          </View>
        </View>

        {/* ====================================
            FILTERS
        ==================================== */}

        <View
          style={styles.filterSection}
        >
          <Text
            style={styles.filterTitle}
          >
            Filter by Status
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterContainer
            }
          >
            {RETURN_FILTERS.map(
              (status) => {
                const active =
                  selectedStatus ===
                  status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterButton,
                      active &&
                        styles.activeFilterButton,
                    ]}
                    onPress={() =>
                      setSelectedStatus(
                        status
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.activeFilterText,
                      ]}
                    >
                      {status ===
                      "Requested"
                        ? "Return Requested"
                        : status}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* ====================================
            ERROR
        ==================================== */}

        {!loading &&
          error && (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={styles.emptyIcon}
              >
                ⚠️
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                Failed to load returns
              </Text>

              <Text
                style={styles.emptyText}
              >
                {error}
              </Text>

              <TouchableOpacity
                style={
                  styles.tryAgainButton
                }
                onPress={
                  loadReturns
                }
              >
                <Text
                  style={
                    styles.tryAgainText
                  }
                >
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* ====================================
            RETURNS LIST
        ==================================== */}

        {!loading &&
          !error && (
            <View
              style={
                styles.returnsList
              }
            >
              {filteredReturns.map(
                (item) => {
                  const status =
                    item.return_status ||
                    "Requested";

                  const statusStyle =
                    getStatusStyle(
                      status
                    );

                  return (
                    <View
                      key={item.id}
                      style={
                        styles.returnCard
                      }
                    >
                      {/* ======================
                          TOP
                      ====================== */}

                      <View
                        style={
                          styles.returnCardTop
                        }
                      >
                        <View
                          style={
                            styles.orderInfo
                          }
                        >
                          <View
                            style={
                              styles.returnIcon
                            }
                          >
                            <Text
                              style={
                                styles.returnIconText
                              }
                            >
                              ↩
                            </Text>
                          </View>

                          <View
                            style={
                              styles.orderTextContainer
                            }
                          >
                            <Text
                              style={
                                styles.orderId
                              }
                            >
                              #{item.id}
                            </Text>

                            <Text
                              style={
                                styles.productName
                              }
                              numberOfLines={
                                2
                              }
                            >
                              {item.product_names ||
                                "Product"}
                            </Text>
                          </View>
                        </View>

                        {/* STATUS */}

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                statusStyle.backgroundColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  statusStyle.color,
                              },
                            ]}
                          >
                            {status ===
                            "Requested"
                              ? "Return Requested"
                              : status}
                          </Text>
                        </View>
                      </View>

                      {/* ======================
                          CUSTOMER INFORMATION
                      ====================== */}

                      <View
                        style={
                          styles.customerInfo
                        }
                      >
                        {/* Customer */}

                        <View
                          style={
                            styles.infoBlock
                          }
                        >
                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            CUSTOMER
                          </Text>

                          <Text
                            style={
                              styles.infoValue
                            }
                          >
                            {item.customer_name ||
                              item.user_name ||
                              "Customer"}
                          </Text>
                        </View>

                        {/* Return Reason */}

                        <View
                          style={
                            styles.infoBlock
                          }
                        >
                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            RETURN REASON
                          </Text>

                          <Text
                            style={
                              styles.infoValue
                            }
                          >
                            {item.return_reason ||
                              "Not specified"}
                          </Text>
                        </View>

                        {/* Address */}

                        <View
                          style={
                            styles.infoBlock
                          }
                        >
                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            PICKUP ADDRESS
                          </Text>

                          <Text
                            style={
                              styles.infoValue
                            }
                          >
                            📍{" "}
                            {item.address_line ||
                              item.shipping_address ||
                              "Address not available"}
                          </Text>
                        </View>
                      </View>

                      {/* ======================
                          ACTIONS
                      ====================== */}

                      <View
                        style={
                          styles.actions
                        }
                      >
                        {/* View Details */}

                        <TouchableOpacity
                          style={
                            styles.viewButton
                          }
                          onPress={() =>
                            router.push(
                              {
                                pathname:
                                  "/delivery/order-details",
                                params: {
                                  orderId:
                                    String(
                                      item.id
                                    ),
                                  isReturn:
                                    "true",
                                },
                              }
                            )
                          }
                        >
                          <Text
                            style={
                              styles.viewButtonText
                            }
                          >
                            View Details
                          </Text>
                        </TouchableOpacity>

                        {/* Status action */}

                        {renderActionButton(
                          item
                        )}
                      </View>
                    </View>
                  );
                }
              )}

              {/* =================================
                  NO RETURNS
              ================================= */}

              {filteredReturns.length ===
                0 && (
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
                    No returns found
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    There are no return requests
                    in this category.
                  </Text>
                </View>
              )}
            </View>
          )}

        
      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  scrollContent: {
    paddingBottom: 35,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#6b7280",
  },

  // HEADER

  header: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  backText: {
    fontSize: 32,
    lineHeight: 35,
    color: "#2563eb",
  },

  headerText: {
    marginBottom: 15,
  },

  headerSmall: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginTop: 5,
  },

  totalReturns: {
    alignSelf: "flex-start",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  totalLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },

  totalValue: {
    fontSize: 25,
    color: "#111827",
    fontWeight: "800",
    marginTop: 2,
  },

  // FILTER

  filterSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  filterTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },

  filterContainer: {
    paddingRight: 15,
  },

  filterButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 7,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  activeFilterButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  filterText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4b5563",
  },

  activeFilterText: {
    color: "#ffffff",
  },

  // LIST

  returnsList: {
    padding: 16,
  },

  // CARD

  returnCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginBottom: 14,
  },

  returnCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderInfo: {
    flexDirection: "row",
    flex: 1,
    paddingRight: 8,
  },

  returnIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  returnIconText: {
    fontSize: 25,
    color: "#c2410c",
    fontWeight: "700",
  },

  orderTextContainer: {
    flex: 1,
  },

  orderId: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  productName: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 18,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: 135,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  // CUSTOMER INFO

  customerInfo: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    marginTop: 15,
    paddingVertical: 14,
  },

  infoBlock: {
    marginBottom: 13,
  },

  infoLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.6,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    lineHeight: 20,
  },

  // ACTIONS

  actions: {
    flexDirection: "row",
    marginTop: 13,
  },

  viewButton: {
    flex: 1,
    height: 46,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },

  viewButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 9,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 5,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  // EMPTY

  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 35,
    alignItems: "center",
    margin: 16,
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginTop: 10,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },

  tryAgainButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 9,
  },

  tryAgainText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  // DASHBOARD

  dashboardButton: {
    marginHorizontal: 16,
    marginTop: 5,
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  dashboardButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});