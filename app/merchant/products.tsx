import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";

// =====================================================
// PRODUCT TYPE
// =====================================================

type Product = {
  id: number;
  merchant_id?: number;
  name?: string;
  category?: string;
  price?: number | string;
  original_price?: number | string;
  discount?: number | string;
  stock?: number | string;
  brand?: string;
  description?: string;
  image?: string;
};

// =====================================================
// EDIT FORM TYPE
// =====================================================

type EditForm = {
  name: string;
  category: string;
  price: string;
  original_price: string;
  discount: string;
  stock: string;
  brand: string;
  description: string;
  image: string;
};

// =====================================================
// COMPONENT
// =====================================================

export default function MerchantProducts() {
  const router = useRouter();

  // ===================================================
  // PRODUCTS
  // ===================================================

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ===================================================
  // EDIT
  // ===================================================

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm>({
      name: "",
      category: "",
      price: "",
      original_price: "",
      discount: "",
      stock: "",
      brand: "",
      description: "",
      image: "",
    });

  const [editLoading, setEditLoading] =
    useState(false);

  // ===================================================
  // DELETE
  // ===================================================

  const [deleteLoading, setDeleteLoading] =
    useState<number | null>(null);

  // ===================================================
  // GET CURRENT MERCHANT ID
  // ===================================================

  const getCurrentMerchantId =
    async (): Promise<number> => {
      const storedUser =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      console.log(
        "MERCHANT PRODUCTS - loggedInUser:",
        storedUser
      );

      if (!storedUser) {
        throw new Error(
          "Login session not found. Please login again."
        );
      }

      let user: any;

      try {
        user =
          JSON.parse(storedUser);
      } catch {
        throw new Error(
          "Invalid login session. Please login again."
        );
      }

      const merchantId =
        Number(user?.id);

      console.log(
        "MERCHANT PRODUCTS - current merchant ID:",
        merchantId
      );

      console.log(
        "MERCHANT PRODUCTS - current role:",
        user?.role
      );

      if (
        !merchantId ||
        Number.isNaN(merchantId)
      ) {
        throw new Error(
          "Merchant ID not found. Please logout and login again."
        );
      }

      if (
        user?.role &&
        user.role !== "merchant"
      ) {
        throw new Error(
          `This account is registered as ${user.role}. Please login with a merchant account.`
        );
      }

      return merchantId;
    };

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts =
    useCallback(async () => {
      try {
        setError("");

        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        console.log(
          "MERCHANT PRODUCTS - token exists:",
          token ? "YES" : "NO"
        );

        if (!token) {
          throw new Error(
            "Login session expired. Please login again."
          );
        }

        const merchantId =
          await getCurrentMerchantId();

        console.log(
          "MERCHANT PRODUCTS - fetching for merchant:",
          merchantId
        );

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
          "Merchant products:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to fetch products"
          );
        }

        setProducts(
          data.products || []
        );
      } catch (err: any) {
        console.error(
          "Merchant products error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load merchant products."
        );
      }
    }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    const loadProducts =
      async () => {
        try {
          setLoading(true);

          await fetchProducts();
        } finally {
          setLoading(false);
        }
      };

    loadProducts();
  }, [fetchProducts]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        await fetchProducts();
      } finally {
        setRefreshing(false);
      }
    };

  // ===================================================
  // EDIT CLICK
  // ===================================================

  const handleEditClick = (
    product: Product
  ) => {
    setEditingProduct(product);

    setEditForm({
      name:
        product.name || "",

      category:
        product.category || "",

      price:
        product.price !== undefined
          ? String(product.price)
          : "",

      original_price:
        product.original_price !==
        undefined
          ? String(
              product.original_price
            )
          : "",

      discount:
        product.discount !== undefined
          ? String(
              product.discount
            )
          : "",

      stock:
        product.stock !== undefined
          ? String(product.stock)
          : "",

      brand:
        product.brand || "",

      description:
        product.description || "",

      image:
        product.image || "",
    });
  };

  // ===================================================
  // EDIT INPUT
  // ===================================================

  const handleEditChange = (
    field: keyof EditForm,
    value: string
  ) => {
    setEditForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  // ===================================================
  // CLOSE EDIT
  // ===================================================

  const closeEdit = () => {
    if (editLoading) {
      return;
    }

    setEditingProduct(null);
  };

  // ===================================================
  // UPDATE PRODUCT
  // ===================================================

  const handleUpdateProduct =
    async () => {
      if (!editingProduct) {
        return;
      }

      if (!editForm.name.trim()) {
        Alert.alert(
          "Required",
          "Product name is required."
        );
        return;
      }

      if (!editForm.category.trim()) {
        Alert.alert(
          "Required",
          "Category is required."
        );
        return;
      }

      if (!editForm.price.trim()) {
        Alert.alert(
          "Required",
          "Price is required."
        );
        return;
      }

      if (
        editForm.stock.trim() === ""
      ) {
        Alert.alert(
          "Required",
          "Stock is required."
        );
        return;
      }

      const price =
        Number(editForm.price);

      const stock =
        Number(editForm.stock);

      if (
        Number.isNaN(price) ||
        price < 0
      ) {
        Alert.alert(
          "Invalid Price",
          "Please enter a valid price."
        );
        return;
      }

      if (
        Number.isNaN(stock) ||
        stock < 0
      ) {
        Alert.alert(
          "Invalid Stock",
          "Please enter a valid stock quantity."
        );
        return;
      }

      try {
        setEditLoading(true);

        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        console.log(
          "UPDATE PRODUCT - token exists:",
          token ? "YES" : "NO"
        );

        if (!token) {
          throw new Error(
            "Login session expired. Please login again."
          );
        }

        const merchantId =
          await getCurrentMerchantId();

        console.log(
          "UPDATE PRODUCT - merchant ID:",
          merchantId
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/products/${editingProduct.id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,

                "x-user-id":
                  String(merchantId),
              },

              body:
                JSON.stringify({
                  merchant_id:
                    merchantId,

                  name:
                    editForm.name.trim(),

                  category:
                    editForm.category.trim(),

                  price,

                  original_price:
                    editForm.original_price.trim()
                      ? Number(
                          editForm.original_price
                        )
                      : price,

                  discount:
                    editForm.discount.trim()
                      ? Number(
                          editForm.discount
                        )
                      : 0,

                  stock,

                  brand:
                    editForm.brand.trim(),

                  description:
                    editForm.description.trim(),

                  image:
                    editForm.image.trim(),
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          "Update product response:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to update product."
          );
        }

        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                editingProduct.id
                  ? data.product
                  : item
            )
        );

        setEditingProduct(null);

        Alert.alert(
          "Success",
          "Product updated successfully."
        );
      } catch (err: any) {
        console.error(
          "Update product error:",
          err
        );

        Alert.alert(
          "Update Failed",
          err?.message ||
            "Failed to update product."
        );
      } finally {
        setEditLoading(false);
      }
    };

  // ===================================================
  // DELETE PRODUCT
  // ===================================================

  const handleDeleteProduct =
    (product: Product) => {
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",

            onPress:
              async () => {
                try {
                  setDeleteLoading(
                    product.id
                  );

                  const token =
                    await AsyncStorage.getItem(
                      "authToken"
                    );

                  console.log(
                    "DELETE PRODUCT - token exists:",
                    token
                      ? "YES"
                      : "NO"
                  );

                  if (!token) {
                    throw new Error(
                      "Login session expired. Please login again."
                    );
                  }

                  const merchantId =
                    await getCurrentMerchantId();

                  console.log(
                    "DELETE PRODUCT - merchant ID:",
                    merchantId
                  );

                  const response =
                    await fetch(
                      `${API_BASE_URL}/api/products/${product.id}`,
                      {
                        method:
                          "DELETE",

                        headers: {
                          "Content-Type":
                            "application/json",

                          Authorization:
                            `Bearer ${token}`,

                          "x-user-id":
                            String(
                              merchantId
                            ),
                        },

                        body:
                          JSON.stringify({
                            merchant_id:
                              merchantId,
                          }),
                      }
                    );

                  const data =
                    await response.json();

                  console.log(
                    "Delete product response:",
                    data
                  );

                  if (
                    !response.ok ||
                    !data.success
                  ) {
                    throw new Error(
                      data.message ||
                        "Failed to delete product."
                    );
                  }

                  setProducts(
                    (current) =>
                      current.filter(
                        (item) =>
                          item.id !==
                          product.id
                      )
                  );

                  Alert.alert(
                    "Deleted",
                    "Product deleted successfully."
                  );
                } catch (err: any) {
                  console.error(
                    "Delete product error:",
                    err
                  );

                  Alert.alert(
                    "Delete Failed",
                    err?.message ||
                      "Failed to delete product."
                  );
                } finally {
                  setDeleteLoading(
                    null
                  );
                }
              },
          },
        ]
      );
    };

  // ===================================================
  // FORMAT PRICE
  // ===================================================

  const formatPrice = (
    value:
      | number
      | string
      | undefined
  ) => {
    const amount =
      Number(value || 0);

    return `₹${amount.toLocaleString(
      "en-IN"
    )}`;
  };

  // ===================================================
  // STOCK STATUS
  // ===================================================

  const getStockStatus = (
    stock:
      | number
      | string
      | undefined
  ) => {
    const quantity =
      Number(stock || 0);

    if (quantity === 0) {
      return {
        label:
          "Out of Stock",

        background:
          "#fee2e2",

        text:
          "#dc2626",
      };
    }

    if (quantity <= 5) {
      return {
        label:
          `Low Stock · ${quantity}`,

        background:
          "#fef3c7",

        text:
          "#d97706",
      };
    }

    return {
      label:
        `Stock · ${quantity}`,

      background:
        "#dcfce7",

      text:
        "#16a34a",
    };
  };

  // ===================================================
  // LOADING
  // ===================================================

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
            Loading your products...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // MAIN PAGE
  // ===================================================

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
          styles.contentContainer
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
        {/* HEADER */}

        <View
          style={styles.header}
        >
          <View
            style={
              styles.headerLeft
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
                ←
              </Text>
            </TouchableOpacity>

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
                My Products
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Manage products in your store
              </Text>
            </View>
          </View>

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
              +
            </Text>

            <Text
              style={
                styles.addButtonLabel
              }
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* STORE SUMMARY */}

        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryIcon
            }
          >
            <Text
              style={
                styles.summaryIconText
              }
            >
              🏪
            </Text>
          </View>

          <View
            style={
              styles.summaryInfo
            }
          >
            <Text
              style={
                styles.summaryStore
              }
            >
              My Store
            </Text>

            <Text
              style={
                styles.summaryProducts
              }
            >
              {products.length} product
              {products.length !== 1
                ? "s"
                : ""}{" "}
              in your store
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
                styles.refreshButtonText
              }
            >
              ↻
            </Text>
          </TouchableOpacity>
        </View>

        {/* ERROR */}

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
                Unable to load products
              </Text>

              <Text
                style={
                  styles.errorText
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
                fetchProducts
              }
            >
              <Text
                style={
                  styles.retryButtonText
                }
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY */}

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
                No Products Yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Add your first product to
                start selling on ShopEase.
              </Text>

              <TouchableOpacity
                style={
                  styles.emptyAddButton
                }
                onPress={() =>
                  router.push(
                    "/merchant/add-product"
                  )
                }
              >
                <Text
                  style={
                    styles.emptyAddButtonText
                  }
                >
                  + Add Your First Product
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* PRODUCT LIST */}

        {error === "" &&
          products.length > 0 && (
            <View>
              <View
                style={
                  styles.productsHeading
                }
              >
                <View>
                  <Text
                    style={
                      styles.productsHeadingTitle
                    }
                  >
                    Your Products
                  </Text>

                  <Text
                    style={
                      styles.productsHeadingSubtitle
                    }
                  >
                    Tap edit to update product
                    details
                  </Text>
                </View>

                <View
                  style={
                    styles.countBadge
                  }
                >
                  <Text
                    style={
                      styles.countBadgeText
                    }
                  >
                    {products.length}
                  </Text>
                </View>
              </View>

              {products.map(
                (product) => {
                  const stockStatus =
                    getStockStatus(
                      product.stock
                    );

                  return (
                    <View
                      key={
                        product.id
                      }
                      style={
                        styles.productCard
                      }
                    >
                      {/* IMAGE */}

                      <View
                        style={
                          styles.productImageContainer
                        }
                      >
                        {product.image ? (
                          <Image
                            source={{
                              uri:
                                product.image,
                            }}
                            style={
                              styles.productImage
                            }
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={
                              styles.noImage
                            }
                          >
                            <Text
                              style={
                                styles.noImageText
                              }
                            >
                              📦
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* DETAILS */}

                      <View
                        style={
                          styles.productDetails
                        }
                      >
                        <View
                          style={
                            styles.categoryRow
                          }
                        >
                          <Text
                            style={
                              styles.categoryText
                            }
                          >
                            {product.category ||
                              "Product"}
                          </Text>

                          {Number(
                            product.discount ||
                              0
                          ) > 0 && (
                            <View
                              style={
                                styles.discountBadge
                              }
                            >
                              <Text
                                style={
                                  styles.discountText
                                }
                              >
                                {
                                  product.discount
                                }%
                                OFF
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={
                            styles.productName
                          }
                          numberOfLines={2}
                        >
                          {product.name ||
                            "Unnamed Product"}
                        </Text>

                        <Text
                          style={
                            styles.productBrand
                          }
                          numberOfLines={1}
                        >
                          {product.brand ||
                            "No brand"}
                        </Text>

                        <View
                          style={
                            styles.priceRow
                          }
                        >
                          <Text
                            style={
                              styles.price
                            }
                          >
                            {formatPrice(
                              product.price
                            )}
                          </Text>

                          {product.original_price &&
                            Number(
                              product.original_price
                            ) >
                              Number(
                                product.price
                              ) && (
                              <Text
                                style={
                                  styles.originalPrice
                                }
                              >
                                {formatPrice(
                                  product.original_price
                                )}
                              </Text>
                            )}
                        </View>

                        <View
                          style={
                            styles.stockRow
                          }
                        >
                          <View
                            style={[
                              styles.stockBadge,
                              {
                                backgroundColor:
                                  stockStatus.background,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stockText,
                                {
                                  color:
                                    stockStatus.text,
                                },
                              ]}
                            >
                              {
                                stockStatus.label
                              }
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.actionsRow
                          }
                        >
                          <TouchableOpacity
                            style={
                              styles.editButton
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                              handleEditClick(
                                product
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
                              Edit
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={
                              styles.deleteButton
                            }
                            activeOpacity={0.8}
                            disabled={
                              deleteLoading ===
                              product.id
                            }
                            onPress={() =>
                              handleDeleteProduct(
                                product
                              )
                            }
                          >
                            {deleteLoading ===
                            product.id ? (
                              <ActivityIndicator
                                size="small"
                                color="#dc2626"
                              />
                            ) : (
                              <>
                                <Text
                                  style={
                                    styles.deleteButtonIcon
                                  }
                                >
                                  🗑️
                                </Text>

                                <Text
                                  style={
                                    styles.deleteButtonText
                                  }
                                >
                                  Delete
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
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

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      <Modal
        visible={
          editingProduct !== null
        }
        animationType="slide"
        transparent={true}
        onRequestClose={
          closeEdit
        }
      >
        {/* KEYBOARD FIX FOR EDIT MODAL */}

        <KeyboardAvoidingView
          style={
            styles.modalKeyboard
          }
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            Platform.OS === "ios"
              ? 0
              : 20
          }
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

              {/* MODAL HEADER */}

              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalEyebrow
                    }
                  >
                    MERCHANT
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Edit Product
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Update product details
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.modalClose
                  }
                  onPress={
                    closeEdit
                  }
                  disabled={
                    editLoading
                  }
                >
                  <Text
                    style={
                      styles.modalCloseText
                    }
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={
                  styles.modalScroll
                }
                contentContainerStyle={
                  styles.modalScrollContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >

                {/* NAME */}

                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    Product Name *
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      editForm.name
                    }
                    onChangeText={(
                      value
                    ) =>
                      handleEditChange(
                        "name",
                        value
                      )
                    }
                    placeholder="Product name"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>

                {/* CATEGORY */}

                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    Category *
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      editForm.category
                    }
                    onChangeText={(
                      value
                    ) =>
                      handleEditChange(
                        "category",
                        value
                      )
                    }
                    placeholder="Category"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>

                {/* PRICE ROW */}

                <View
                  style={
                    styles.inputRow
                  }
                >
                  <View
                    style={[
                      styles.inputGroup,
                      styles.halfInput,
                    ]}
                  >
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Selling Price *
                    </Text>

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        editForm.price
                      }
                      onChangeText={(
                        value
                      ) =>
                        handleEditChange(
                          "price",
                          value
                        )
                      }
                      placeholder="₹0"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      styles.halfInput,
                    ]}
                  >
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Original Price
                    </Text>

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        editForm.original_price
                      }
                      onChangeText={(
                        value
                      ) =>
                        handleEditChange(
                          "original_price",
                          value
                        )
                      }
                      placeholder="₹0"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* DISCOUNT + STOCK */}

                <View
                  style={
                    styles.inputRow
                  }
                >
                  <View
                    style={[
                      styles.inputGroup,
                      styles.halfInput,
                    ]}
                  >
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Discount (%)
                    </Text>

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        editForm.discount
                      }
                      onChangeText={(
                        value
                      ) =>
                        handleEditChange(
                          "discount",
                          value
                        )
                      }
                      placeholder="0"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="numeric"
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      styles.halfInput,
                    ]}
                  >
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Stock *
                    </Text>

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        editForm.stock
                      }
                      onChangeText={(
                        value
                      ) =>
                        handleEditChange(
                          "stock",
                          value
                        )
                      }
                      placeholder="0"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* BRAND */}

                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    Brand
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      editForm.brand
                    }
                    onChangeText={(
                      value
                    ) =>
                      handleEditChange(
                        "brand",
                        value
                      )
                    }
                    placeholder="Brand name"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>

                {/* IMAGE */}

                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    Image URL
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      editForm.image
                    }
                    onChangeText={(
                      value
                    ) =>
                      handleEditChange(
                        "image",
                        value
                      )
                    }
                    placeholder="https://..."
                    placeholderTextColor="#a1a1aa"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>

                {/* DESCRIPTION */}

                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    Description
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                    ]}
                    value={
                      editForm.description
                    }
                    onChangeText={(
                      value
                    ) =>
                      handleEditChange(
                        "description",
                        value
                      )
                    }
                    placeholder="Product description"
                    placeholderTextColor="#a1a1aa"
                    multiline={true}
                    textAlignVertical="top"
                  />
                </View>

                {/* ACTIONS */}

                <View
                  style={
                    styles.modalActions
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.modalCancelButton
                    }
                    onPress={
                      closeEdit
                    }
                    disabled={
                      editLoading
                    }
                  >
                    <Text
                      style={
                        styles.modalCancelText
                      }
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.modalSaveButton
                    }
                    onPress={
                      handleUpdateProduct
                    }
                    disabled={
                      editLoading
                    }
                  >
                    {editLoading ? (
                      <ActivityIndicator
                        size="small"
                        color="#ffffff"
                      />
                    ) : (
                      <Text
                        style={
                          styles.modalSaveText
                        }
                      >
                        Save Changes
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View
                  style={
                    styles.modalBottomSpace
                  }
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 30,
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 18,
    },

    headerLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
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
      shadowColor:
        "#000",
      shadowOpacity:
        0.05,
      shadowRadius:
        7,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      elevation: 2,
    },

    backButtonText: {
      fontSize: 24,
      color: "#27272a",
      marginTop: -2,
    },

    eyebrow: {
      color: "#7c3aed",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 2,
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

    addButton: {
      height: 43,
      paddingHorizontal: 13,
      borderRadius: 12,
      backgroundColor:
        "#7c3aed",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginLeft: 8,
    },

    addButtonText: {
      color: "#ffffff",
      fontSize: 21,
      fontWeight: "600",
      marginRight: 4,
      marginTop: -1,
    },

    addButtonLabel: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },

    // =================================================
    // SUMMARY
    // =================================================

    summaryCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 17,
      padding: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 22,
      shadowColor:
        "#000",
      shadowOpacity:
        0.05,
      shadowRadius:
        9,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      elevation: 2,
    },

    summaryIcon: {
      width: 47,
      height: 47,
      borderRadius: 14,
      backgroundColor:
        "#ede9fe",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    summaryIconText: {
      fontSize: 22,
    },

    summaryInfo: {
      flex: 1,
      marginLeft: 12,
    },

    summaryStore: {
      color: "#18181b",
      fontSize: 15,
      fontWeight: "800",
    },

    summaryProducts: {
      color: "#71717a",
      fontSize: 11,
      marginTop: 3,
    },

    refreshButton: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor:
        "#f4f4f5",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    refreshButtonText: {
      color: "#52525b",
      fontSize: 22,
    },

    // =================================================
    // ERROR
    // =================================================

    errorCard: {
      backgroundColor:
        "#fff1f2",
      borderWidth: 1,
      borderColor:
        "#fecdd3",
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
      marginRight: 10,
    },

    errorContent: {
      flex: 1,
    },

    errorTitle: {
      color: "#be123c",
      fontSize: 13,
      fontWeight: "800",
    },

    errorText: {
      color: "#9f1239",
      fontSize: 10,
      marginTop: 3,
    },

    retryButton: {
      backgroundColor:
        "#ffffff",
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginLeft: 8,
    },

    retryButtonText: {
      color: "#be123c",
      fontSize: 11,
      fontWeight: "800",
    },

    // =================================================
    // EMPTY
    // =================================================

    emptyCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      paddingVertical: 40,
      paddingHorizontal: 24,
      alignItems:
        "center",
      marginTop: 5,
      shadowColor:
        "#000",
      shadowOpacity:
        0.045,
      shadowRadius:
        9,
      shadowOffset: {
        width: 0,
        height: 3,
      },
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
      fontWeight: "800",
    },

    emptyDescription: {
      color: "#71717a",
      fontSize: 12,
      textAlign:
        "center",
      lineHeight: 18,
      marginTop: 7,
      maxWidth: 280,
    },

    emptyAddButton: {
      backgroundColor:
        "#7c3aed",
      borderRadius: 11,
      paddingHorizontal: 17,
      paddingVertical: 11,
      marginTop: 18,
    },

    emptyAddButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },

    // =================================================
    // PRODUCTS HEADING
    // =================================================

    productsHeading: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 12,
    },

    productsHeadingTitle: {
      color: "#18181b",
      fontSize: 18,
      fontWeight: "800",
    },

    productsHeadingSubtitle: {
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

    countBadgeText: {
      color: "#7c3aed",
      fontSize: 12,
      fontWeight: "800",
    },

    // =================================================
    // PRODUCT CARD
    // =================================================

    productCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 17,
      padding: 12,
      marginBottom: 13,
      flexDirection:
        "row",
      shadowColor:
        "#000",
      shadowOpacity:
        0.045,
      shadowRadius:
        9,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      elevation: 2,
    },

    productImageContainer: {
      width: 105,
      height: 125,
      borderRadius: 13,
      overflow: "hidden",
      backgroundColor:
        "#f4f4f5",
    },

    productImage: {
      width: "100%",
      height: "100%",
    },

    noImage: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    noImageText: {
      fontSize: 31,
    },

    productDetails: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    categoryRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 4,
    },

    categoryText: {
      color: "#7c3aed",
      fontSize: 9,
      fontWeight: "800",
      textTransform:
        "uppercase",
    },

    discountBadge: {
      backgroundColor:
        "#dcfce7",
      borderRadius: 5,
      paddingHorizontal: 5,
      paddingVertical: 2,
      marginLeft: 6,
    },

    discountText: {
      color: "#15803d",
      fontSize: 8,
      fontWeight: "800",
    },

    productName: {
      color: "#18181b",
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 19,
    },

    productBrand: {
      color: "#71717a",
      fontSize: 10,
      marginTop: 2,
    },

    priceRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 7,
    },

    price: {
      color: "#18181b",
      fontSize: 16,
      fontWeight: "800",
    },

    originalPrice: {
      color: "#a1a1aa",
      fontSize: 10,
      textDecorationLine:
        "line-through",
      marginLeft: 7,
    },

    stockRow: {
      flexDirection:
        "row",
      marginTop: 6,
    },

    stockBadge: {
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    stockText: {
      fontSize: 9,
      fontWeight: "800",
    },

    actionsRow: {
      flexDirection:
        "row",
      marginTop: 9,
      gap: 7,
    },

    editButton: {
      flex: 1,
      height: 31,
      borderRadius: 8,
      backgroundColor:
        "#f5f3ff",
      borderWidth: 1,
      borderColor:
        "#ddd6fe",
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
    },

    editButtonIcon: {
      fontSize: 11,
      marginRight: 4,
    },

    editButtonText: {
      color: "#6d28d9",
      fontSize: 10,
      fontWeight: "800",
    },

    deleteButton: {
      flex: 1,
      height: 31,
      borderRadius: 8,
      backgroundColor:
        "#fff1f2",
      borderWidth: 1,
      borderColor:
        "#fecdd3",
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
    },

    deleteButtonIcon: {
      fontSize: 10,
      marginRight: 4,
    },

    deleteButtonText: {
      color: "#dc2626",
      fontSize: 10,
      fontWeight: "800",
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
      paddingHorizontal: 20,
    },

    loadingText: {
      color: "#71717a",
      fontSize: 13,
      marginTop: 12,
    },

    bottomSpace: {
      height: 25,
    },

    // =================================================
    // EDIT MODAL
    // =================================================

    modalKeyboard: {
      flex: 1,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.45)",
      justifyContent:
        "flex-end",
    },

    modalContainer: {
      backgroundColor:
        "#f7f7fb",
      borderTopLeftRadius:
        24,
      borderTopRightRadius:
        24,
      height: "85%",
      maxHeight: "92%",
      paddingTop: 18,
    },

    modalHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 18,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e4e4e7",
    },

    modalEyebrow: {
      color: "#7c3aed",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
    },

    modalTitle: {
      color: "#18181b",
      fontSize: 22,
      fontWeight: "800",
      marginTop: 2,
    },

    modalSubtitle: {
      color: "#71717a",
      fontSize: 10,
      marginTop: 3,
    },

    modalClose: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    modalCloseText: {
      color: "#52525b",
      fontSize: 27,
      lineHeight: 30,
    },

    modalScroll: {
      flex: 1,
      paddingHorizontal: 18,
    },

    modalScrollContent: {
      paddingBottom: 40,
    },

    // =================================================
    // INPUTS
    // =================================================

    inputGroup: {
      marginTop: 15,
    },

    inputRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
    },

    halfInput: {
      width: "48%",
    },

    inputLabel: {
      color: "#27272a",
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 6,
    },

    input: {
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e4e4e7",
      borderRadius: 10,
      minHeight: 43,
      paddingHorizontal: 11,
      paddingVertical: 9,
      color: "#18181b",
      fontSize: 12,
    },

    textArea: {
      minHeight: 95,
      paddingTop: 11,
    },

    // =================================================
    // MODAL ACTIONS
    // =================================================

    modalActions: {
      flexDirection:
        "row",
      gap: 10,
      marginTop: 22,
    },

    modalCancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 11,
      backgroundColor:
        "#e4e4e7",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    modalCancelText: {
      color: "#3f3f46",
      fontSize: 12,
      fontWeight: "800",
    },

    modalSaveButton: {
      flex: 1,
      height: 46,
      borderRadius: 11,
      backgroundColor:
        "#7c3aed",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    modalSaveText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },

    modalBottomSpace: {
      height: 30,
    },
  });