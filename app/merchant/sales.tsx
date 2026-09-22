import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../config/api";

type Order = {
  id: number;

  customer_name?: string;
  customer_email?: string;

  total_amount?: number | string;
  total?: number | string;
  amount?: number | string;

  status?: string;
  order_status?: string;

  payment_status?: string;
  payment_method?: string;

  created_at?: string;
};

export default function MerchantSales() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // GET CURRENT LOGGED-IN MERCHANT ID
  // =====================================================

  const getCurrentMerchantId =
    async (): Promise<number> => {
      const storedUser =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      if (!storedUser) {
        throw new Error(
          "Merchant login information not found. Please login again."
        );
      }

      let user: any;

      try {
        user =
          JSON.parse(storedUser);
      } catch {
        throw new Error(
          "Invalid merchant login information. Please login again."
        );
      }

      const merchantId =
        Number(user?.id);

      if (
        !merchantId ||
        Number.isNaN(merchantId)
      ) {
        throw new Error(
          "Merchant ID not found. Please login again."
        );
      }

      if (
        user?.role &&
        user.role !== "merchant"
      ) {
        throw new Error(
          "This account is not a merchant account."
        );
      }

      console.log(
        "CURRENT MERCHANT ID:",
        merchantId
      );

      return merchantId;
    };

  // =====================================================
  // FETCH SALES
  // =====================================================

  const fetchSales =
    useCallback(async () => {
      try {
        setError("");

        // -------------------------------------------------
        // GET AUTH TOKEN
        // -------------------------------------------------

        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        console.log(
          "MERCHANT SALES - token exists:",
          token ? "YES" : "NO"
        );

        if (!token) {
          throw new Error(
            "Login session expired. Please login again."
          );
        }

        // -------------------------------------------------
        // GET CURRENT MERCHANT ID
        // -------------------------------------------------

        const merchantId =
          await getCurrentMerchantId();

        // -------------------------------------------------
        // FETCH MERCHANT ORDERS / SALES
        // -------------------------------------------------

        const response =
          await fetch(
            `${API_BASE_URL}/api/orders/merchant/${merchantId}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "x-user-id":
                  String(merchantId),

                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        console.log(
          "Merchant sales response:",
          data
        );

        // -------------------------------------------------
        // CHECK RESPONSE
        // -------------------------------------------------

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load sales."
          );
        }

        // -------------------------------------------------
        // SET SALES
        // -------------------------------------------------

        setOrders(
          data.orders ||
            data.data ||
            []
        );
      } catch (err: any) {
        console.error(
          "Merchant sales error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load sales."
        );
      }
    }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const load =
      async () => {
        setLoading(true);

        await fetchSales();

        setLoading(false);
      };

    load();
  }, [fetchSales]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh =
    async () => {
      setRefreshing(true);

      await fetchSales();

      setRefreshing(false);
    };

  // =====================================================
  // GET ORDER AMOUNT
  // =====================================================

  const getOrderAmount = (
    order: Order
  ) => {
    return Number(
      order.total_amount ??
        order.total ??
        order.amount ??
        0
    );
  };

  // =====================================================
  // SALES CALCULATIONS
  // =====================================================

  const salesStats =
    useMemo(() => {
      let totalRevenue = 0;

      let paidRevenue = 0;

      let pendingRevenue = 0;

      let completedOrders = 0;

      let pendingOrders = 0;

      let cancelledOrders = 0;

      let validRevenueOrders = 0;

      orders.forEach(
        (order) => {
          const amount =
            getOrderAmount(
              order
            );

          const status = (
            order.order_status ||
            order.status ||
            ""
          ).toLowerCase();

          const paymentStatus =
            (
              order.payment_status ||
              ""
            ).toLowerCase();

          // -------------------------------------------------
          // CANCELLED ORDERS
          // are not counted in revenue
          // -------------------------------------------------

          const isCancelled =
            status ===
              "cancelled" ||
            status ===
              "canceled";

          if (!isCancelled) {
            totalRevenue +=
              amount;

            validRevenueOrders++;
          }

          // -------------------------------------------------
          // PAYMENT
          // -------------------------------------------------

          if (
            paymentStatus ===
              "paid" ||
            paymentStatus ===
              "success" ||
            paymentStatus ===
              "completed"
          ) {
            paidRevenue +=
              amount;
          } else if (
            !isCancelled
          ) {
            pendingRevenue +=
              amount;
          }

          // -------------------------------------------------
          // ORDER STATUS
          // -------------------------------------------------

          if (
            status ===
            "delivered"
          ) {
            completedOrders++;
          } else if (
            isCancelled
          ) {
            cancelledOrders++;
          } else {
            pendingOrders++;
          }
        }
      );

      // -------------------------------------------------
      // AVERAGE ORDER
      // -------------------------------------------------

      const averageOrder =
        validRevenueOrders >
        0
          ? totalRevenue /
            validRevenueOrders
          : 0;

      return {
        totalRevenue,

        paidRevenue,

        pendingRevenue,

        completedOrders,

        pendingOrders,

        cancelledOrders,

        averageOrder:
          Number.isFinite(
            averageOrder
          )
            ? averageOrder
            : 0,
      };
    }, [orders]);

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (
    amount: number
  ) => {
    return `₹${amount.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "--";
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
        year: "numeric",
      }
    );
  };

  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  const getPaymentStatus = (
    status?: string
  ) => {
    const value = (
      status || ""
    ).toLowerCase();

    if (
      value === "paid" ||
      value === "success" ||
      value === "completed"
    ) {
      return {
        label: "Paid",
        background:
          "#dcfce7",
        color:
          "#15803d",
      };
    }

    return {
      label:
        status ||
        "Not Paid",

      background:
        "#fef3c7",

      color:
        "#b45309",
    };
  };

  // =====================================================
  // ORDER STATUS
  // =====================================================

  const getOrderStatus = (
    status?: string
  ) => {
    const value = (
      status ||
      "pending"
    ).toLowerCase();

    if (
      value ===
      "delivered"
    ) {
      return {
        background:
          "#dcfce7",
        color:
          "#15803d",
      };
    }

    if (
      value ===
        "shipped" ||
      value ===
        "confirmed"
    ) {
      return {
        background:
          "#dbeafe",
        color:
          "#1d4ed8",
      };
    }

    if (
      value ===
        "cancelled" ||
      value ===
        "canceled"
    ) {
      return {
        background:
          "#fee2e2",
        color:
          "#dc2626",
      };
    }

    return {
      background:
        "#fef3c7",
      color:
        "#b45309",
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
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
            Loading sales...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <ScrollView
        style={
          styles.container
        }
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
            tintColor="#7c3aed"
          />
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
                styles.backText
              }
            >
              ←
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              MERCHANT
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Sales
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Track your store performance
            </Text>
          </View>

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
                styles.refreshText
              }
            >
              ↻
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            MAIN REVENUE CARD
        ================================================= */}

        <View
          style={
            styles.revenueCard
          }
        >
          <View
            style={
              styles.revenueTop
            }
          >
            <View>
              <Text
                style={
                  styles.revenueLabel
                }
              >
                TOTAL SALES
              </Text>

              <Text
                style={
                  styles.revenueAmount
                }
              >
                {formatCurrency(
                  salesStats.totalRevenue
                )}
              </Text>
            </View>

            <View
              style={
                styles.revenueIcon
              }
            >
              <Text
                style={
                  styles.revenueIconText
                }
              >
                ₹
              </Text>
            </View>
          </View>

          <View
            style={
              styles.revenueDivider
            }
          />

          <View
            style={
              styles.revenueBottom
            }
          >
            <View>
              <Text
                style={
                  styles.smallLabel
                }
              >
                Paid Revenue
              </Text>

              <Text
                style={
                  styles.paidAmount
                }
              >
                {formatCurrency(
                  salesStats.paidRevenue
                )}
              </Text>
            </View>

            <View
              style={
                styles.revenueVertical
              }
            />

            <View>
              <Text
                style={
                  styles.smallLabel
                }
              >
                Pending
              </Text>

              <Text
                style={
                  styles.pendingAmount
                }
              >
                {formatCurrency(
                  salesStats.pendingRevenue
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            STATS ROW 1
        ================================================= */}

        <View
          style={
            styles.statsRow
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    "#ede9fe",
                },
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
                styles.statLabel
              }
            >
              Orders
            </Text>

            <Text
              style={
                styles.statValue
              }
            >
              {orders.length}
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    "#dcfce7",
                },
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                ✓
              </Text>
            </View>

            <Text
              style={
                styles.statLabel
              }
            >
              Delivered
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    "#15803d",
                },
              ]}
            >
              {
                salesStats.completedOrders
              }
            </Text>
          </View>
        </View>

        {/* =================================================
            STATS ROW 2
        ================================================= */}

        <View
          style={
            styles.statsRow
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    "#fef3c7",
                },
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
                styles.statLabel
              }
            >
              Pending
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    "#d97706",
                },
              ]}
            >
              {
                salesStats.pendingOrders
              }
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    "#fee2e2",
                },
              ]}
            >
              <Text
                style={
                  styles.statIconText
                }
              >
                ×
              </Text>
            </View>

            <Text
              style={
                styles.statLabel
              }
            >
              Cancelled
            </Text>

            <Text
              style={[
                styles.statValue,
                {
                  color:
                    "#dc2626",
                },
              ]}
            >
              {
                salesStats.cancelledOrders
              }
            </Text>
          </View>
        </View>

        {/* =================================================
            AVERAGE ORDER
        ================================================= */}

        <View
          style={
            styles.averageCard
          }
        >
          <View
            style={
              styles.averageIcon
            }
          >
            <Text>
              📊
            </Text>
          </View>

          <View
            style={
              styles.averageContent
            }
          >
            <Text
              style={
                styles.averageLabel
              }
            >
              Average Order Value
            </Text>

            <Text
              style={
                styles.averageValue
              }
            >
              {formatCurrency(
                salesStats.averageOrder
              )}
            </Text>
          </View>
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
                styles.errorIcon
              }
            >
              ⚠️
            </Text>

            <View
              style={
                styles.errorContent
              }
            >
              <Text
                style={
                  styles.errorTitle
                }
              >
                Unable to load sales
              </Text>

              <Text
                style={
                  styles.errorMessage
                }
              >
                {error}
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={
                fetchSales
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
            SALES HISTORY HEADER
        ================================================= */}

        {error === "" && (
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
                Sales History
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Recent orders and payments
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
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {error === "" &&
          orders.length === 0 && (
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
                  📈
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No Sales Yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Your sales and order
                information will appear
                here.
              </Text>
            </View>
          )}

        {/* =================================================
            SALES LIST
        ================================================= */}

        {error === "" &&
          orders.length > 0 && (
            <View>
              {orders.map(
                (order) => {
                  const amount =
                    getOrderAmount(
                      order
                    );

                  const payment =
                    getPaymentStatus(
                      order.payment_status
                    );

                  const actualStatus =
                    order.order_status ||
                    order.status ||
                    "Pending";

                  const status =
                    getOrderStatus(
                      actualStatus
                    );

                  return (
                    <TouchableOpacity
                      key={
                        order.id
                      }
                      style={
                        styles.saleCard
                      }
                      activeOpacity={
                        0.85
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            "/merchant/orders",
                        })
                      }
                    >

                      {/* SALE TOP */}

                      <View
                        style={
                          styles.saleTop
                        }
                      >
                        <View>
                          <Text
                            style={
                              styles.saleLabel
                            }
                          >
                            ORDER
                          </Text>

                          <Text
                            style={
                              styles.saleOrderNumber
                            }
                          >
                            #{order.id}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.saleDate
                          }
                        >
                          {formatDate(
                            order.created_at
                          )}
                        </Text>
                      </View>

                      {/* CUSTOMER */}

                      <View
                        style={
                          styles.customerRow
                        }
                      >
                        <View
                          style={
                            styles.customerIcon
                          }
                        >
                          <Text>
                            👤
                          </Text>
                        </View>

                        <View
                          style={
                            styles.customerInfo
                          }
                        >
                          <Text
                            style={
                              styles.customerName
                            }
                            numberOfLines={1}
                          >
                            {order.customer_name ||
                              "Customer"}
                          </Text>

                          {order.customer_email && (
                            <Text
                              style={
                                styles.customerEmail
                              }
                              numberOfLines={1}
                            >
                              {
                                order.customer_email
                              }
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* AMOUNT */}

                      <View
                        style={
                          styles.saleAmountRow
                        }
                      >
                        <Text
                          style={
                            styles.saleAmountLabel
                          }
                        >
                          Sale Amount
                        </Text>

                        <Text
                          style={
                            styles.saleAmount
                          }
                        >
                          {formatCurrency(
                            amount
                          )}
                        </Text>
                      </View>

                      {/* BADGES */}

                      <View
                        style={
                          styles.badgesRow
                        }
                      >
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor:
                                status.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color:
                                  status.color,
                              },
                            ]}
                          >
                            {
                              actualStatus
                            }
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor:
                                payment.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color:
                                  payment.color,
                              },
                            ]}
                          >
                            {
                              payment.label
                            }
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          )}

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>
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
      backgroundColor:
        "#f7f7fb",
    },

    container: {
      flex: 1,
      backgroundColor:
        "#f7f7fb",
    },

    content: {
      padding: 16,
      paddingBottom: 30,
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 18,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 12,
      elevation: 2,
    },

    backText: {
      color: "#27272a",
      fontSize: 24,
    },

    headerText: {
      flex: 1,
    },

    eyebrow: {
      color: "#7c3aed",
      fontSize: 10,
      fontWeight:
        "800",
      letterSpacing: 1,
    },

    title: {
      color: "#18181b",
      fontSize: 25,
      fontWeight:
        "800",
    },

    subtitle: {
      color: "#71717a",
      fontSize: 11,
      marginTop: 3,
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginLeft: 8,
      elevation: 2,
    },

    refreshText: {
      color: "#52525b",
      fontSize: 23,
    },

    // =================================================
    // REVENUE CARD
    // =================================================

    revenueCard: {
      backgroundColor:
        "#7c3aed",
      borderRadius: 19,
      padding: 18,
      marginBottom: 12,
      elevation: 3,
    },

    revenueTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    revenueLabel: {
      color: "#ddd6fe",
      fontSize: 9,
      fontWeight:
        "800",
      letterSpacing: 1,
    },

    revenueAmount: {
      color: "#ffffff",
      fontSize: 29,
      fontWeight:
        "800",
      marginTop: 3,
    },

    revenueIcon: {
      width: 49,
      height: 49,
      borderRadius: 15,
      backgroundColor:
        "rgba(255,255,255,0.16)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    revenueIconText: {
      color: "#ffffff",
      fontSize: 24,
      fontWeight:
        "800",
    },

    revenueDivider: {
      height: 1,
      backgroundColor:
        "rgba(255,255,255,0.18)",
      marginVertical: 15,
    },

    revenueBottom: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    smallLabel: {
      color: "#ddd6fe",
      fontSize: 9,
    },

    paidAmount: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight:
        "800",
      marginTop: 2,
    },

    pendingAmount: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight:
        "800",
      marginTop: 2,
    },

    revenueVertical: {
      width: 1,
      height: 30,
      backgroundColor:
        "rgba(255,255,255,0.18)",
      marginHorizontal: 25,
    },

    // =================================================
    // STATS
    // =================================================

    statsRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginBottom: 11,
    },

    statCard: {
      width: "48.5%",
      backgroundColor:
        "#ffffff",
      borderRadius: 16,
      padding: 14,
      elevation: 2,
    },

    statIcon: {
      width: 39,
      height: 39,
      borderRadius: 11,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 9,
    },

    statIconText: {
      fontSize: 18,
    },

    statLabel: {
      color: "#71717a",
      fontSize: 10,
      fontWeight:
        "600",
    },

    statValue: {
      color: "#18181b",
      fontSize: 23,
      fontWeight:
        "800",
      marginTop: 2,
    },

    // =================================================
    // AVERAGE
    // =================================================

    averageCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 16,
      padding: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 20,
      elevation: 2,
    },

    averageIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor:
        "#f4f4f5",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    averageContent: {
      marginLeft: 11,
    },

    averageLabel: {
      color: "#71717a",
      fontSize: 10,
    },

    averageValue: {
      color: "#18181b",
      fontSize: 18,
      fontWeight:
        "800",
      marginTop: 2,
    },

    // =================================================
    // ERROR
    // =================================================

    errorCard: {
      backgroundColor:
        "#fff1f2",
      borderRadius: 15,
      padding: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 18,
    },

    errorIcon: {
      fontSize: 21,
      marginRight: 9,
    },

    errorContent: {
      flex: 1,
    },

    errorTitle: {
      color: "#be123c",
      fontSize: 12,
      fontWeight:
        "800",
    },

    errorMessage: {
      color: "#9f1239",
      fontSize: 10,
      marginTop: 3,
    },

    retryButton: {
      backgroundColor:
        "#ffffff",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    retryText: {
      color: "#be123c",
      fontSize: 10,
      fontWeight:
        "800",
    },

    // =================================================
    // SECTION
    // =================================================

    sectionHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 12,
    },

    sectionTitle: {
      color: "#18181b",
      fontSize: 18,
      fontWeight:
        "800",
    },

    sectionSubtitle: {
      color: "#71717a",
      fontSize: 10,
      marginTop: 3,
    },

    countBadge: {
      minWidth: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor:
        "#ede9fe",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 8,
    },

    countText: {
      color: "#7c3aed",
      fontSize: 12,
      fontWeight:
        "800",
    },

    // =================================================
    // SALE CARD
    // =================================================

    saleCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 17,
      padding: 15,
      marginBottom: 13,
      elevation: 2,
    },

    saleTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#f4f4f5",
    },

    saleLabel: {
      color: "#a1a1aa",
      fontSize: 8,
      fontWeight:
        "800",
      letterSpacing: 1,
    },

    saleOrderNumber: {
      color: "#18181b",
      fontSize: 17,
      fontWeight:
        "800",
      marginTop: 2,
    },

    saleDate: {
      color: "#71717a",
      fontSize: 10,
    },

    // =================================================
    // CUSTOMER
    // =================================================

    customerRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 13,
    },

    customerIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      backgroundColor:
        "#f4f4f5",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    customerInfo: {
      flex: 1,
      marginLeft: 10,
    },

    customerName: {
      color: "#27272a",
      fontSize: 13,
      fontWeight:
        "800",
    },

    customerEmail: {
      color: "#71717a",
      fontSize: 9,
      marginTop: 2,
    },

    // =================================================
    // AMOUNT
    // =================================================

    saleAmountRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 14,
    },

    saleAmountLabel: {
      color: "#71717a",
      fontSize: 10,
    },

    saleAmount: {
      color: "#18181b",
      fontSize: 17,
      fontWeight:
        "800",
    },

    // =================================================
    // BADGES
    // =================================================

    badgesRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 10,
    },

    badge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 6,
    },

    badgeText: {
      fontSize: 9,
      fontWeight:
        "800",
      textTransform:
        "capitalize",
    },

    // =================================================
    // EMPTY
    // =================================================

    emptyCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      paddingVertical: 42,
      paddingHorizontal: 24,
      alignItems:
        "center",
      elevation: 2,
    },

    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 21,
      backgroundColor:
        "#f4f4f5",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 15,
    },

    emptyIconText: {
      fontSize: 31,
    },

    emptyTitle: {
      color: "#18181b",
      fontSize: 18,
      fontWeight:
        "800",
    },

    emptyDescription: {
      color: "#71717a",
      fontSize: 12,
      textAlign:
        "center",
      lineHeight: 18,
      marginTop: 7,
    },

    // =================================================
    // LOADING
    // =================================================

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color: "#71717a",
      fontSize: 13,
      marginTop: 12,
    },

    bottomSpace: {
      height: 25,
    },
  });