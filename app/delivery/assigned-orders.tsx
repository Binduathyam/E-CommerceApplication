import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";

import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "../../config/api";

// =====================================================
// TYPES
// =====================================================

interface Order {
  id: number;
  user_id: number;
  address_id: number;
  total_amount: string | number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_status: string;

  return_status?: string | null;
  return_reason?: string | null;
  return_requested_at?: string | null;

  shipping_address?: string | null;

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
}

// =====================================================
// COMPONENT
// =====================================================

const AssignedOrders: React.FC = () => {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [accepting, setAccepting] =
    useState(false);

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const loggedInUser =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      const authToken =
        await AsyncStorage.getItem(
          "authToken"
        );

      if (!loggedInUser) {
        Alert.alert(
          "Login Required",
          "Delivery partner details not found."
        );

        return;
      }

      const deliveryPartner =
        JSON.parse(loggedInUser);

      if (
        !deliveryPartner?.id ||
        deliveryPartner?.role !== "delivery"
      ) {
        Alert.alert(
          "Invalid Login",
          "Please login using a delivery partner account."
        );

        return;
      }

      // =================================================
      // GET ORDERS
      // =================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/delivery/my-orders/${deliveryPartner.id}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              ...(authToken
                ? {
                    Authorization:
                      `Bearer ${authToken}`,
                  }
                : {}),

              "x-user-id":
                String(
                  deliveryPartner.id
                ),
            },
          }
        );

      const data =
        await response.json();

      console.log(
        "MY ORDERS RESPONSE:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to fetch delivery orders"
        );
      }

      // =================================================
      // DEBUG BACKEND ORDERS
      // =================================================

      console.log(
        "ASSIGNED ORDERS FROM BACKEND:",
        JSON.stringify(
          data.orders,
          null,
          2
        )
      );

      // =================================================
      // ACTIVE ORDERS
      //
      // New workflow:
      //
      // Not Assigned
      // Accepted
      // Picked Up
      // Out for Delivery
      //
      // Assigned is kept for old orders.
      // =================================================

      const activeOrders =
        (data.orders || []).filter(
          (order: Order) =>
            [
              "Not Assigned",
              "Assigned",
              "Accepted",
              "Picked Up",
              "Out for Delivery",
            ].includes(
              order.delivery_status
            )
        );

      console.log(
        "ACTIVE ASSIGNED ORDERS:",
        activeOrders
      );

      setOrders(
        activeOrders
      );

      setFilteredOrders(
        activeOrders
      );
    } catch (error: any) {
      console.error(
        "LOAD ORDERS ERROR:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // SCREEN FOCUS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  // =====================================================
  // REFRESH
  // =====================================================

  const onRefresh =
    async () => {
      setRefreshing(true);

      await loadOrders();
    };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch =
    (text: string) => {
      setSearch(text);

      const searchText =
        text
          .trim()
          .toLowerCase();

      if (!searchText) {
        setFilteredOrders(
          orders
        );

        return;
      }

      const filtered =
        orders.filter(
          (order) => {
            return (
              String(
                order.id
              ).includes(
                searchText
              ) ||

              order.customer_name
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              order.customer_phone
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              order.city
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||

              order.delivery_status
                ?.toLowerCase()
                .includes(
                  searchText
                )
            );
          }
        );

      setFilteredOrders(
        filtered
      );
    };

  // =====================================================
  // ACCEPT ORDER
  // =====================================================

  const acceptOrder =
    async (
      order: Order
    ) => {
      try {
        setAccepting(true);

        const loggedInUser =
          await AsyncStorage.getItem(
            "loggedInUser"
          );

        const authToken =
          await AsyncStorage.getItem(
            "authToken"
          );

        if (!loggedInUser) {
          Alert.alert(
            "Login Required",
            "Delivery partner details not found."
          );

          return;
        }

        const deliveryPartner =
          JSON.parse(
            loggedInUser
          );

        if (!deliveryPartner?.id) {
          Alert.alert(
            "Error",
            "Delivery partner ID not found."
          );

          return;
        }

        // =================================================
        // FIRST ACCEPT WINS
        // =================================================

        const response =
          await fetch(
            `${API_BASE_URL}/api/delivery/update-status`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                ...(authToken
                  ? {
                      Authorization:
                        `Bearer ${authToken}`,
                    }
                  : {}),

                "x-user-id":
                  String(
                    deliveryPartner.id
                  ),
              },

              body:
                JSON.stringify({
                  order_id:
                    order.id,

                  delivery_partner_id:
                    deliveryPartner.id,

                  delivery_status:
                    "Accepted",
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          "ACCEPT ORDER RESPONSE:",
          data
        );

        // =================================================
        // ORDER ALREADY ACCEPTED
        // =================================================

        if (
          response.status ===
          409
        ) {
          Alert.alert(
            "Order Already Taken",
            "This order has already been accepted by another delivery partner."
          );

          setModalVisible(
            false
          );

          await loadOrders();

          return;
        }

        // =================================================
        // OTHER ERROR
        // =================================================

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to accept order."
          );
        }

        // =================================================
        // SUCCESS
        // =================================================

        Alert.alert(
          "Success",
          "Order accepted successfully."
        );

        setModalVisible(
          false
        );

        await loadOrders();
      } catch (
        error: any
      ) {
        console.error(
          "ACCEPT ORDER ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Unable to accept order."
        );
      } finally {
        setAccepting(
          false
        );
      }
    };

  // =====================================================
  // STATUS
  // =====================================================

  const normalizeStatus =
    (
      status?: string
    ) => {
      if (!status) {
        return "Unknown";
      }

      return status
        .split(" ")
        .map(
          (word) =>
            word
              .charAt(0)
              .toUpperCase() +
            word
              .slice(1)
              .toLowerCase()
        )
        .join(" ");
    };

  // =====================================================
  // NEW ORDER CHECK
  // =====================================================

  const isNewOrder =
    (
      status?: string
    ) => {
      return (
        status ===
          "Not Assigned" ||
        status ===
          "Assigned"
      );
    };

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const newOrderCount =
    orders.filter(
      (order) =>
        isNewOrder(
          order.delivery_status
        )
    ).length;

  const acceptedCount =
    orders.filter(
      (order) =>
        order.delivery_status ===
          "Accepted" ||
        order.delivery_status ===
          "Picked Up" ||
        order.delivery_status ===
          "Out for Delivery"
    ).length;

  // =====================================================
  // ORDER CARD
  // =====================================================

  const renderOrder =
    ({
      item,
    }: {
      item: Order;
    }) => {
      const newOrder =
        isNewOrder(
          item.delivery_status
        );

      return (
        <TouchableOpacity
          style={
            styles.orderCard
          }
          activeOpacity={
            0.85
          }
          onPress={() => {
            setSelectedOrder(
              item
            );

            setModalVisible(
              true
            );
          }}
        >
          {/* TOP ROW */}

          <View
            style={
              styles.cardTopRow
            }
          >
            <View>
              <Text
                style={
                  styles.orderId
                }
              >
                Order #
                {item.id}
              </Text>

              <Text
                style={
                  styles.dateText
                }
              >
                {new Date(
                  item.created_at
                ).toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                newOrder
                  ? styles.newBadge
                  : styles.activeBadge,
              ]}
            >
              <Text
                style={
                  styles.statusText
                }
              >
                {newOrder
                  ? "New Order"
                  : normalizeStatus(
                      item.delivery_status
                    )}
              </Text>
            </View>
          </View>

          {/* CUSTOMER */}

          <View
            style={
              styles.infoRow
            }
          >
            <Ionicons
              name="person-outline"
              size={20}
              color="#555"
            />

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Customer
              </Text>

              <Text
                style={
                  styles.infoValue
                }
              >
                {item.customer_name ||
                  "Customer"}
              </Text>
            </View>
          </View>

          {/* PHONE */}

          {item.customer_phone ? (
            <View
              style={
                styles.infoRow
              }
            >
              <Ionicons
                name="call-outline"
                size={20}
                color="#555"
              />

              <View
                style={
                  styles.infoContent
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Phone
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {
                    item.customer_phone
                  }
                </Text>
              </View>
            </View>
          ) : null}

          {/* ADDRESS */}

          <View
            style={
              styles.infoRow
            }
          >
            <Ionicons
              name="location-outline"
              size={20}
              color="#555"
            />

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Delivery Address
              </Text>

              <Text
                style={
                  styles.infoValue
                }
              >
                {item.address_line ||
                  "Address not available"}
              </Text>

              <Text
                style={
                  styles.cityText
                }
              >
                {item.city ||
                  ""}

                {item.state
                  ? `, ${item.state}`
                  : ""}

                {item.pincode
                  ? ` - ${item.pincode}`
                  : ""}
              </Text>
            </View>
          </View>

          {/* PAYMENT */}

          <View
            style={
              styles.paymentRow
            }
          >
            <View>
              <Text
                style={
                  styles.paymentLabel
                }
              >
                Payment
              </Text>

              <Text
                style={
                  styles.paymentValue
                }
              >
                {item.payment_method ||
                  "N/A"}
              </Text>
            </View>

            <View
              style={
                styles.amountContainer
              }
            >
              <Text
                style={
                  styles.amountLabel
                }
              >
                Total
              </Text>

              <Text
                style={
                  styles.amount
                }
              >
                ₹
                {Number(
                  item.total_amount ||
                    0
                ).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* ACCEPT BUTTON */}

          {newOrder && (
            <TouchableOpacity
              style={
                styles.acceptButton
              }
              onPress={(
                event
              ) => {
                event.stopPropagation();

                setSelectedOrder(
                  item
                );

                setModalVisible(
                  true
                );
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#fff"
              />

              <Text
                style={
                  styles.acceptButtonText
                }
              >
                Accept Order
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    };

  // =====================================================
  // MODAL
  // =====================================================

  const renderModal =
    () => {
      if (!selectedOrder) {
        return null;
      }

      const newOrder =
        isNewOrder(
          selectedOrder.delivery_status
        );

      return (
        <Modal
          visible={
            modalVisible
          }
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!accepting) {
              setModalVisible(
                false
              );
            }
          }}
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.modalContainer
              }
            >
              {/* HEADER */}

              <View
                style={
                  styles.modalHeader
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Order #
                  {
                    selectedOrder.id
                  }
                </Text>

                <TouchableOpacity
                  disabled={
                    accepting
                  }
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                >
                  <Ionicons
                    name="close"
                    size={28}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              {/* STATUS */}

              <View
                style={
                  styles.modalStatusContainer
                }
              >
                <Text
                  style={
                    styles.modalLabel
                  }
                >
                  Delivery Status
                </Text>

                <Text
                  style={[
                    styles.modalStatus,
                    newOrder
                      ? styles.modalNewStatus
                      : styles.modalActiveStatus,
                  ]}
                >
                  {newOrder
                    ? "New Order"
                    : normalizeStatus(
                        selectedOrder.delivery_status
                      )}
                </Text>
              </View>

              {/* CUSTOMER */}

              <View
                style={
                  styles.modalSection
                }
              >
                <Text
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Customer Details
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  Name:{" "}
                  {selectedOrder.customer_name ||
                    "N/A"}
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  Phone:{" "}
                  {selectedOrder.customer_phone ||
                    "N/A"}
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  Email:{" "}
                  {selectedOrder.customer_email ||
                    "N/A"}
                </Text>
              </View>

              {/* ADDRESS */}

              <View
                style={
                  styles.modalSection
                }
              >
                <Text
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Delivery Address
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  {selectedOrder.address_line ||
                    "N/A"}
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  {selectedOrder.city ||
                    ""}

                  {selectedOrder.state
                    ? `, ${selectedOrder.state}`
                    : ""}

                  {selectedOrder.pincode
                    ? ` - ${selectedOrder.pincode}`
                    : ""}
                </Text>
              </View>

              {/* PAYMENT */}

              <View
                style={
                  styles.modalSection
                }
              >
                <Text
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Payment Details
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  Method:{" "}
                  {selectedOrder.payment_method ||
                    "N/A"}
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  Status:{" "}
                  {selectedOrder.payment_status ||
                    "N/A"}
                </Text>

                <Text
                  style={
                    styles.modalAmount
                  }
                >
                  ₹
                  {Number(
                    selectedOrder.total_amount ||
                      0
                  ).toFixed(2)}
                </Text>
              </View>

              {/* ACCEPT */}

              {newOrder && (
                <TouchableOpacity
                  style={[
                    styles.modalAcceptButton,
                    accepting &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    accepting
                  }
                  onPress={() =>
                    acceptOrder(
                      selectedOrder
                    )
                  }
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.modalAcceptButtonText
                    }
                  >
                    {accepting
                      ? "Accepting..."
                      : "Accept Order"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* CLOSE */}

              {!newOrder && (
                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  disabled={
                    accepting
                  }
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.closeButtonText
                    }
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      );
    };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <View
      style={
        styles.container
      }
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerLeft
          }
        >
          {/* BACK BUTTON */}

          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#111827"
            />
          </TouchableOpacity>

          {/* TITLE */}

          <View
            style={
              styles.headerTitleContainer
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Assigned Orders
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Manage your delivery orders
            </Text>
          </View>
        </View>

        {/* REFRESH */}

        <TouchableOpacity
          style={
            styles.refreshButton
          }
          onPress={
            onRefresh
          }
          disabled={
            refreshing
          }
        >
          <Ionicons
            name="refresh"
            size={23}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <View
        style={
          styles.summaryContainer
        }
      >
        <View
          style={
            styles.summaryCard
          }
        >
          <Ionicons
            name="notifications-outline"
            size={25}
            color="#2563eb"
          />

          <Text
            style={
              styles.summaryNumber
            }
          >
            {
              newOrderCount
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            New Orders
          </Text>
        </View>

        <View
          style={
            styles.summaryCard
          }
        >
          <Ionicons
            name="bicycle-outline"
            size={25}
            color="#16a34a"
          />

          <Text
            style={
              styles.summaryNumber
            }
          >
            {
              acceptedCount
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Active
          </Text>
        </View>

        <View
          style={
            styles.summaryCard
          }
        >
          <Ionicons
            name="cube-outline"
            size={25}
            color="#9333ea"
          />

          <Text
            style={
              styles.summaryNumber
            }
          >
            {
              orders.length
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Total
          </Text>
        </View>
      </View>

      {/* =================================================
          SEARCH
      ================================================= */}

      <View
        style={
          styles.searchContainer
        }
      >
        <Ionicons
          name="search-outline"
          size={21}
          color="#777"
        />

        <TextInput
          style={
            styles.searchInput
          }
          placeholder="Search order, customer or city..."
          placeholderTextColor="#999"
          value={
            search
          }
          onChangeText={
            handleSearch
          }
        />

        {search.length >
          0 && (
          <TouchableOpacity
            onPress={() => {
              setSearch(
                ""
              );

              setFilteredOrders(
                orders
              );
            }}
          >
            <Ionicons
              name="close-circle"
              size={21}
              color="#888"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =================================================
          ORDERS
      ================================================= */}

      {loading ? (
        <View
          style={
            styles.centerContainer
          }
        >
          <Text
            style={
              styles.loadingText
            }
          >
            Loading orders...
          </Text>
        </View>
      ) : filteredOrders.length ===
        0 ? (
        <View
          style={
            styles.centerContainer
          }
        >
          <Ionicons
            name="cube-outline"
            size={55}
            color="#aaa"
          />

          <Text
            style={
              styles.emptyTitle
            }
          >
            No Orders Found
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            New delivery orders for your city
            will appear here.
          </Text>

          <TouchableOpacity
            style={
              styles.emptyRefreshButton
            }
            onPress={
              onRefresh
            }
          >
            <Text
              style={
                styles.emptyRefreshText
              }
            >
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={
            filteredOrders
          }
          keyExtractor={(
            item
          ) =>
            String(
              item.id
            )
          }
          renderItem={
            renderOrder
          }
          contentContainerStyle={
            styles.listContent
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
                onRefresh
              }
            />
          }
        />
      )}

      {renderModal()}
    </View>
  );
};

export default AssignedOrders;

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f5f7fb",
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 15,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
    },

    headerLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
    },

    headerTitleContainer: {
      flex: 1,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#f3f4f6",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 10,
    },

    title: {
      fontSize: 24,
      fontWeight:
        "700",
      color: "#111827",
    },

    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: "#6b7280",
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#f3f4f6",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginLeft: 10,
    },

    // =================================================
    // SUMMARY
    // =================================================

    summaryContainer: {
      flexDirection:
        "row",
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },

    summaryCard: {
      flex: 1,
      backgroundColor:
        "#fff",
      borderRadius: 12,
      paddingVertical: 13,
      alignItems:
        "center",
      elevation: 2,
      shadowColor:
        "#000",
      shadowOpacity:
        0.06,
      shadowRadius: 5,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    summaryNumber: {
      marginTop: 5,
      fontSize: 20,
      fontWeight:
        "700",
      color: "#111827",
    },

    summaryLabel: {
      marginTop: 2,
      fontSize: 11,
      color: "#6b7280",
    },

    // =================================================
    // SEARCH
    // =================================================

    searchContainer: {
      marginHorizontal: 15,
      marginBottom: 10,
      height: 48,
      paddingHorizontal: 14,
      backgroundColor:
        "#fff",
      borderRadius: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      elevation: 1,
    },

    searchInput: {
      flex: 1,
      marginLeft: 9,
      fontSize: 14,
      color: "#111827",
    },

    // =================================================
    // LIST
    // =================================================

    listContent: {
      paddingHorizontal: 15,
      paddingBottom: 30,
    },

    // =================================================
    // ORDER CARD
    // =================================================

    orderCard: {
      backgroundColor:
        "#fff",
      borderRadius: 15,
      padding: 16,
      marginBottom: 13,
      elevation: 2,
      shadowColor:
        "#000",
      shadowOpacity:
        0.06,
      shadowRadius: 5,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    cardTopRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 15,
    },

    orderId: {
      fontSize: 17,
      fontWeight:
        "700",
      color: "#111827",
    },

    dateText: {
      marginTop: 4,
      fontSize: 11,
      color: "#9ca3af",
    },

    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },

    newBadge: {
      backgroundColor:
        "#dbeafe",
    },

    activeBadge: {
      backgroundColor:
        "#dcfce7",
    },

    statusText: {
      fontSize: 11,
      fontWeight:
        "700",
      color: "#1f2937",
    },

    // =================================================
    // INFORMATION
    // =================================================

    infoRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      marginBottom: 13,
    },

    infoContent: {
      flex: 1,
      marginLeft: 11,
    },

    infoLabel: {
      fontSize: 11,
      color: "#9ca3af",
      marginBottom: 2,
    },

    infoValue: {
      fontSize: 14,
      fontWeight:
        "600",
      color: "#374151",
    },

    cityText: {
      marginTop: 2,
      fontSize: 12,
      color: "#6b7280",
    },

    // =================================================
    // PAYMENT
    // =================================================

    paymentRow: {
      borderTopWidth: 1,
      borderTopColor:
        "#f0f0f0",
      marginTop: 3,
      paddingTop: 13,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    paymentLabel: {
      fontSize: 11,
      color: "#9ca3af",
    },

    paymentValue: {
      marginTop: 3,
      fontSize: 13,
      fontWeight:
        "600",
      color: "#374151",
    },

    amountContainer: {
      alignItems:
        "flex-end",
    },

    amountLabel: {
      fontSize: 11,
      color: "#9ca3af",
    },

    amount: {
      marginTop: 2,
      fontSize: 18,
      fontWeight:
        "700",
      color: "#111827",
    },

    // =================================================
    // ACCEPT
    // =================================================

    acceptButton: {
      marginTop: 14,
      height: 45,
      borderRadius: 10,
      backgroundColor:
        "#2563eb",
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 7,
    },

    acceptButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight:
        "700",
    },

    // =================================================
    // EMPTY / LOADING
    // =================================================

    centerContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal: 30,
    },

    loadingText: {
      marginTop: 10,
      color: "#6b7280",
      fontSize: 14,
    },

    emptyTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight:
        "700",
      color: "#374151",
    },

    emptyText: {
      marginTop: 5,
      textAlign:
        "center",
      fontSize: 13,
      color: "#9ca3af",
      lineHeight: 20,
    },

    emptyRefreshButton: {
      marginTop: 18,
      paddingHorizontal: 25,
      paddingVertical: 11,
      borderRadius: 9,
      backgroundColor:
        "#2563eb",
    },

    emptyRefreshText: {
      color: "#fff",
      fontSize: 13,
      fontWeight:
        "700",
    },

    // =================================================
    // MODAL
    // =================================================

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.45)",
      justifyContent:
        "flex-end",
    },

    modalContainer: {
      backgroundColor:
        "#fff",
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      maxHeight: "88%",
    },

    modalHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 18,
    },

    modalTitle: {
      fontSize: 21,
      fontWeight:
        "700",
      color: "#111827",
    },

    modalStatusContainer: {
      backgroundColor:
        "#f8fafc",
      borderRadius: 10,
      padding: 13,
      marginBottom: 15,
    },

    modalLabel: {
      fontSize: 11,
      color: "#9ca3af",
    },

    modalStatus: {
      marginTop: 4,
      fontSize: 15,
      fontWeight:
        "700",
    },

    modalNewStatus: {
      color: "#2563eb",
    },

    modalActiveStatus: {
      color: "#16a34a",
    },

    modalSection: {
      marginBottom: 16,
    },

    modalSectionTitle: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#111827",
      marginBottom: 7,
    },

    modalText: {
      fontSize: 13,
      color: "#4b5563",
      lineHeight: 20,
    },

    modalAmount: {
      marginTop: 7,
      fontSize: 21,
      fontWeight:
        "700",
      color: "#111827",
    },

    modalAcceptButton: {
      height: 48,
      borderRadius: 11,
      backgroundColor:
        "#2563eb",
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 7,
      marginTop: 4,
    },

    modalAcceptButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight:
        "700",
    },

    disabledButton: {
      opacity: 0.6,
    },

    closeButton: {
      height: 46,
      borderRadius: 10,
      backgroundColor:
        "#f3f4f6",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 5,
    },

    closeButtonText: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#374151",
    },
  });