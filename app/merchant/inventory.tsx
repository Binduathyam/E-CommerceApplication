import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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

import { API_BASE_URL } from "../../config/api";

type Product = {
  id: number;
  merchant_id?: number;
  name?: string;
  category?: string;
  price?: number | string;
  stock?: number | string;
  brand?: string;
  image?: string;
};

export default function MerchantInventory() {
  const router = useRouter();

  const [products, setProducts] =
    useState<Product[]>([]);

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

      console.log(
        "MERCHANT INVENTORY - loggedInUser:",
        storedUser
      );

      if (!storedUser) {
        throw new Error(
          "Merchant login information not found. Please login again."
        );
      }

      let user: any;

      try {
        user = JSON.parse(
          storedUser
        );
      } catch {
        throw new Error(
          "Invalid merchant login information. Please login again."
        );
      }

      const merchantId =
        Number(user?.id);

      console.log(
        "MERCHANT INVENTORY - current merchant ID:",
        merchantId
      );

      if (
        !merchantId ||
        Number.isNaN(merchantId)
      ) {
        throw new Error(
          "Merchant ID not found. Please login again."
        );
      }

      // Verify logged-in account is a merchant
      if (
        user?.role &&
        user.role !== "merchant"
      ) {
        throw new Error(
          "This account is not registered as a merchant."
        );
      }

      return merchantId;
    };

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  const fetchInventory =
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
          "MERCHANT INVENTORY - token exists:",
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
        // GET MERCHANT PRODUCTS
        // -------------------------------------------------

        const response =
          await fetch(
            `${API_BASE_URL}/api/products/merchant/${merchantId}`,
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
          "MERCHANT INVENTORY RESPONSE:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load inventory."
          );
        }

        setProducts(
          data.products ||
            data.data ||
            []
        );
      } catch (err: any) {
        console.error(
          "Merchant inventory error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load inventory."
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

        await fetchInventory();

        setLoading(false);
      };

    load();
  }, [fetchInventory]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh =
    async () => {
      setRefreshing(true);

      await fetchInventory();

      setRefreshing(false);
    };

  // =====================================================
  // INVENTORY COUNTS
  // =====================================================

  const inventoryStats =
    useMemo(() => {
      let totalStock = 0;
      let outOfStock = 0;
      let lowStock = 0;
      let healthyStock = 0;

      products.forEach(
        (product) => {
          const stock =
            Number(
              product.stock || 0
            );

          totalStock += stock;

          if (stock === 0) {
            outOfStock++;
          } else if (
            stock <= 5
          ) {
            lowStock++;
          } else {
            healthyStock++;
          }
        }
      );

      return {
        totalStock,
        outOfStock,
        lowStock,
        healthyStock,
      };
    }, [products]);

  // =====================================================
  // STOCK STATUS
  // =====================================================

  const getStockStatus = (
    stockValue?: number | string
  ) => {
    const stock =
      Number(
        stockValue || 0
      );

    if (stock === 0) {
      return {
        label: "Out of Stock",
        background: "#fee2e2",
        color: "#dc2626",
      };
    }

    if (stock <= 5) {
      return {
        label: "Low Stock",
        background: "#fef3c7",
        color: "#d97706",
      };
    }

    return {
      label: "In Stock",
      background: "#dcfce7",
      color: "#15803d",
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
            Loading inventory...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN PAGE
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
              Inventory
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Monitor your product stock
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
            SUMMARY CARDS
        ================================================= */}

        <View
          style={
            styles.statsRow
          }
        >

          {/* TOTAL STOCK */}

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
                📦
              </Text>
            </View>

            <Text
              style={
                styles.statLabel
              }
            >
              Total Units
            </Text>

            <Text
              style={
                styles.statValue
              }
            >
              {
                inventoryStats.totalStock
              }
            </Text>
          </View>

          {/* LOW STOCK */}

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
                ⚠️
              </Text>
            </View>

            <Text
              style={
                styles.statLabel
              }
            >
              Low Stock
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
                inventoryStats.lowStock
              }
            </Text>
          </View>
        </View>

        <View
          style={
            styles.statsRow
          }
        >

          {/* OUT OF STOCK */}

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
                ❌
              </Text>
            </View>

            <Text
              style={
                styles.statLabel
              }
            >
              Out of Stock
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
                inventoryStats.outOfStock
              }
            </Text>
          </View>

          {/* HEALTHY */}

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
              Healthy Stock
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
                inventoryStats.healthyStock
              }
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
                Unable to load inventory
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
                fetchInventory
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
            INVENTORY HEADER
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
                Stock Overview
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Current stock for all products
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
                {
                  products.length
                }
              </Text>
            </View>
          </View>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {error === "" &&
          products.length === 0 && (
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
                No Products
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Add products to your store to
                start managing inventory.
              </Text>

              <TouchableOpacity
                style={
                  styles.addButton
                }
                onPress={() =>
                  router.push(
                    "/merchant/add-product"
                  )
                }
              >
                <Text
                  style={
                    styles.addButtonText
                  }
                >
                  + Add Product
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* =================================================
            PRODUCT INVENTORY LIST
        ================================================= */}

        {error === "" &&
          products.length > 0 && (
            <View>
              {products.map(
                (product) => {
                  const stock =
                    Number(
                      product.stock || 0
                    );

                  const status =
                    getStockStatus(
                      product.stock
                    );

                  return (
                    <View
                      key={
                        product.id
                      }
                      style={
                        styles.inventoryCard
                      }
                    >

                      {/* PRODUCT INFO */}

                      <View
                        style={
                          styles.productHeader
                        }
                      >
                        <View
                          style={
                            styles.productIcon
                          }
                        >
                          <Text
                            style={
                              styles.productIconText
                            }
                          >
                            📦
                          </Text>
                        </View>

                        <View
                          style={
                            styles.productInfo
                          }
                        >
                          <Text
                            style={
                              styles.productName
                            }
                            numberOfLines={
                              2
                            }
                          >
                            {
                              product.name ||
                              "Unnamed Product"
                            }
                          </Text>

                          <Text
                            style={
                              styles.productCategory
                            }
                          >
                            {
                              product.category ||
                              "Product"
                            }
                          </Text>

                          {product.brand && (
                            <Text
                              style={
                                styles.productBrand
                              }
                            >
                              {
                                product.brand
                              }
                            </Text>
                          )}
                        </View>

                        <Text
                          style={
                            styles.productId
                          }
                        >
                          #{product.id}
                        </Text>
                      </View>

                      {/* STOCK SECTION */}

                      <View
                        style={
                          styles.stockSection
                        }
                      >
                        <View>
                          <Text
                            style={
                              styles.stockLabel
                            }
                          >
                            AVAILABLE STOCK
                          </Text>

                          <Text
                            style={[
                              styles.stockNumber,
                              {
                                color:
                                  status.color,
                              },
                            ]}
                          >
                            {stock}
                          </Text>

                          <Text
                            style={
                              styles.unitsText
                            }
                          >
                            units available
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                status.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  status.color,
                              },
                            ]}
                          >
                            {
                              status.label
                            }
                          </Text>
                        </View>
                      </View>

                      {/* STOCK BAR */}

                      <View
                        style={
                          styles.progressContainer
                        }
                      >
                        <View
                          style={
                            styles.progressBackground
                          }
                        >
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width:
                                  stock === 0
                                    ? "0%"
                                    : stock <= 5
                                    ? "25%"
                                    : stock <= 20
                                    ? "60%"
                                    : "100%",

                                backgroundColor:
                                  status.color,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* ACTION */}

                      <TouchableOpacity
                        style={
                          styles.editButton
                        }
                        onPress={() =>
                          router.push(
                            "/merchant/products"
                          )
                        }
                      >
                        <Text
                          style={
                            styles.editButtonIcon
                          }
                        >
                          ✏️
                        </Text>

                        <Text
                          style={
                            styles.editButtonText
                          }
                        >
                          Manage Product
                        </Text>

                        <Text
                          style={
                            styles.editArrow
                          }
                        >
                          →
                        </Text>
                      </TouchableOpacity>

                    </View>
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
      backgroundColor: "#f7f7fb",
    },

    container: {
      flex: 1,
      backgroundColor: "#f7f7fb",
    },

    content: {
      padding: 16,
      paddingBottom: 30,
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 19,
    },

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
      fontWeight: "800",
      letterSpacing: 1,
    },

    title: {
      color: "#18181b",
      fontSize: 25,
      fontWeight: "800",
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
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      elevation: 2,
    },

    refreshText: {
      color: "#52525b",
      fontSize: 23,
    },

    // =================================================
    // STATS
    // =================================================

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 11,
    },

    statCard: {
      width: "48.5%",
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 14,
      elevation: 2,
    },

    statIcon: {
      width: 39,
      height: 39,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 9,
    },

    statIconText: {
      fontSize: 18,
    },

    statLabel: {
      color: "#71717a",
      fontSize: 10,
      fontWeight: "600",
    },

    statValue: {
      color: "#18181b",
      fontSize: 23,
      fontWeight: "800",
      marginTop: 2,
    },

    // =================================================
    // ERROR
    // =================================================

    errorCard: {
      backgroundColor: "#fff1f2",
      borderRadius: 15,
      padding: 13,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 7,
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
      fontWeight: "800",
    },

    errorMessage: {
      color: "#9f1239",
      fontSize: 10,
      marginTop: 3,
    },

    retryButton: {
      backgroundColor: "#ffffff",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    retryText: {
      color: "#be123c",
      fontSize: 10,
      fontWeight: "800",
    },

    // =================================================
    // SECTION
    // =================================================

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 12,
    },

    sectionTitle: {
      color: "#18181b",
      fontSize: 18,
      fontWeight: "800",
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
      backgroundColor: "#ede9fe",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },

    countText: {
      color: "#7c3aed",
      fontSize: 12,
      fontWeight: "800",
    },

    // =================================================
    // INVENTORY CARD
    // =================================================

    inventoryCard: {
      backgroundColor: "#ffffff",
      borderRadius: 17,
      padding: 15,
      marginBottom: 13,
      elevation: 2,
    },

    productHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    productIcon: {
      width: 49,
      height: 49,
      borderRadius: 14,
      backgroundColor: "#f4f4f5",
      alignItems: "center",
      justifyContent: "center",
    },

    productIconText: {
      fontSize: 23,
    },

    productInfo: {
      flex: 1,
      marginLeft: 11,
      marginRight: 8,
    },

    productName: {
      color: "#18181b",
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 18,
    },

    productCategory: {
      color: "#7c3aed",
      fontSize: 9,
      fontWeight: "800",
      textTransform: "uppercase",
      marginTop: 3,
    },

    productBrand: {
      color: "#71717a",
      fontSize: 9,
      marginTop: 2,
    },

    productId: {
      color: "#a1a1aa",
      fontSize: 9,
    },

    // =================================================
    // STOCK
    // =================================================

    stockSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 17,
    },

    stockLabel: {
      color: "#a1a1aa",
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.8,
    },

    stockNumber: {
      fontSize: 27,
      fontWeight: "800",
      marginTop: 1,
    },

    unitsText: {
      color: "#71717a",
      fontSize: 9,
      marginTop: -2,
    },

    statusBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    statusText: {
      fontSize: 9,
      fontWeight: "800",
    },

    // =================================================
    // PROGRESS
    // =================================================

    progressContainer: {
      marginTop: 14,
    },

    progressBackground: {
      height: 6,
      borderRadius: 5,
      backgroundColor: "#f4f4f5",
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      borderRadius: 5,
    },

    // =================================================
    // MANAGE BUTTON
    // =================================================

    editButton: {
      height: 39,
      borderRadius: 10,
      backgroundColor: "#f5f3ff",
      borderWidth: 1,
      borderColor: "#ddd6fe",
      marginTop: 14,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
    },

    editButtonIcon: {
      fontSize: 12,
      marginRight: 6,
    },

    editButtonText: {
      flex: 1,
      color: "#6d28d9",
      fontSize: 10,
      fontWeight: "800",
    },

    editArrow: {
      color: "#7c3aed",
      fontSize: 17,
    },

    // =================================================
    // EMPTY
    // =================================================

    emptyCard: {
      backgroundColor: "#ffffff",
      borderRadius: 18,
      paddingVertical: 42,
      paddingHorizontal: 24,
      alignItems: "center",
      marginTop: 8,
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

    emptyIconText: {
      fontSize: 31,
    },

    emptyTitle: {
      color: "#18181b",
      fontSize: 18,
      fontWeight: "800",
    },

    emptyDescription: {
      color: "#71717a",
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 7,
    },

    addButton: {
      backgroundColor: "#7c3aed",
      borderRadius: 11,
      paddingHorizontal: 17,
      paddingVertical: 11,
      marginTop: 18,
    },

    addButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
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
      height: 25,
    },
  });