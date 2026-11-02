import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LiveTour from "../../components/LiveTour";
import { API_BASE_URL } from "../../config/api";
import useExitOnBack from "../../hooks/useExitOnBack";



type Product = {
  id: number;
  name?: string;
  product_name?: string;
  stock?: number | string;
  quantity?: number | string;
};

type Order = {
  id: number;

  customer_name?: string;
  customer_email?: string;

  total_amount?: number | string;
  total_quantity?: number | string;

  product_names?: string;

  order_status?: string;
  status?: string;

  payment_status?: string;
  payment_method?: string;

  created_at?: string;
};

export default function MerchantDashboard() {
  const router = useRouter();

useExitOnBack();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // LIVE TOUR
  // =====================================================

  const [showLiveTour, setShowLiveTour] =
    useState(true);

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchDashboardData =
    useCallback(async () => {
      try {
        setError("");

        // =================================================
        // GET AUTH TOKEN
        // =================================================

        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        console.log(
          "MERCHANT DASHBOARD - token exists:",
          token ? "YES" : "NO"
        );

        if (!token) {
          throw new Error(
            "Login session expired. Please login again."
          );
        }

        // =================================================
        // GET LOGGED-IN USER
        // =================================================

        const loggedInUser =
          await AsyncStorage.getItem(
            "loggedInUser"
          );

        console.log(
          "MERCHANT DASHBOARD - loggedInUser:",
          loggedInUser
        );

        if (!loggedInUser) {
          throw new Error(
            "Merchant login information not found. Please login again."
          );
        }

        let user;

        try {
          user = JSON.parse(
            loggedInUser
          );
        } catch {
          throw new Error(
            "Invalid login information. Please login again."
          );
        }

        // =================================================
        // GET ACTUAL MERCHANT ID
        // =================================================

        const currentMerchantId =
          Number(user?.id);

        console.log(
          "MERCHANT DASHBOARD - merchant ID:",
          currentMerchantId
        );

        if (!currentMerchantId) {
          throw new Error(
            "Invalid merchant ID. Please login again."
          );
        }

        // =================================================
        // VERIFY ROLE
        // =================================================

        if (
          user?.role &&
          user.role !== "merchant"
        ) {
          throw new Error(
            "This account is not registered as a merchant."
          );
        }

        // =================================================
        // GET PRODUCTS + ORDERS
        // =================================================

        const [
          productsResponse,
          ordersResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/products/merchant/${currentMerchantId}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "x-user-id":
                  String(currentMerchantId),

                "Content-Type":
                  "application/json",
              },
            }
          ),

          fetch(
            `${API_BASE_URL}/api/orders/merchant/${currentMerchantId}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "x-user-id":
                  String(currentMerchantId),

                "Content-Type":
                  "application/json",
              },
            }
          ),
        ]);

        // =================================================
        // READ RESPONSES
        // =================================================

        const productsData =
          await productsResponse.json();

        const ordersData =
          await ordersResponse.json();

        console.log(
          "Dashboard products:",
          productsData
        );

        console.log(
          "Dashboard orders:",
          ordersData
        );

        // =================================================
        // CHECK PRODUCTS
        // =================================================

        if (
          !productsResponse.ok ||
          !productsData.success
        ) {
          throw new Error(
            productsData.message ||
              "Failed to load products."
          );
        }

        // =================================================
        // CHECK ORDERS
        // =================================================

        if (
          !ordersResponse.ok ||
          !ordersData.success
        ) {
          throw new Error(
            ordersData.message ||
              "Failed to load orders."
          );
        }

        // =================================================
        // SAVE DATA
        // =================================================

        setProducts(
          productsData.products ||
            productsData.data ||
            []
        );

        setOrders(
          ordersData.orders ||
            ordersData.data ||
            []
        );
      } catch (error: any) {
        console.error(
          "Merchant dashboard error:",
          error
        );

        setError(
          error?.message ||
            "Unable to load dashboard."
        );
      }
    }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadDashboard =
      async () => {
        setLoading(true);

        await fetchDashboardData();

        setLoading(false);
      };

    loadDashboard();
  }, [fetchDashboardData]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh =
    async () => {
      setRefreshing(true);

      await fetchDashboardData();

      setRefreshing(false);
    };

  // =====================================================
  // ORDER STATUS
  // =====================================================

  const getOrderStatus = (
    order: Order
  ) => {
    return (
      order.order_status ||
      order.status ||
      "Placed"
    );
  };

  // =====================================================
  // PENDING ORDERS
  // =====================================================

  const pendingOrders =
    orders.filter((order) => {
      const status =
        getOrderStatus(order)
          .toLowerCase();

      return (
        status === "placed" ||
        status === "pending" ||
        status === "confirmed"
      );
    });

  // =====================================================
  // TOTAL REVENUE
  // =====================================================

  const totalRevenue =
    orders.reduce(
      (total, order) => {
        const amount =
          Number(
            order.total_amount || 0
          );

        const paymentStatus =
          (
            order.payment_status ||
            ""
          ).toLowerCase();

        if (
          paymentStatus === "paid" ||
          paymentStatus === "completed" ||
          order.payment_method ===
            "Cash on Delivery"
        ) {
          return total + amount;
        }

        return total;
      },
      0
    );

  // =====================================================
  // RECENT ORDERS
  // =====================================================

  const recentOrders =
    [...orders]
      .sort((a, b) => {
        const dateA =
          new Date(
            a.created_at || 0
          ).getTime();

        const dateB =
          new Date(
            b.created_at || 0
          ).getTime();

        return dateB - dateA;
      })
      .slice(0, 3);

  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  const formatAmount = (
    amount?: number | string
  ) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  // =====================================================
  // STATUS COLORS
  // =====================================================

  const getStatusColors = (
    status?: string
  ) => {
    const value =
      (status || "placed")
        .toLowerCase();

    if (
      value === "delivered"
    ) {
      return {
        background: "#dcfce7",
        text: "#15803d",
      };
    }

    if (
      value === "shipped" ||
      value === "confirmed"
    ) {
      return {
        background: "#dbeafe",
        text: "#1d4ed8",
      };
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return {
        background: "#fee2e2",
        text: "#dc2626",
      };
    }

    return {
      background: "#fef3c7",
      text: "#b45309",
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#f7f7fb"
        />

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
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f7f7fb"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7c3aed"
          />
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
        >
          <View>
            <Text
              style={
                styles.eyebrow
              }
            >
              MERCHANT
            </Text>

            <Text
              style={styles.title}
            >
              Dashboard
            </Text>

            <Text
              style={styles.subtitle}
            >
              Manage your ShopEase store
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.storeIcon
            }
            onPress={
              handleRefresh
            }
          >
            <Text
              style={
                styles.storeIconText
              }
            >
              🏪
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            STORE CARD
        ================================================= */}

        <View
          style={
            styles.storeCard
          }
        >
          <View
            style={
              styles.storeCardLeft
            }
          >
            <View
              style={
                styles.storeAvatar
              }
            >
              <Text
                style={
                  styles.storeAvatarText
                }
              >
                S
              </Text>
            </View>

            <View>
              <Text
                style={
                  styles.storeLabel
                }
              >
                MY STORE
              </Text>

              <Text
                style={
                  styles.storeName
                }
              >
                ShopEase Store
              </Text>

              <Text
                style={
                  styles.storeStatus
                }
              >
                ● Store Active
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.storeArrow
            }
            onPress={() =>
              router.push(
                "/merchant/profile"
              )
            }
          >
            <Text
              style={
                styles.arrowText
              }
            >
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            ERROR
        ================================================= */}

        {error !== "" && (
          <View
            style={
              styles.errorCard
            }
          >
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
                fetchDashboardData
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Overview
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Your store performance
            </Text>
          </View>
        </View>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <View
          style={
            styles.statsGrid
          }
        >

          {/* PRODUCTS */}

          <TouchableOpacity
            style={
              styles.statCard
            }
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/merchant/products"
              )
            }
          >
            <View
              style={[
                styles.statIcon,
                styles.productIcon,
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                📦
              </Text>
            </View>

            <Text
              style={
                styles.statValue
              }
            >
              {products.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Products
            </Text>
          </TouchableOpacity>

          {/* ORDERS */}

          <TouchableOpacity
            style={
              styles.statCard
            }
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/merchant/orders"
              )
            }
          >
            <View
              style={[
                styles.statIcon,
                styles.orderIcon,
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                🛒
              </Text>
            </View>

            <Text
              style={
                styles.statValue
              }
            >
              {orders.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Orders
            </Text>
          </TouchableOpacity>

          {/* PENDING */}

          <TouchableOpacity
            style={
              styles.statCard
            }
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/merchant/orders"
              )
            }
          >
            <View
              style={[
                styles.statIcon,
                styles.pendingIcon,
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                ⏳
              </Text>
            </View>

            <Text
              style={
                styles.statValue
              }
            >
              {pendingOrders.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Pending
            </Text>
          </TouchableOpacity>

          {/* REVENUE */}

          <TouchableOpacity
            style={
              styles.statCard
            }
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/merchant/sales"
              )
            }
          >
            <View
              style={[
                styles.statIcon,
                styles.revenueIcon,
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                ₹
              </Text>
            </View>

            <Text
              style={
                styles.statValue
              }
              numberOfLines={1}
            >
              {formatAmount(
                totalRevenue
              )}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Revenue
            </Text>
          </TouchableOpacity>

        </View>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Quick Actions
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Manage your store
            </Text>
          </View>
        </View>

        {/* MY PRODUCTS */}

        <TouchableOpacity
          style={
            styles.menuCard
          }
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              "/merchant/products"
            )
          }
        >
          <View
            style={[
              styles.menuIcon,
              styles.menuPurple,
            ]}
          >
            <Text
              style={
                styles.menuIconText
              }
            >
              📦
            </Text>
          </View>

          <View
            style={
              styles.menuContent
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              My Products
            </Text>

            <Text
              style={
                styles.menuDescription
              }
            >
              Add, edit and manage your
              products
            </Text>
          </View>

          <Text
            style={
              styles.menuArrow
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* ORDERS */}

        <TouchableOpacity
          style={
            styles.menuCard
          }
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              "/merchant/orders"
            )
          }
        >
          <View
            style={[
              styles.menuIcon,
              styles.menuBlue,
            ]}
          >
            <Text
              style={
                styles.menuIconText
              }
            >
              🛒
            </Text>
          </View>

          <View
            style={
              styles.menuContent
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              Orders
            </Text>

            <Text
              style={
                styles.menuDescription
              }
            >
              View and manage customer
              orders
            </Text>
          </View>

          <Text
            style={
              styles.menuArrow
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* INVENTORY */}

        <TouchableOpacity
          style={
            styles.menuCard
          }
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              "/merchant/inventory"
            )
          }
        >
          <View
            style={[
              styles.menuIcon,
              styles.menuGreen,
            ]}
          >
            <Text
              style={
                styles.menuIconText
              }
            >
              📊
            </Text>
          </View>

          <View
            style={
              styles.menuContent
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              Inventory
            </Text>

            <Text
              style={
                styles.menuDescription
              }
            >
              Manage your product stock
            </Text>
          </View>

          <Text
            style={
              styles.menuArrow
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* SALES */}

        <TouchableOpacity
          style={
            styles.menuCard
          }
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              "/merchant/sales"
            )
          }
        >
          <View
            style={[
              styles.menuIcon,
              styles.menuGreen,
            ]}
          >
            <Text
              style={
                styles.menuIconText
              }
            >
              💰
            </Text>
          </View>

          <View
            style={
              styles.menuContent
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              Sales
            </Text>

            <Text
              style={
                styles.menuDescription
              }
            >
              View your sales and revenue
            </Text>
          </View>

          <Text
            style={
              styles.menuArrow
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* PROFILE */}

        <TouchableOpacity
          style={
            styles.menuCard
          }
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              "/merchant/profile"
            )
          }
        >
          <View
            style={[
              styles.menuIcon,
              styles.menuOrange,
            ]}
          >
            <Text
              style={
                styles.menuIconText
              }
            >
              👤
            </Text>
          </View>

          <View
            style={
              styles.menuContent
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              Store Profile
            </Text>

            <Text
              style={
                styles.menuDescription
              }
            >
              Manage your store information
            </Text>
          </View>

          <Text
            style={
              styles.menuArrow
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* =================================================
            RECENT ORDERS HEADER
        ================================================= */}

        <View
          style={[
            styles.sectionHeader,
            styles.recentHeader,
          ]}
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Recent Orders
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Latest customer orders
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push(
                "/merchant/orders"
              )
            }
          >
            <Text
              style={
                styles.viewAll
              }
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        {recentOrders.length > 0 ? (

          recentOrders.map(
            (order) => {
              const orderStatus =
                getOrderStatus(
                  order
                );

              const statusColors =
                getStatusColors(
                  orderStatus
                );

              return (
                <TouchableOpacity
                  key={order.id}
                  style={
                    styles.recentOrderCard
                  }
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(
                      "/merchant/orders"
                    )
                  }
                >

                  <View
                    style={
                      styles.recentOrderTop
                    }
                  >

                    <View
                      style={
                        styles.recentOrderInfo
                      }
                    >

                      <View
                        style={
                          styles.orderNumberBox
                        }
                      >
                        <Text
                          style={
                            styles.orderNumberText
                          }
                        >
                          #{order.id}
                        </Text>
                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.recentCustomerName
                          }
                          numberOfLines={1}
                        >
                          {order.customer_name ||
                            "Customer"}
                        </Text>

                        <Text
                          style={
                            styles.recentProductName
                          }
                          numberOfLines={1}
                        >
                          {order.product_names ||
                            "Product"}
                        </Text>
                      </View>

                    </View>

                    <Text
                      style={
                        styles.recentAmount
                      }
                    >
                      {formatAmount(
                        order.total_amount
                      )}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.recentOrderBottom
                    }
                  >
                    <Text
                      style={
                        styles.recentDate
                      }
                    >
                      {formatDate(
                        order.created_at
                      )}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            statusColors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              statusColors.text,
                          },
                        ]}
                      >
                        {orderStatus}
                      </Text>
                    </View>
                  </View>

                </TouchableOpacity>
              );
            }
          )

        ) : (

          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Text
                style={
                  styles.emptyIconText
                }
              >
                📦
              </Text>
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No orders yet
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Customer orders will appear here
              when someone purchases your
              products.
            </Text>
          </View>

        )}

        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>

      {/* =================================================
          MERCHANT LIVE TOUR
      ================================================= */}

      {showLiveTour && (
        <LiveTour
          role="merchant"
          onFinish={() =>
            setShowLiveTour(false)
          }
        />
      )}

    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    safeArea: {
      flex: 1,
      backgroundColor: "#f7f7fb",
    },

    container: {
      flex: 1,
      backgroundColor: "#f7f7fb",
    },

    contentContainer: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 30,
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },

    eyebrow: {
      color: "#7c3aed",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 4,
    },

    title: {
      fontSize: 30,
      fontWeight: "800",
      color: "#18181b",
    },

    subtitle: {
      marginTop: 4,
      color: "#71717a",
      fontSize: 13,
    },

    storeIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",

      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 3,
    },

    storeIconText: {
      fontSize: 25,
    },

    // =================================================
    // STORE CARD
    // =================================================

    storeCard: {
      backgroundColor: "#ffffff",
      borderRadius: 18,
      padding: 17,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 25,

      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,
    },

    storeCardLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    storeAvatar: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: "#ede9fe",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 13,
    },

    storeAvatarText: {
      color: "#7c3aed",
      fontSize: 21,
      fontWeight: "800",
    },

    storeLabel: {
      color: "#a1a1aa",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
    },

    storeName: {
      color: "#18181b",
      fontSize: 16,
      fontWeight: "800",
      marginTop: 2,
    },

    storeStatus: {
      color: "#16a34a",
      fontSize: 11,
      fontWeight: "600",
      marginTop: 4,
    },

    storeArrow: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#f4f4f5",
      alignItems: "center",
      justifyContent: "center",
    },

    arrowText: {
      fontSize: 20,
      color: "#52525b",
    },

    // =================================================
    // ERROR
    // =================================================

    errorCard: {
      backgroundColor: "#fff1f2",
      borderRadius: 15,
      padding: 14,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    errorText: {
      flex: 1,
      color: "#be123c",
      fontSize: 12,
      marginRight: 10,
    },

    retryButton: {
      backgroundColor: "#ffffff",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },

    retryText: {
      color: "#be123c",
      fontSize: 11,
      fontWeight: "800",
    },

    // =================================================
    // SECTION
    // =================================================

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 13,
      marginTop: 3,
    },

    recentHeader: {
      marginTop: 16,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#18181b",
    },

    sectionSubtitle: {
      color: "#71717a",
      fontSize: 12,
      marginTop: 3,
    },

    viewAll: {
      color: "#7c3aed",
      fontSize: 12,
      fontWeight: "800",
    },

    // =================================================
    // STATS
    // =================================================

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 25,
    },

    statCard: {
      width: "48%",
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 15,
      marginBottom: 12,

      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
    },

    statIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    productIcon: {
      backgroundColor: "#ede9fe",
    },

    orderIcon: {
      backgroundColor: "#dbeafe",
    },

    pendingIcon: {
      backgroundColor: "#fef3c7",
    },

    revenueIcon: {
      backgroundColor: "#dcfce7",
    },

    statIconText: {
      fontSize: 18,
    },

    statValue: {
      fontSize: 22,
      fontWeight: "800",
      color: "#18181b",
    },

    statLabel: {
      marginTop: 3,
      color: "#71717a",
      fontSize: 12,
      fontWeight: "600",
    },

    // =================================================
    // MENU CARDS
    // =================================================

    menuCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 14,
      marginBottom: 11,

      flexDirection: "row",
      alignItems: "center",

      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
    },

    menuIcon: {
      width: 47,
      height: 47,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 13,
    },

    menuPurple: {
      backgroundColor: "#ede9fe",
    },

    menuBlue: {
      backgroundColor: "#dbeafe",
    },

    menuGreen: {
      backgroundColor: "#dcfce7",
    },

    menuOrange: {
      backgroundColor: "#ffedd5",
    },

    menuIconText: {
      fontSize: 21,
    },

    menuContent: {
      flex: 1,
    },

    menuTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#18181b",
    },

    menuDescription: {
      fontSize: 11,
      color: "#71717a",
      marginTop: 3,
    },

    menuArrow: {
      fontSize: 21,
      color: "#a1a1aa",
      marginLeft: 8,
    },

    // =================================================
    // RECENT ORDERS
    // =================================================

    recentOrderCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 14,
      marginBottom: 11,

      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
    },

    recentOrderTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    recentOrderInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 10,
    },

    orderNumberBox: {
      width: 45,
      height: 45,
      borderRadius: 13,
      backgroundColor: "#ede9fe",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    orderNumberText: {
      color: "#7c3aed",
      fontSize: 12,
      fontWeight: "800",
    },

    recentCustomerName: {
      color: "#18181b",
      fontSize: 13,
      fontWeight: "800",
    },

    recentProductName: {
      color: "#71717a",
      fontSize: 10,
      marginTop: 3,
    },

    recentAmount: {
      color: "#18181b",
      fontSize: 14,
      fontWeight: "800",
    },

    recentOrderBottom: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#f4f4f5",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    recentDate: {
      color: "#a1a1aa",
      fontSize: 10,
    },

    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 7,
    },

    statusBadgeText: {
      fontSize: 9,
      fontWeight: "800",
    },

    // =================================================
    // EMPTY ORDERS
    // =================================================

    emptyCard: {
      backgroundColor: "#ffffff",
      borderRadius: 17,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: "center",

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: "#f4f4f5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },

    emptyIconText: {
      fontSize: 26,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#27272a",
    },

    emptyDescription: {
      color: "#71717a",
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 6,
    },

    // =================================================
    // LOADING
    // =================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      color: "#71717a",
      fontSize: 13,
      marginTop: 12,
    },

    bottomSpace: {
      height: 20,
    },
  });