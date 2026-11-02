import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { API_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';

const ADDRESSES_ROUTE = '/addresses';

type Address = {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
};

type Errors = {
  general?: string;
  email?: string;
};

type PaymentMethod = 'cod' | 'online';

// =====================================================
// HELPERS
// =====================================================

const getProductId = (item: any) =>
  Number(item?.product_id ?? item?.productId ?? item?.id ?? 0);

const getVariantId = (item: any) =>
  item?.variant_id ?? item?.variantId ?? item?.variant?.id ?? null;

const getGstRate = (item: any) =>
  Number(item?.gst_rate ?? item?.gstRate ?? 0);

const money = (value: number, decimals = false) =>
  value.toLocaleString(
    'en-IN',
    decimals
      ? {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      : undefined
  );

// =====================================================
// NORMALIZE ADDRESS
// =====================================================

const normalizeAddress = (raw: any): Address | null => {
  if (!raw) return null;

  const addressId = Number(
    raw?.id ??
      raw?.address_id ??
      raw?.addressId ??
      0
  );

  if (!addressId) {
    console.log('ADDRESS WITHOUT ID:', raw);
  }

  return {
    id: addressId,

    user_id: Number(
      raw?.user_id ??
        raw?.userId ??
        0
    ),

    full_name:
      raw?.full_name ??
      raw?.fullName ??
      raw?.name ??
      '',

    phone:
      raw?.phone ??
      raw?.mobile ??
      raw?.phone_number ??
      '',

    address_line:
      raw?.address_line ??
      raw?.addressLine ??
      raw?.address ??
      raw?.street ??
      '',

    city:
      raw?.city ??
      '',

    state:
      raw?.state ??
      '',

    pincode:
      raw?.pincode ??
      raw?.pin_code ??
      raw?.postal_code ??
      raw?.postalCode ??
      '',
  };
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function CheckoutScreen() {
  const router = useRouter();

  const {
    cartItems,
    clearCart,
    buyNowItem,
    clearBuyNow,
  } = useCart();

  const isBuyNow = !!buyNowItem;

  // =====================================================
  // CLEAN BUY NOW
  // =====================================================

  useEffect(() => {
    return () => {
      clearBuyNow();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // STATES
  // =====================================================

  const [defaultAddress, setDefaultAddress] =
    useState<Address | null>(null);

  const [addressLoading, setAddressLoading] =
    useState(true);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cod');

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] =
    useState<Errors>({});

  const [email, setEmail] =
    useState('');

  // =====================================================
  // SAFE CART
  // =====================================================

  const safeCart: any[] = buyNowItem
    ? [buyNowItem]
    : Array.isArray(cartItems)
    ? cartItems
    : [];

  // =====================================================
  // TOTALS
  // =====================================================

  const subtotal = safeCart.reduce((sum, item) => {
    const price = Number(item?.price || 0);
    const quantity = Number(item?.quantity || 1);

    return sum + price * quantity;
  }, 0);

  const gstAmount = safeCart.reduce((sum, item) => {
    const price = Number(item?.price || 0);
    const quantity = Number(item?.quantity || 1);
    const gstRate = getGstRate(item);

    return sum + (price * quantity * gstRate) / 100;
  }, 0);

  const deliveryFee =
    subtotal >= 999 ? 0 : 40;

  const platformFee =
    subtotal > 0 ? 10 : 0;

  const total = Math.max(
    0,
    subtotal +
      gstAmount +
      deliveryFee +
      platformFee
  );

  // =====================================================
  // USER
  // =====================================================

  const getUser = async () => {
    try {
      const stored =
        await AsyncStorage.getItem('loggedInUser');

      console.log(
        'CHECKOUT loggedInUser:',
        stored
      );

      if (!stored) {
        return null;
      }

      const user = JSON.parse(stored);

      console.log(
        'CHECKOUT USER:',
        user
      );

      if (!user?.id) {
        return null;
      }

      return user;
    } catch (error) {
      console.error(
        'GET USER ERROR:',
        error
      );

      return null;
    }
  };

  // =====================================================
  // TOKEN
  // =====================================================

  const getAuthToken = async () => {
    try {
      const token =
        await AsyncStorage.getItem('authToken');

      console.log(
        'CHECKOUT TOKEN EXISTS:',
        !!token
      );

      return token;
    } catch (error) {
      console.error(
        'TOKEN ERROR:',
        error
      );

      return null;
    }
  };

  // =====================================================
  // FETCH DEFAULT ADDRESS
  // =====================================================

  const fetchDefaultAddress =
    useCallback(async () => {
      try {
        setAddressLoading(true);

        setErrors((previous) => ({
          ...previous,
          general: '',
        }));

        const user =
          await getUser();

        if (!user?.id) {
          console.log(
            'NO LOGGED-IN USER FOUND'
          );

          setDefaultAddress(null);

          setErrors({
            general:
              'Please login before continuing.',
          });

          return;
        }

        // Email from logged-in user
        setEmail((previous) =>
          previous ||
          user?.email ||
          ''
        );

        const token =
          await getAuthToken();

        const url =
          `${API_BASE_URL}/api/addresses/${user.id}/default`;

        console.log(
          'FETCH DEFAULT ADDRESS URL:',
          url
        );

        console.log(
          'FETCH DEFAULT ADDRESS USER ID:',
          user.id
        );

        const headers: Record<string, string> = {
          'Content-Type':
            'application/json',

          'x-user-id':
            String(user.id),
        };

        if (token) {
          headers.Authorization =
            `Bearer ${token}`;
        }

        const response =
          await fetch(url, {
            method: 'GET',
            headers,
          });

        console.log(
          'ADDRESS RESPONSE STATUS:',
          response.status
        );

        const responseText =
          await response.text();

        console.log(
          'ADDRESS RAW RESPONSE:',
          responseText
        );

        let data: any = {};

        try {
          data =
            responseText
              ? JSON.parse(responseText)
              : {};
        } catch (parseError) {
          console.error(
            'ADDRESS JSON PARSE ERROR:',
            parseError
          );

          throw new Error(
            'Server returned invalid address data.'
          );
        }

        console.log(
          'ADDRESS API DATA:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `Address request failed (${response.status})`
          );
        }

        // =================================================
        // SUPPORT DIFFERENT BACKEND RESPONSE FORMATS
        // =================================================

        let rawAddress =
          data?.address ??
          data?.defaultAddress ??
          data?.default_address ??
          data?.data?.address ??
          data?.data?.defaultAddress ??
          data?.data?.default_address ??
          data?.data ??
          null;

        // Some APIs return an array
        if (
          Array.isArray(rawAddress)
        ) {
          rawAddress =
            rawAddress.length > 0
              ? rawAddress[0]
              : null;
        }

        console.log(
          'RAW DEFAULT ADDRESS:',
          rawAddress
        );

        const normalized =
          normalizeAddress(
            rawAddress
          );

        console.log(
          'NORMALIZED DEFAULT ADDRESS:',
          normalized
        );

        if (!normalized) {
          setDefaultAddress(null);

          setErrors({
            general:
              'No default address found. Please add or select a default address.',
          });

          return;
        }

        setDefaultAddress(
          normalized
        );

        setErrors((previous) => ({
          ...previous,
          general: '',
        }));

      } catch (error: any) {
        console.error(
          'DEFAULT ADDRESS ERROR:',
          error
        );

        setDefaultAddress(null);

        setErrors({
          general:
            error?.message ||
            'Unable to load your default address.',
        });

      } finally {
        setAddressLoading(false);
      }
    }, []);

  // =====================================================
  // REFRESH WHEN SCREEN GETS FOCUS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      console.log(
        'CHECKOUT SCREEN FOCUSED - LOADING ADDRESS'
      );

      fetchDefaultAddress();
    }, [fetchDefaultAddress])
  );

  // =====================================================
  // MANAGE ADDRESSES
  // =====================================================

  const onManageAddresses =
    () => {
      router.push(
        ADDRESSES_ROUTE as any
      );
    };

  // =====================================================
  // PREPARE ORDER ITEMS
  // =====================================================

  const prepareOrderItems = () => {
    const orderItems =
      safeCart.map((item) => {
        const variantId =
          getVariantId(item);

        return {
          product_id:
            getProductId(item),

          variant_id:
            variantId !== null &&
            variantId !== undefined &&
            variantId !== ''
              ? Number(variantId)
              : null,

          quantity:
            Number(
              item?.quantity || 1
            ),

          price:
            Number(
              item?.price || 0
            ),

          gst_rate:
            getGstRate(item),
        };
      });

    console.log(
      'CHECKOUT ORDER ITEMS:',
      orderItems
    );

    return orderItems;
  };

  // =====================================================
  // COD ORDER
  // =====================================================

  const createCODOrder =
    async (
      userId: number,
      addressId: number,
      orderItems: any[]
    ) => {
      const token =
        await getAuthToken();

      const response =
        await fetch(
          `${API_BASE_URL}/api/orders`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(userId),
            },

            body: JSON.stringify({
              user_id:
                userId,

              address_id:
                addressId,

              total_amount:
                total,

              payment_method:
                'Cash on Delivery',

              items:
                orderItems,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        'COD ORDER RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to create order.'
        );
      }

      return data;
    };

  // =====================================================
  // RAZORPAY CREATE ORDER
  // =====================================================

  const createRazorpayOrder =
    async (
      userId: number
    ) => {
      const token =
        await getAuthToken();

      const response =
        await fetch(
          `${API_BASE_URL}/api/payment/create-order`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(userId),
            },

            body: JSON.stringify({
              user_id:
                userId,

              total_amount:
                total,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to create payment order.'
        );
      }

      return data;
    };

  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  const verifyRazorpayPayment =
    async ({
      userId,
      addressId,
      orderItems,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }: {
      userId: number;
      addressId: number;
      orderItems: any[];
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      const token =
        await getAuthToken();

      const response =
        await fetch(
          `${API_BASE_URL}/api/payment/verify`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(userId),
            },

            body: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,

              user_id:
                userId,

              address_id:
                addressId,

              total_amount:
                total,

              items:
                orderItems,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        'PAYMENT VERIFY RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Payment verification failed.'
        );
      }

      return data;
    };

  // =====================================================
  // RAZORPAY
  // =====================================================

  const startRazorpayPayment =
    async ({
      userId,
      addressId,
      orderItems,
    }: {
      userId: number;
      addressId: number;
      orderItems: any[];
    }) => {
      const paymentOrder =
        await createRazorpayOrder(
          userId
        );

      console.log(
        'RAZORPAY ORDER:',
        paymentOrder
      );

      const options = {
        key:
          paymentOrder.key_id,

        amount:
          paymentOrder.amount,

        currency:
          paymentOrder.currency ||
          'INR',

        name:
          'ShopEase',

        description:
          'ShopEase Order Payment',

        order_id:
          paymentOrder.razorpay_order_id,

        prefill: {
          name:
            defaultAddress?.full_name ||
            '',

          email:
            email.trim(),

          contact:
            defaultAddress?.phone ||
            '',
        },

        notes: {
          user_id:
            String(userId),

          address_id:
            String(addressId),
        },

        theme: {
          color:
            '#6f38dc',
        },
      };

      const paymentResult =
        await RazorpayCheckout.open(
          options as any
        );

      console.log(
        'RAZORPAY PAYMENT RESULT:',
        paymentResult
      );

      return verifyRazorpayPayment({
        userId,
        addressId,
        orderItems,

        razorpay_order_id:
          paymentResult.razorpay_order_id,

        razorpay_payment_id:
          paymentResult.razorpay_payment_id,

        razorpay_signature:
          paymentResult.razorpay_signature,
      });
    };

  // =====================================================
  // FINISH ORDER
  // =====================================================

  const finishOrder =
    (orderId: string | number) => {
      console.log(
        'ORDER CREATED:',
        orderId
      );

      const createdTotal =
        String(total);

      if (!isBuyNow) {
        clearCart();
      }

      router.replace({
        pathname:
          '/order-success',

        params: {
          orderId:
            String(orderId),

          total:
            createdTotal,
        },
      } as any);
    };

  // =====================================================
  // VALIDATE
  // =====================================================

  const validateCheckout =
    async () => {
      const user =
        await getUser();

      if (!user?.id) {
        setErrors({
          general:
            'Please login before placing an order.',
        });

        return null;
      }

      const token =
        await getAuthToken();

      if (!token) {
        setErrors({
          general:
            'Your login session has expired. Please login again.',
        });

        return null;
      }

      if (!defaultAddress) {
        setErrors({
          general:
            'Please add a delivery address before placing your order.',
        });

        return null;
      }

      if (!email.trim()) {
        setErrors({
          email:
            'Email is required.',
        });

        return null;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email.trim()
        )
      ) {
        setErrors({
          email:
            'Enter a valid email address.',
        });

        return null;
      }

      if (
        safeCart.length === 0
      ) {
        setErrors({
          general:
            'Your cart is empty.',
        });

        return null;
      }

      for (const item of safeCart) {
        if (
          Number(
            item?.quantity || 0
          ) <= 0
        ) {
          setErrors({
            general:
              'Invalid product quantity.',
          });

          return null;
        }

        if (
          getProductId(item) <= 0
        ) {
          setErrors({
            general:
              'Invalid product information. Please remove the item and add it again.',
          });

          return null;
        }
      }

      setErrors({});

      return user;
    };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const handlePlaceOrder =
    async () => {
      if (loading) return;

      const user =
        await validateCheckout();

      if (
        !user ||
        !defaultAddress
      ) {
        return;
      }

      try {
        setLoading(true);
        setErrors({});

        const userId =
          Number(user.id);

        const addressId =
          Number(
            defaultAddress.id
          );

        const orderItems =
          prepareOrderItems();

        // ================= COD =================

        if (
          paymentMethod === 'cod'
        ) {
          const orderData =
            await createCODOrder(
              userId,
              addressId,
              orderItems
            );

          const orderId =
            orderData?.order_id ??
            orderData?.order?.id;

          if (!orderId) {
            throw new Error(
              'Order ID was not returned.'
            );
          }

          finishOrder(
            orderId
          );

          return;
        }

        // ================= ONLINE =================

        const verified =
          await startRazorpayPayment({
            userId,
            addressId,
            orderItems,
          });

        const orderId =
          verified?.order_id ??
          verified?.order?.id;

        if (!orderId) {
          throw new Error(
            'Payment order was not created correctly.'
          );
        }

        finishOrder(
          orderId
        );

      } catch (error: any) {
        console.error(
          'CHECKOUT ERROR:',
          error
        );

        const cancelled =
          error?.code === 2 ||
          String(
            error?.description || ''
          )
            .toLowerCase()
            .includes('cancel');

        if (cancelled) {
          setErrors({
            general:
              'Payment was cancelled. Your order was not placed.',
          });
        } else {
          setErrors({
            general:
              error?.message ||
              error?.description ||
              'Unable to place order. Please try again.',
          });
        }

      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // HEADER
  // =====================================================

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
        disabled={loading}
      >
        <Text style={styles.backText}>
          ‹
        </Text>
      </TouchableOpacity>

      <View
        style={styles.headerTextBox}
      >
        <Text
          style={styles.headerTitle}
        >
          Checkout
        </Text>

        <Text
          style={styles.headerSubtitle}
        >
          Review your order and complete
          your purchase
        </Text>
      </View>
    </View>
  );

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (
    safeCart.length === 0
  ) {
    return (
      <View
        style={styles.container}
      >
        {header}

        <View
          style={styles.emptyCart}
        >
          <Text
            style={styles.emptyCartIcon}
          >
            🛒
          </Text>

          <Text
            style={styles.emptyCartTitle}
          >
            Your cart is empty
          </Text>

          <Text
            style={styles.emptyCartText}
          >
            Add some products before
            proceeding to checkout.
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      {header}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* ================= DELIVERY ADDRESS ================= */}

        <View
          style={styles.card}
        >
          <View
            style={styles.cardTitleRow}
          >
            <View>
              <Text
                style={
                  styles.sectionLabel
                }
              >
                DELIVERY
              </Text>

              <Text
                style={
                  styles.cardTitle
                }
              >
                Delivery Address
              </Text>
            </View>

            {defaultAddress && (
              <Text
                style={
                  styles.defaultBadge
                }
              >
                ⭐ Default
              </Text>
            )}
          </View>

          {/* LOADING */}

          {addressLoading ? (
            <View
              style={
                styles.centerBox
              }
            >
              <ActivityIndicator
                size="small"
                color="#7c3aed"
              />

              <Text
                style={
                  styles.mutedText
                }
              >
                Loading your saved
                address...
              </Text>
            </View>

          ) : defaultAddress ? (

            /* ADDRESS FOUND */

            <View
              style={
                styles.addressCard
              }
            >
              <View
                style={
                  styles.addressTop
                }
              >
                <Text
                  style={
                    styles.addressIcon
                  }
                >
                  🏠
                </Text>

                <View
                  style={
                    styles.flex1
                  }
                >
                  <Text
                    style={
                      styles.addressName
                    }
                  >
                    {
                      defaultAddress.full_name
                    }
                  </Text>

                  <Text
                    style={
                      styles.addressPhone
                    }
                  >
                    ☎{' '}
                    {
                      defaultAddress.phone
                    }
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.addressLine
                }
              >
                📍{' '}
                {
                  defaultAddress.address_line
                }
              </Text>

              <View
                style={
                  styles.tagsRow
                }
              >
                {!!defaultAddress.city && (
                  <Text
                    style={styles.tag}
                  >
                    🏙{' '}
                    {
                      defaultAddress.city
                    }
                  </Text>
                )}

                {!!defaultAddress.state && (
                  <Text
                    style={styles.tag}
                  >
                    🗺{' '}
                    {
                      defaultAddress.state
                    }
                  </Text>
                )}

                {!!defaultAddress.pincode && (
                  <Text
                    style={styles.tag}
                  >
                    📌{' '}
                    {
                      defaultAddress.pincode
                    }
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.manageBox
                }
              >
                <View
                  style={
                    styles.flex1
                  }
                >
                  <Text
                    style={
                      styles.manageTitle
                    }
                  >
                    ⭐ Default delivery
                    address
                  </Text>

                  <Text
                    style={
                      styles.manageText
                    }
                  >
                    This address will be
                    used for your order.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={
                    onManageAddresses
                  }
                  disabled={loading}
                >
                  <Text
                    style={
                      styles.manageLink
                    }
                  >
                    Manage Addresses →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          ) : (

            /* NO ADDRESS */

            <View
              style={
                styles.centerBox
              }
            >
              <Text
                style={
                  styles.noAddressIcon
                }
              >
                📍
              </Text>

              <Text
                style={
                  styles.noAddressTitle
                }
              >
                No default address
              </Text>

              <Text
                style={
                  styles.mutedText
                }
              >
                Add a delivery address
                before placing your
                order.
              </Text>

              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={
                  onManageAddresses
                }
                disabled={loading}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  + Add Address
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMAIL */}

          <View
            style={styles.emailBox}
          >
            <Text
              style={styles.label}
            >
              Email Address{' '}
              <Text
                style={
                  styles.required
                }
              >
                *
              </Text>
            </Text>

            <TextInput
              style={[
                styles.input,
                !!errors.email &&
                  styles.inputError,
              ]}
              value={email}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onChangeText={(text) => {
                setEmail(text);

                setErrors(
                  (previous) => ({
                    ...previous,
                    email: '',
                    general: '',
                  })
                );
              }}
            />

            {!!errors.email && (
              <Text
                style={
                  styles.errorText
                }
              >
                {errors.email}
              </Text>
            )}
          </View>
        </View>

        {/* ================= PAYMENT ================= */}

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.sectionLabel
            }
          >
            PAYMENT
          </Text>

          <Text
            style={[
              styles.cardTitle,
              styles.mb12,
            ]}
          >
            Payment Method
          </Text>

          {/* COD */}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' &&
                styles.paymentOptionActive,
            ]}
            disabled={loading}
            activeOpacity={0.8}
            onPress={() => {
              setPaymentMethod(
                'cod'
              );

              setErrors({});
            }}
          >
            <Text
              style={
                styles.paymentIcon
              }
            >
              💵
            </Text>

            <View
              style={
                styles.flex1
              }
            >
              <Text
                style={
                  styles.paymentTitle
                }
              >
                Cash on Delivery
              </Text>

              <Text
                style={
                  styles.paymentSubtext
                }
              >
                Pay when your order
                arrives
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  'cod' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod ===
                'cod' && (
                <View
                  style={
                    styles.radioDot
                  }
                />
              )}
            </View>
          </TouchableOpacity>

          {/* ONLINE */}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'online' &&
                styles.paymentOptionActive,
            ]}
            disabled={loading}
            activeOpacity={0.8}
            onPress={() => {
              setPaymentMethod(
                'online'
              );

              setErrors({});
            }}
          >
            <Text
              style={
                styles.paymentIcon
              }
            >
              💳
            </Text>

            <View
              style={
                styles.flex1
              }
            >
              <Text
                style={
                  styles.paymentTitle
                }
              >
                Online Payment
              </Text>

              <Text
                style={
                  styles.paymentSubtext
                }
              >
                UPI, Cards, Net Banking
                and more
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  'online' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod ===
                'online' && (
                <View
                  style={
                    styles.radioDot
                  }
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= ERROR ================= */}

        {!!errors.general && (
          <View
            style={
              styles.generalError
            }
          >
            <Text
              style={
                styles.generalErrorText
              }
            >
              ⚠️ {errors.general}
            </Text>
          </View>
        )}

        {/* ================= ORDER SUMMARY ================= */}

        <View
          style={styles.card}
        >
          <View
            style={
              styles.cardTitleRow
            }
          >
            <View>
              <Text
                style={
                  styles.sectionLabel
                }
              >
                YOUR ORDER
              </Text>

              <Text
                style={
                  styles.cardTitle
                }
              >
                Order Summary
              </Text>
            </View>

            <Text
              style={
                styles.itemCount
              }
            >
              {safeCart.length}{' '}
              {safeCart.length === 1
                ? 'item'
                : 'items'}
            </Text>
          </View>

          {safeCart.map(
            (item, index) => {
              const itemTotal =
                Number(
                  item?.price || 0
                ) *
                Number(
                  item?.quantity || 1
                );

              const imageUri =
                item?.image ||
                item?.product_image ||
                '';

              return (
                <View
                  key={String(
                    item?.id ??
                      item?.product_id ??
                      index
                  )}
                  style={
                    styles.productRow
                  }
                >
                  {imageUri ? (
                    <Image
                      source={{
                        uri: imageUri,
                      }}
                      style={
                        styles.productImage
                      }
                    />
                  ) : (
                    <View
                      style={[
                        styles.productImage,
                        styles.imagePlaceholder,
                      ]}
                    >
                      <Text>
                        🛍️
                      </Text>
                    </View>
                  )}

                  <View
                    style={
                      styles.productInfo
                    }
                  >
                    <Text
                      style={
                        styles.productName
                      }
                      numberOfLines={2}
                    >
                      {item?.name ||
                        'Product'}
                    </Text>

                    {!!item?.selected_size && (
                      <Text
                        style={
                          styles.productMeta
                        }
                      >
                        Size:{' '}
                        {
                          item.selected_size
                        }
                      </Text>
                    )}

                    <Text
                      style={
                        styles.productMeta
                      }
                    >
                      Qty:{' '}
                      {
                        item?.quantity ||
                        1
                      }
                    </Text>

                    {!!item?.variant_id && (
                      <Text
                        style={
                          styles.productVariant
                        }
                      >
                        Variant ID:{' '}
                        {
                          item.variant_id
                        }
                      </Text>
                    )}
                  </View>

                  <Text
                    style={
                      styles.productPrice
                    }
                  >
                    ₹
                    {money(
                      itemTotal
                    )}
                  </Text>
                </View>
              );
            }
          )}

          <View
            style={
              styles.divider
            }
          />

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Subtotal
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              ₹{money(subtotal)}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Delivery
            </Text>

            <Text
              style={[
                styles.summaryValue,
                deliveryFee === 0 &&
                  styles.freeText,
              ]}
            >
              {deliveryFee === 0
                ? 'FREE'
                : `₹${deliveryFee}`}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              GST
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              ₹
              {money(
                gstAmount,
                true
              )}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Platform Fee
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              ₹
              {money(
                platformFee
              )}
            </Text>
          </View>

          <Text
            style={
              styles.feeNote
            }
          >
            ℹ️ Platform fee helps us
            maintain secure and reliable
            shopping services.
          </Text>

          <View
            style={
              styles.divider
            }
          />

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.totalLabel
              }
            >
              Total Amount
            </Text>

            <Text
              style={
                styles.totalValue
              }
            >
              ₹
              {money(
                total,
                true
              )}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              (loading ||
                addressLoading ||
                !defaultAddress) &&
                styles.disabledButton,
            ]}
            onPress={
              handlePlaceOrder
            }
            disabled={
              loading ||
              addressLoading ||
              !defaultAddress
            }
            activeOpacity={0.8}
          >
            {loading ? (
              <View
                style={
                  styles.row
                }
              >
                <ActivityIndicator
                  color="#fff"
                />

                <Text
                  style={[
                    styles.placeOrderText,
                    styles.ml8,
                  ]}
                >
                  {paymentMethod ===
                  'online'
                    ? 'Opening Payment...'
                    : 'Placing Order...'}
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.placeOrderText
                }
              >
                {paymentMethod ===
                'online'
                  ? 'Pay Securely'
                  : 'Place Order'}
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={
              styles.securityText
            }
          >
            🔒 Secure payment powered
            by Razorpay Test Environment.
          </Text>
        </View>

        <View
          style={{
            height: 40,
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  scroll: {
    flex: 1,
  },

  flex1: {
    flex: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ml8: {
    marginLeft: 8,
  },

  mb12: {
    marginBottom: 12,
  },

  // HEADER

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 32,
    color: '#222',
    marginTop: -4,
  },

  headerTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  // CARDS

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 13,
  },

  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
    letterSpacing: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181818',
    marginTop: 2,
  },

  defaultBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
    backgroundColor: '#f3ecff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },

  centerBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  mutedText: {
    color: '#777',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  // ADDRESS

  addressCard: {
    borderWidth: 1,
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
    borderRadius: 11,
    padding: 12,
  },

  addressTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  addressIcon: {
    fontSize: 24,
    marginRight: 10,
  },

  addressName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  addressPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  addressLine: {
    fontSize: 12,
    color: '#444',
    marginTop: 10,
    lineHeight: 18,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  tag: {
    fontSize: 11,
    color: '#555',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eadfff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },

  manageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eadfff',
  },

  manageTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#222',
  },

  manageText: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  manageLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7c3aed',
    marginLeft: 8,
  },

  noAddressIcon: {
    fontSize: 28,
  },

  noAddressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
    marginTop: 4,
  },

  // EMAIL

  emailBox: {
    marginTop: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },

  required: {
    color: '#e11d48',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 13,
    color: '#222',
    backgroundColor: '#fff',
  },

  inputError: {
    borderColor: '#e11d48',
  },

  errorText: {
    color: '#e11d48',
    fontSize: 11,
    marginTop: 4,
  },

  // PAYMENT

  paymentOption: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  paymentOptionActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
  },

  paymentIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  paymentSubtext: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioActive: {
    borderColor: '#7c3aed',
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },

  // ERROR

  generalError: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 12,
  },

  generalErrorText: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '700',
  },

  // SUMMARY

  itemCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  productImage: {
    width: 56,
    height: 56,
    borderRadius: 9,
    backgroundColor: '#f2f2f2',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },

  productMeta: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  productVariant: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#555',
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },

  freeText: {
    color: '#16a34a',
  },

  feeNote: {
    fontSize: 10,
    color: '#888',
    marginTop: 6,
    lineHeight: 15,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },

  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111',
  },

  // BUTTONS

  placeOrderButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeOrderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.5,
  },

  securityText: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },

  primaryButton: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // EMPTY CART

  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyCartIcon: {
    fontSize: 48,
  },

  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    marginTop: 10,
  },

  emptyCartText: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
});