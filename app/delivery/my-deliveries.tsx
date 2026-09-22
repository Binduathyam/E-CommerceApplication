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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { API_BASE_URL } from "../../config/api";

type Order = {
  id: number;
  order_number?: string;

  delivery_status?: string;

  customer_name?: string;
  address_name?: string;
  name?: string;
  user_name?: string;

  customer_phone?: string;
  address_phone?: string;
  phone?: string;
  phone_number?: string;

  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;

  shipping_address?: any;

  total_amount?: number | string;

  payment_method?: string;

  priority?: string;

  assigned_at?: string;

  [key: string]: any;
};

const FILTERS = [
  "All",
  "Assigned",
  "Accepted",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
];

export default function MyDeliveries() {
  const router = useRouter();

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [deliveries, setDeliveries] =
    useState<Order[]>([]);

  const [searchTerm, setSearchTerm] =
    useState("");

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
  // CUSTOMER NAME
  // ==========================================

  const getCustomerName = (
    delivery: Order
  ) => {
    return (
      delivery.customer_name ||
      delivery.address_name ||
      delivery.name ||
      delivery.user_name ||
      "Customer"
    );
  };

  // ==========================================
  // CUSTOMER PHONE
  // ==========================================

  const getCustomerPhone = (
    delivery: Order
  ) => {
    return (
      delivery.customer_phone ||
      delivery.address_phone ||
      delivery.phone ||
      delivery.phone_number ||
      "Not available"
    );
  };

  // ==========================================
  // DELIVERY ADDRESS
  // ==========================================

  const getAddress = (
    delivery: Order
  ) => {
    // First use database address fields
    const addressParts = [
      delivery.address_line,
      delivery.city,
      delivery.state,
      delivery.pincode,
    ].filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    );

    if (addressParts.length > 0) {
      return addressParts.join(", ");
    }

    // Fallback shipping_address
    if (delivery.shipping_address) {
      try {
        const address =
          typeof delivery.shipping_address ===
          "string"
            ? JSON.parse(
                delivery.shipping_address
              )
            : delivery.shipping_address;

        const fallbackParts = [
          address?.address_line,
          address?.address,
          address?.street,
          address?.area,
          address?.city,
          address?.state,
          address?.pincode,
        ].filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        );

        if (
          fallbackParts.length > 0
        ) {
          return fallbackParts.join(
            ", "
          );
        }

        return String(
          delivery.shipping_address
        );
      } catch {
        return String(
          delivery.shipping_address
        );
      }
    }

    return "Address not available";
  };

  // ==========================================
  // LOAD DELIVERIES
  // ==========================================

  const loadDeliveries = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const deliveryPartner =
          await getDeliveryPartner();

        if (!deliveryPartner?.id) {
          throw new Error(
            "Delivery partner information not found."
          );
        }

        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        if (!token) {
          throw new Error(
            "Authentication required. Please login again."
          );
        }

        console.log(
          "My Deliveries - Partner ID:",
          deliveryPartner.id
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
          "My deliveries response:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to fetch deliveries"
          );
        }

        const allOrders =
  data.orders ||
  data.data ||
  [];

console.log(
  "================================"
);

console.log(
  "DELIVERY PARTNER ID:",
  deliveryPartner.id
);

console.log(
  "ALL ORDERS FROM BACKEND:",
  JSON.stringify(
    allOrders,
    null,
    2
  )
);

console.log(
  "================================"
);

setDeliveries(
  Array.isArray(allOrders)
    ? allOrders
    : []
);
      } catch (err: any) {
        console.error(
          "My deliveries error:",
          err
        );

        setError(
          err?.message ||
            "Failed to load deliveries"
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
    loadDeliveries();
  }, [loadDeliveries]);

  // ==========================================
  // REFRESH
  // ==========================================

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  // ==========================================
  // UPDATE DELIVERY STATUS
  // ==========================================

  const updateDeliveryStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      const deliveryPartner =
        await getDeliveryPartner();

      if (!deliveryPartner?.id) {
        throw new Error(
          "Delivery partner information not found."
        );
      }

      const token =
        await AsyncStorage.getItem(
          "authToken"
        );

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      setUpdatingOrderId(orderId);

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/update-status`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

            "x-user-id":
              String(deliveryPartner.id),
          },

          body: JSON.stringify({
            order_id: orderId,

            delivery_partner_id:
              deliveryPartner.id,

            delivery_status:
              newStatus,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Status update response:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update delivery status"
        );
      }

      await loadDeliveries();
    } catch (err: any) {
      console.error(
        "Update status error:",
        err
      );

      Alert.alert(
        "Error",
        err?.message ||
          "Failed to update delivery status"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ==========================================
  // ACTION BUTTON
  // ==========================================

  const renderActionButton = (
    delivery: Order
  ) => {
    const status =
      delivery.delivery_status ||
      "Assigned";

    const isUpdating =
      updatingOrderId === delivery.id;

    // ASSIGNED → ACCEPTED

    if (status === "Assigned") {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateDeliveryStatus(
              delivery.id,
              "Accepted"
            )
          }
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.primaryButtonText}
            >
              Accept Order
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // ACCEPTED → PICKED UP

    if (status === "Accepted") {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateDeliveryStatus(
              delivery.id,
              "Picked Up"
            )
          }
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.primaryButtonText}
            >
              Pick Up Order
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // PICKED UP → OUT FOR DELIVERY

    if (status === "Picked Up") {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateDeliveryStatus(
              delivery.id,
              "Out for Delivery"
            )
          }
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.primaryButtonText}
            >
              Start Delivery
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // OUT FOR DELIVERY → DELIVERED

    if (
      status === "Out for Delivery"
    ) {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            updateDeliveryStatus(
              delivery.id,
              "Delivered"
            )
          }
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.primaryButtonText}
            >
              Mark Delivered
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const totalAssigned =
    deliveries.length;

  const pendingPickup =
    deliveries.filter(
      (delivery) =>
        String(
          delivery.delivery_status ||
            ""
        ).trim() === "Assigned"
    ).length;

  const onTheWay =
    deliveries.filter(
      (delivery) =>
        String(
          delivery.delivery_status ||
            ""
        ).trim() ===
        "Out for Delivery"
    ).length;

  const completedToday =
    deliveries.filter(
      (delivery) =>
        String(
          delivery.delivery_status ||
            ""
        ).trim() === "Delivered"
    ).length;

  // ==========================================
  // FILTER + SEARCH
  // ==========================================

  const filteredDeliveries =
    useMemo(() => {
      return deliveries.filter(
        (delivery) => {
          const status =
            String(
              delivery.delivery_status ||
                ""
            ).trim();

          const customerName =
            getCustomerName(
              delivery
            );

          const statusMatch =
            activeFilter === "All" ||
            status === activeFilter;

          const searchValue =
            searchTerm
              .toLowerCase()
              .trim();

          const searchMatch =
            String(
              delivery.id
            )
              .toLowerCase()
              .includes(searchValue) ||
            customerName
              .toLowerCase()
              .includes(searchValue);

          return (
            statusMatch &&
            searchMatch
          );
        }
      );
    }, [
      deliveries,
      activeFilter,
      searchTerm,
    ]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "Not available";
    }

    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString;
    }

    return date.toLocaleString();
  };

  // ==========================================
  // FORMAT AMOUNT
  // ==========================================

  const formatAmount = (
    amount: number | string | undefined
  ) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case "Assigned":
        return {
          backgroundColor: "#fff7ed",
          color: "#c2410c",
        };

      case "Accepted":
        return {
          backgroundColor: "#eff6ff",
          color: "#2563eb",
        };

      case "Picked Up":
        return {
          backgroundColor: "#f5f3ff",
          color: "#7c3aed",
        };

      case "Out for Delivery":
        return {
          backgroundColor: "#ecfeff",
          color: "#0891b2",
        };

      case "Delivered":
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
            Loading deliveries...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // MAIN UI
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
        keyboardShouldPersistTaps="handled"
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

          <Text
            style={styles.headerSmall}
          >
            DELIVERY MANAGEMENT
          </Text>

          <Text
            style={styles.headerTitle}
          >
            My Deliveries
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Manage and track all orders
            assigned to you.
          </Text>

          <View
            style={styles.areaBadge}
          >
            <Text
              style={styles.areaIcon}
            >
              📍
            </Text>

            <Text
              style={styles.areaText}
            >
              My Delivery Area
            </Text>
          </View>
        </View>

        {/* ====================================
            SUMMARY
        ==================================== */}

        <View
          style={styles.summarySection}
        >
          {/* Total */}

          <View
            style={styles.summaryCard}
          >
            <View
              style={[
                styles.summaryIcon,
                styles.totalIcon,
              ]}
            >
              <Text
                style={styles.summaryIconText}
              >
                📦
              </Text>
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                Total Assigned
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {totalAssigned}
              </Text>
            </View>
          </View>

          {/* Pending */}

          <View
            style={styles.summaryCard}
          >
            <View
              style={[
                styles.summaryIcon,
                styles.assignedIcon,
              ]}
            >
              <Text
                style={styles.summaryIconText}
              >
                📋
              </Text>
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                Pending Pickup
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {pendingPickup}
              </Text>
            </View>
          </View>

          {/* On The Way */}

          <View
            style={styles.summaryCard}
          >
            <View
              style={[
                styles.summaryIcon,
                styles.progressIcon,
              ]}
            >
              <Text
                style={styles.summaryIconText}
              >
                🚚
              </Text>
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                On The Way
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {onTheWay}
              </Text>
            </View>
          </View>

          {/* Completed */}

          <View
            style={styles.summaryCard}
          >
            <View
              style={[
                styles.summaryIcon,
                styles.completedIcon,
              ]}
            >
              <Text
                style={styles.summaryIconText}
              >
                ✓
              </Text>
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                Completed
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {completedToday}
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================
            DELIVERY LIST HEADER
        ==================================== */}

        <View
          style={styles.listSection}
        >
          <Text
            style={styles.sectionSmall}
          >
            ASSIGNED ORDERS
          </Text>

          <Text
            style={styles.sectionTitle}
          >
            Your Delivery Tasks
          </Text>

          {/* Search */}

          <View
            style={styles.searchBox}
          >
            <Text
              style={styles.searchIcon}
            >
              ⌕
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search order or customer..."
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={
                setSearchTerm
              }
            />

            {searchTerm.length >
              0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearchTerm("")
                }
              >
                <Text
                  style={
                    styles.clearSearch
                  }
                >
                  ×
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ====================================
              FILTERS
          ==================================== */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            style={styles.filterScroll}
            contentContainerStyle={
              styles.filterContainer
            }
          >
            {FILTERS.map(
              (filter) => {
                const active =
                  activeFilter ===
                  filter;

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      active &&
                        styles.activeFilter,
                    ]}
                    onPress={() =>
                      setActiveFilter(
                        filter
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
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

          {/* ====================================
              ERROR
          ==================================== */}

          {error ? (
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
                Unable to load deliveries
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
                  loadDeliveries
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
          ) : filteredDeliveries.length >
            0 ? (
            /* ==================================
               DELIVERY CARDS
            ================================== */

            <View>
              {filteredDeliveries.map(
                (delivery) => {
                  const status =
                    delivery.delivery_status ||
                    "Assigned";

                  const statusStyle =
                    getStatusStyle(
                      status
                    );

                  return (
                    <View
                      key={
                        delivery.id
                      }
                      style={
                        styles.deliveryCard
                      }
                    >
                      {/* TOP */}

                      <View
                        style={
                          styles.deliveryTop
                        }
                      >
                        <View
                          style={
                            styles.orderIdContainer
                          }
                        >
                          <View
                            style={
                              styles.packageIcon
                            }
                          >
                            <Text>
                              📦
                            </Text>
                          </View>

                          <View>
                            <Text
                              style={
                                styles.orderId
                              }
                            >
                              #ORD
                              {
                                delivery.id
                              }
                            </Text>

                            <Text
                              style={
                                styles.assignedDate
                              }
                            >
                              Assigned:{" "}
                              {formatDate(
                                delivery.assigned_at
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* PRIORITY */}

                        <View
                          style={
                            styles.priorityBadge
                          }
                        >
                          <Text
                            style={
                              styles.priorityText
                            }
                          >
                            {delivery.priority ||
                              "Medium"}{" "}
                            Priority
                          </Text>
                        </View>
                      </View>

                      {/* =================================
                          CUSTOMER INFO
                      ================================= */}

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
                              styles.infoStrong
                            }
                          >
                            {getCustomerName(
                              delivery
                            )}
                          </Text>

                          <Text
                            style={
                              styles.infoSmall
                            }
                          >
                            📞{" "}
                            {getCustomerPhone(
                              delivery
                            )}
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
                            DELIVERY ADDRESS
                          </Text>

                          <Text
                            style={
                              styles.infoStrong
                            }
                          >
                            Delivery Location
                          </Text>

                          <Text
                            style={
                              styles.infoSmall
                            }
                          >
                            📍{" "}
                            {getAddress(
                              delivery
                            )}
                          </Text>
                        </View>

                        {/* Amount */}

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
                            ORDER AMOUNT
                          </Text>

                          <Text
                            style={
                              styles.amountText
                            }
                          >
                            {formatAmount(
                              delivery.total_amount
                            )}
                          </Text>

                          <Text
                            style={
                              styles.infoSmall
                            }
                          >
                            {delivery.payment_method ||
                              "Payment method not available"}
                          </Text>
                        </View>
                      </View>

                      {/* =================================
                          BOTTOM
                      ================================= */}

                      <View
                        style={
                          styles.deliveryBottom
                        }
                      >
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
                              styles.statusText,
                              {
                                color:
                                  statusStyle.color,
                              },
                            ]}
                          >
                            {status}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.actionContainer
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
                                        delivery.id
                                      ),
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

                          {/* Status Action */}

                          {renderActionButton(
                            delivery
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          ) : (
            /* ==================================
               EMPTY
            ================================== */

            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={styles.emptyIcon}
              >
                📦
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                No deliveries found
              </Text>

              <Text
                style={styles.emptyText}
              >
                {searchTerm
                  ? "No orders match your search."
                  : "There are no orders with this status."}
              </Text>
            </View>
          )}
        </View>

        
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

  headerSmall: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 1,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginTop: 4,
  },

  areaBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 15,
  },

  areaIcon: {
    fontSize: 18,
    marginRight: 7,
  },

  areaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  // SUMMARY

  summarySection: {
    padding: 16,
    paddingBottom: 5,
  },

  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  totalIcon: {
    backgroundColor: "#eef2ff",
  },

  assignedIcon: {
    backgroundColor: "#fff7ed",
  },

  progressIcon: {
    backgroundColor: "#ecfeff",
  },

  completedIcon: {
    backgroundColor: "#dcfce7",
  },

  summaryIconText: {
    fontSize: 22,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  summaryValue: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  // LIST

  listSection: {
    backgroundColor: "#ffffff",
    marginTop: 10,
    padding: 16,
  },

  sectionSmall: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 0.8,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111827",
    marginTop: 3,
    marginBottom: 15,
  },

  // SEARCH

  searchBox: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },

  searchIcon: {
    fontSize: 23,
    color: "#6b7280",
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 13,
    color: "#111827",
  },

  clearSearch: {
    fontSize: 24,
    color: "#6b7280",
    paddingHorizontal: 4,
  },

  // FILTERS

  filterScroll: {
    marginTop: 12,
  },

  filterContainer: {
    paddingRight: 10,
  },

  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 7,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  activeFilter: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },

  activeFilterText: {
    color: "#ffffff",
  },

  // DELIVERY CARD

  deliveryCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },

  deliveryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  packageIcon: {
    width: 46,
    height: 46,
    borderRadius: 11,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  orderId: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  assignedDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },

  priorityBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 5,
  },

  priorityText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#c2410c",
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

  infoBlockLast: {
    marginBottom: 0,
  },

  infoLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.5,
  },

  infoStrong: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },

  infoSmall: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
    marginTop: 4,
  },

  amountText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },

  // BOTTOM

  deliveryBottom: {
    marginTop: 13,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  actionContainer: {
    flexDirection: "row",
    marginTop: 12,
  },

  viewButton: {
    flex: 1,
    height: 45,
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
    height: 45,
    borderRadius: 9,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

  // EMPTY

  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 15,
    padding: 35,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginTop: 10,
  },

  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
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
    marginTop: 15,
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