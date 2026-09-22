import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

/* =====================================================
   TYPES
===================================================== */

type Order = {
  id: number;

  user_id?: number;
  address_id?: number;

  total_amount?: number | string;
  total?: number | string;

  payment_method?: string;
  paymentMethod?: string;
  payment_status?: string;

  order_status?: string;
  delivery_status?: string;

  created_at?: string;

  full_name?: string;
  phone?: string;

  address_line?: string;
  address?: string;
  street?: string;
  address1?: string;
  address2?: string;

  city?: string;
  district?: string;
  state?: string;

  pincode?: string;
  postal_code?: string;
  zipcode?: string;
  zip_code?: string;

  address_name?: string;
  address_phone?: string;

  customer_name?: string;
  customer_phone?: string;

  user_name?: string;
  user_phone?: string;

  shipping_address?: string | object;

  return_status?: string | null;
  return_reason?: string | null;
  return_requested_at?: string | null;

  cancellation_reason?: string | null;

  items?: any;
  order_items?: any;
  products?: any;

  [key: string]: any;
};

type Address = {
  id: number | string;

  full_name?: string;
  phone?: string;

  address_line?: string;
  address?: string;
  street?: string;
  area?: string;

  city?: string;
  district?: string;
  state?: string;

  pincode?: string;
  postal_code?: string;
  zipcode?: string;
  zip_code?: string;

  [key: string]: any;
};

type FeedbackProduct = {
  product_id: number;
  product_name: string;
  product_image: string;

  [key: string]: any;
};

/* =====================================================
   CONSTANTS
===================================================== */

const trackingSteps = [
  'Placed',
  'Confirmed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const cancelReasons = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price',
  'Delivery is taking too long',
  'I want to change the order',
  'Other',
];

const returnReasons = [
  'Received damaged product',
  'Wrong product received',
  'Product quality is not good',
  'Product does not match description',
  'Received incomplete product',
  'Other',
];

/* =====================================================
   RETURN HELPERS
===================================================== */

const getReturnStorageKey = (
  orderId: number | string
) => {
  return `return_requested_${String(orderId)}`;
};

const normalizeReturnStatus = (
  value: unknown
) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
};

const getReturnStatusLabel = (
  value: unknown
) => {
  const status =
    normalizeReturnStatus(value);

  if (
    status === 'requested' ||
    status === 'return requested'
  ) {
    return 'Requested';
  }

  if (
    status === 'pickup scheduled'
  ) {
    return 'Pickup Scheduled';
  }

  if (
    status === 'picked up'
  ) {
    return 'Picked Up';
  }

  if (
    status === 'return completed' ||
    status === 'returned' ||
    status === 'completed'
  ) {
    return 'Return Completed';
  }

  return (
    String(value || '').trim() ||
    'Requested'
  );
};

const isReturnCompletedStatus = (
  value: unknown
) => {
  const status =
    normalizeReturnStatus(value);

  return (
    status === 'return completed' ||
    status === 'returned' ||
    status === 'completed' ||
    status.includes('return completed')
  );
};

const hasAnyReturnStatus = (
  value: unknown
) => {
  const status =
    normalizeReturnStatus(value);

  return (
    status === 'requested' ||
    status === 'return requested' ||
    status === 'pickup scheduled' ||
    status === 'picked up' ||
    status === 'return completed' ||
    status === 'returned' ||
    status === 'completed' ||
    status.includes('return completed')
  );
};

/* =====================================================
   LOCAL RETURN STORAGE
===================================================== */

const saveReturnLocally = async (
  orderId: number | string,
  reason: string,
  status = 'Requested'
) => {
  try {
    await AsyncStorage.setItem(
      getReturnStorageKey(orderId),
      JSON.stringify({
        requested: true,
        status: getReturnStatusLabel(status),
        reason,
      })
    );
  } catch (error) {
    console.log(
      'SAVE RETURN LOCAL ERROR:',
      error
    );
  }
};

const getLocalReturn = async (
  orderId: number | string
) => {
  try {
    const saved =
      await AsyncStorage.getItem(
        getReturnStorageKey(orderId)
      );

    if (!saved) {
      return null;
    }

    const parsed =
      JSON.parse(saved);

    return parsed?.requested
      ? parsed
      : null;
  } catch (error) {
    console.log(
      'GET RETURN LOCAL ERROR:',
      error
    );

    return null;
  }
};

/* =====================================================
   EXTRACT ORDER
===================================================== */

const extractOrderFromResponse = (
  data: any
): Order | null => {
  if (
    data?.order &&
    typeof data.order === 'object'
  ) {
    return data.order;
  }

  if (
    data?.data?.order &&
    typeof data.data.order === 'object'
  ) {
    return data.data.order;
  }

  if (
    Array.isArray(data?.orders) &&
    data.orders.length > 0
  ) {
    return data.orders[0];
  }

  if (
    data?.data &&
    typeof data.data === 'object' &&
    data.data.id
  ) {
    return data.data;
  }

  if (data?.id) {
    return data;
  }

  return null;
};

/* =====================================================
   SCREEN
===================================================== */

export default function OrderTrackingScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  /* ===================================================
     ORDER STATE
  =================================================== */

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* ===================================================
     CANCEL STATE
  =================================================== */

  const [
    showCancelModal,
    setShowCancelModal,
  ] = useState(false);

  const [
    cancelReason,
    setCancelReason,
  ] = useState('');

  const [
    otherCancelReason,
    setOtherCancelReason,
  ] = useState('');

  const [
    loadingCancel,
    setLoadingCancel,
  ] = useState(false);

  /* ===================================================
     RETURN STATE
  =================================================== */

  const [
    showReturnModal,
    setShowReturnModal,
  ] = useState(false);

  const [
    returnReason,
    setReturnReason,
  ] = useState('');

  const [
    otherReturnReason,
    setOtherReturnReason,
  ] = useState('');

  const [
    loadingReturn,
    setLoadingReturn,
  ] = useState(false);

  /* ===================================================
     FEEDBACK STATE
     
     IMPORTANT:
     ALL HOOKS ARE HERE BEFORE ANY RETURN.
  =================================================== */

  const [
    showFeedbackModal,
    setShowFeedbackModal,
  ] = useState(false);

  const [
    feedbackProducts,
    setFeedbackProducts,
  ] = useState<FeedbackProduct[]>([]);

  const [
    feedbackProduct,
    setFeedbackProduct,
  ] = useState<FeedbackProduct | null>(
    null
  );

  const [
    feedbackRating,
    setFeedbackRating,
  ] = useState(0);

  const [
    feedbackText,
    setFeedbackText,
  ] = useState('');

  const [
    loadingFeedback,
    setLoadingFeedback,
  ] = useState(false);

  const [
    reviewedProducts,
    setReviewedProducts,
  ] = useState<{
    [key: number]: boolean;
  }>({});

  const [
    loadingReviewCheck,
    setLoadingReviewCheck,
  ] = useState(false);

  /* ===================================================
     LOAD ORDER
  =================================================== */

  const loadOrder = useCallback(
    async (
      showFullLoader = false
    ) => {
      try {
        if (showFullLoader) {
          setLoading(true);
        }

        setError('');

        const savedUser =
          await AsyncStorage.getItem(
            'loggedInUser'
          );

        const token =
          await AsyncStorage.getItem(
            'authToken'
          );

        if (!savedUser) {
          setError(
            'Please login to view this order.'
          );

          return;
        }

        if (!token) {
          setError(
            'Login session expired. Please login again.'
          );

          return;
        }

        let user: any;

        try {
          user =
            JSON.parse(savedUser);
        } catch {
          setError(
            'Login session is invalid.'
          );

          return;
        }

        const userId =
          Number(user?.id);

        if (!userId || !id) {
          setError(
            'Unable to identify the order.'
          );

          return;
        }

        /* ---------------------------------------------
           CUSTOMER ORDERS
        --------------------------------------------- */

        const listResponse =
          await fetch(
            `${API_BASE_URL}/api/orders/user/${userId}`,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                'x-user-id':
                  String(userId),

                'Content-Type':
                  'application/json',
              },
            }
          );

        let listData: any = {};

        try {
          listData =
            await listResponse.json();
        } catch {
          listData = {};
        }

        if (!listResponse.ok) {
          throw new Error(
            listData?.message ||
              'Failed to load orders.'
          );
        }

        const orders: Order[] =
          Array.isArray(
            listData?.orders
          )
            ? listData.orders
            : [];

        let foundOrder =
          orders.find(
            (item) =>
              String(item.id) ===
              String(id)
          ) || null;

        /* ---------------------------------------------
           SINGLE ORDER
        --------------------------------------------- */

        try {
          const singleResponse =
            await fetch(
              `${API_BASE_URL}/api/orders/${id}`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  'x-user-id':
                    String(userId),

                  'Content-Type':
                    'application/json',
                },
              }
            );

          let singleData: any = {};

          try {
            singleData =
              await singleResponse.json();
          } catch {
            singleData = {};
          }

          if (
            singleResponse.ok
          ) {
            const singleOrder =
              extractOrderFromResponse(
                singleData
              );

            if (singleOrder) {
              foundOrder =
                foundOrder
                  ? {
                      ...foundOrder,
                      ...singleOrder,
                    }
                  : singleOrder;
            }
          }
        } catch (singleError) {
          console.log(
            'SINGLE ORDER LOAD FAILED:',
            singleError
          );
        }

        if (!foundOrder) {
          setError(
            'Order not found.'
          );

          setOrder(null);

          return;
        }

        /* ---------------------------------------------
           ADDRESS
        --------------------------------------------- */

        try {
          const addressResponse =
            await fetch(
              `${API_BASE_URL}/api/addresses/${userId}`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  'x-user-id':
                    String(userId),

                  'Content-Type':
                    'application/json',
                },
              }
            );

          let addressData: any = {};

          try {
            addressData =
              await addressResponse.json();
          } catch {
            addressData = {};
          }

          if (
            addressResponse.ok
          ) {
            const addresses:
              Address[] =
              Array.isArray(
                addressData?.addresses
              )
                ? addressData.addresses
                : [];

            const matchedAddress =
              addresses.find(
                (address) =>
                  String(address.id) ===
                  String(
                    foundOrder?.address_id
                  )
              );

            if (
              matchedAddress
            ) {
              foundOrder = {
                ...foundOrder,

                full_name:
                  matchedAddress.full_name ||
                  foundOrder.full_name ||
                  '',

                phone:
                  matchedAddress.phone ||
                  foundOrder.phone ||
                  '',

                address_line:
                  matchedAddress.address_line ||
                  matchedAddress.address ||
                  matchedAddress.street ||
                  foundOrder.address_line ||
                  '',

                address:
                  matchedAddress.address ||
                  matchedAddress.address_line ||
                  foundOrder.address ||
                  '',

                street:
                  matchedAddress.street ||
                  foundOrder.street ||
                  '',

                city:
                  matchedAddress.city ||
                  foundOrder.city ||
                  '',

                district:
                  matchedAddress.district ||
                  matchedAddress.city ||
                  foundOrder.district ||
                  '',

                state:
                  matchedAddress.state ||
                  foundOrder.state ||
                  '',

                pincode:
                  matchedAddress.pincode ||
                  matchedAddress.postal_code ||
                  matchedAddress.zipcode ||
                  matchedAddress.zip_code ||
                  foundOrder.pincode ||
                  '',

                postal_code:
                  matchedAddress.postal_code ||
                  foundOrder.postal_code ||
                  '',

                address_name:
                  matchedAddress.full_name ||
                  foundOrder.address_name ||
                  '',

                address_phone:
                  matchedAddress.phone ||
                  foundOrder.address_phone ||
                  '',
              };
            }
          }
        } catch (addressError) {
          console.log(
            'ADDRESS LOAD ERROR:',
            addressError
          );
        }

        /* ---------------------------------------------
           LOCAL RETURN FALLBACK
        --------------------------------------------- */

        const backendReturnStatus =
          String(
            foundOrder.return_status ||
              ''
          ).trim();

        const localReturn =
          await getLocalReturn(
            foundOrder.id
          );

        if (
          !backendReturnStatus &&
          localReturn?.requested
        ) {
          foundOrder = {
            ...foundOrder,

            return_status:
              localReturn.status ||
              'Requested',

            return_reason:
              foundOrder.return_reason ||
              localReturn.reason ||
              '',
          };
        }

        setOrder(
          foundOrder
        );
      } catch (err: any) {
        console.error(
          'LOAD ORDER ERROR:',
          err
        );

        setError(
          err?.message ||
            'Unable to load order tracking.'
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    loadOrder(true);
  }, [loadOrder]);

  /* ===================================================
     REFRESH ON FOCUS
  =================================================== */

  useFocusEffect(
    useCallback(() => {
      loadOrder(false);
    }, [loadOrder])
  );

  /* ===================================================
     AUTO REFRESH
  =================================================== */

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadOrder(false);
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [loadOrder]);

  /* ===================================================
     FEEDBACK ORDER STATUS
     
     This works even before order is loaded.
  =================================================== */

  const feedbackOrderStatus =
    String(
      order?.order_status || ''
    )
      .trim()
      .toLowerCase();

  const feedbackIsDelivered =
    feedbackOrderStatus ===
    'delivered';

  /* ===================================================
     GET PRODUCTS FOR FEEDBACK
  =================================================== */

  const getFeedbackOrderProducts =
    useCallback(() => {
      if (!order) {
        return [];
      }

      let items =
        order?.items ||
        order?.order_items ||
        order?.products ||
        [];

      if (
        typeof items ===
        'string'
      ) {
        try {
          items =
            JSON.parse(items);
        } catch (parseError) {
          console.error(
            'FAILED TO PARSE FEEDBACK PRODUCTS:',
            parseError
          );

          items = [];
        }
      }

      if (
        !Array.isArray(items)
      ) {
        items = [];
      }

      return items;
    }, [
      order,
    ]);

  /* ===================================================
     PREPARE FEEDBACK PRODUCTS
  =================================================== */

  useEffect(() => {
    if (
      !feedbackIsDelivered ||
      !order
    ) {
      setFeedbackProducts([]);
      setReviewedProducts({});
      return;
    }

    const products =
      getFeedbackOrderProducts();

    const normalizedProducts =
      products
        .map(
          (
            item: any,
            index: number
          ) => {
            const productId =
              item?.product_id ??
              item?.productId ??
              item?.id;

            if (!productId) {
              return null;
            }

            return {
              ...item,

              product_id:
                Number(productId),

              product_name:
                item?.product_name ||
                item?.productName ||
                item?.name ||
                `Product ${index + 1}`,

              product_image:
                item?.product_image ||
                item?.productImage ||
                item?.image ||
                '',
            };
          }
        )
        .filter(
          Boolean
        ) as FeedbackProduct[];

    setFeedbackProducts(
      normalizedProducts
    );

    setReviewedProducts({});
  }, [
    order?.id,
    feedbackIsDelivered,
    getFeedbackOrderProducts,
  ]);

  /* ===================================================
     CHECK EXISTING REVIEWS
  =================================================== */

  const checkExistingReviews =
    useCallback(
      async () => {
        if (
          !feedbackIsDelivered ||
          !order?.id
        ) {
          return;
        }

        const products =
          getFeedbackOrderProducts();

        if (
          !products.length
        ) {
          return;
        }

        const token =
          await AsyncStorage.getItem(
            'authToken'
          );

        if (!token) {
          return;
        }

        try {
          setLoadingReviewCheck(
            true
          );

          const reviewStatus: {
            [key: number]: boolean;
          } = {};

          for (
            const item of products
          ) {
            const productId =
              item?.product_id ??
              item?.productId ??
              item?.id;

            if (!productId) {
              continue;
            }

            try {
              const response =
                await fetch(
                  `${API_BASE_URL}/api/reviews/check/${order.id}/${productId}`,
                  {
                    method: 'GET',

                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                    },
                  }
                );

              let data: any =
                {};

              try {
                data =
                  await response.json();
              } catch {
                data = {};
              }

              reviewStatus[
                Number(productId)
              ] = Boolean(
                data?.reviewed
              );
            } catch (
              reviewError
            ) {
              console.log(
                'REVIEW CHECK ERROR:',
                reviewError
              );

              reviewStatus[
                Number(productId)
              ] = false;
            }
          }

          setReviewedProducts(
            reviewStatus
          );
        } catch (
          reviewStatusError
        ) {
          console.log(
            'REVIEW STATUS ERROR:',
            reviewStatusError
          );
        } finally {
          setLoadingReviewCheck(
            false
          );
        }
      },
      [
        order?.id,
        feedbackIsDelivered,
        getFeedbackOrderProducts,
      ]
    );

  useEffect(() => {
    checkExistingReviews();
  }, [
    checkExistingReviews,
  ]);

  /* ===================================================
     ALL PRODUCTS REVIEWED
  =================================================== */

  const allProductsReviewed =
    feedbackProducts.length > 0 &&
    feedbackProducts.every(
      (product) =>
        Boolean(
          reviewedProducts[
            product.product_id
          ]
        )
    );

  /* ===================================================
     OPEN FEEDBACK
  =================================================== */

  const openFeedback = () => {
    if (
      !feedbackProducts.length
    ) {
      Alert.alert(
        'Feedback',
        'Product information is not available for this order.'
      );

      return;
    }

    const availableProducts =
      feedbackProducts.filter(
        (product) =>
          !reviewedProducts[
            product.product_id
          ]
      );

    if (
      !availableProducts.length
    ) {
      return;
    }

    setFeedbackProduct(
      availableProducts[0]
    );

    setFeedbackRating(0);

    setFeedbackText('');

    setShowFeedbackModal(
      true
    );
  };

  /* ===================================================
     SELECT FEEDBACK PRODUCT
  =================================================== */

  const selectFeedbackProduct =
    (
      product: FeedbackProduct
    ) => {
      if (
        reviewedProducts[
          product.product_id
        ]
      ) {
        return;
      }

      setFeedbackProduct(
        product
      );

      setFeedbackRating(0);

      setFeedbackText('');
    };

  /* ===================================================
     SUBMIT FEEDBACK
  =================================================== */

  const handleSubmitFeedback =
    async () => {
      if (!feedbackProduct) {
        Alert.alert(
          'Feedback',
          'Please select a product.'
        );

        return;
      }

      if (!feedbackRating) {
        Alert.alert(
          'Feedback',
          'Please select a rating.'
        );

        return;
      }

      if (
        !feedbackText.trim()
      ) {
        Alert.alert(
          'Feedback',
          'Please write your feedback.'
        );

        return;
      }

      const token =
        await AsyncStorage.getItem(
          'authToken'
        );

      if (!token) {
        Alert.alert(
          'Login Required',
          'Please login again to submit feedback.'
        );

        return;
      }

      try {
        setLoadingFeedback(
          true
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/reviews`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  product_id:
                    feedbackProduct.product_id,

                  order_id:
                    order?.id,

                  rating:
                    feedbackRating,

                  feedback:
                    feedbackText.trim(),
                }),
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        console.log(
          'FEEDBACK RESPONSE:',
          data
        );

        if (
          !response.ok ||
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              'Failed to submit feedback.'
          );
        }

        const productId =
          feedbackProduct.product_id;

        setReviewedProducts(
          (previous) => ({
            ...previous,

            [productId]:
              true,
          })
        );

        setShowFeedbackModal(
          false
        );

        setFeedbackProduct(
          null
        );

        setFeedbackRating(
          0
        );

        setFeedbackText('');

        Alert.alert(
          'Feedback Submitted',
          'Thank you for your feedback!'
        );
      } catch (
        feedbackError: any
      ) {
        console.error(
          'FEEDBACK SUBMISSION ERROR:',
          feedbackError
        );

        Alert.alert(
          'Feedback Failed',
          feedbackError?.message ||
            'Failed to submit feedback.'
        );
      } finally {
        setLoadingFeedback(
          false
        );
      }
    };

  /* ===================================================
     CANCEL ORDER
  =================================================== */

  const handleCancelOrder =
    async () => {
      const finalReason =
        cancelReason === 'Other'
          ? otherCancelReason.trim()
          : cancelReason;

      if (!finalReason) {
        Alert.alert(
          'Reason Required',
          'Please select a cancellation reason.'
        );

        return;
      }

      try {
        setLoadingCancel(
          true
        );

        const token =
          await AsyncStorage.getItem(
            'authToken'
          );

        const savedUser =
          await AsyncStorage.getItem(
            'loggedInUser'
          );

        if (
          !token ||
          !savedUser
        ) {
          throw new Error(
            'Login session expired. Please login again.'
          );
        }

        const user =
          JSON.parse(
            savedUser
          );

        const userId =
          Number(user?.id);

        const response =
          await fetch(
            `${API_BASE_URL}/api/orders/${order!.id}/cancel`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                'x-user-id':
                  String(userId),
              },

              body:
                JSON.stringify({
                  user_id:
                    userId,

                  reason:
                    finalReason,

                  cancellation_reason:
                    finalReason,
                }),
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (
          !response.ok ||
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              'Failed to cancel order.'
          );
        }

        setShowCancelModal(
          false
        );

        setCancelReason('');

        setOtherCancelReason('');

        await loadOrder(false);

        Alert.alert(
          'Order Cancelled',
          'Your order has been cancelled successfully.'
        );
      } catch (err: any) {
        Alert.alert(
          'Cancel Failed',
          err?.message ||
            'Failed to cancel order.'
        );
      } finally {
        setLoadingCancel(
          false
        );
      }
    };

  /* ===================================================
     RETURN ORDER
  =================================================== */

  const handleReturnOrder =
    async () => {
      const finalReason =
        returnReason === 'Other'
          ? otherReturnReason.trim()
          : returnReason;

      if (!finalReason) {
        Alert.alert(
          'Reason Required',
          'Please select a return reason.'
        );

        return;
      }

      if (
        order &&
        hasAnyReturnStatus(
          order.return_status
        )
      ) {
        setShowReturnModal(
          false
        );

        return;
      }

      try {
        setLoadingReturn(
          true
        );

        const token =
          await AsyncStorage.getItem(
            'authToken'
          );

        const savedUser =
          await AsyncStorage.getItem(
            'loggedInUser'
          );

        if (
          !token ||
          !savedUser
        ) {
          throw new Error(
            'Login session expired. Please login again.'
          );
        }

        const user =
          JSON.parse(
            savedUser
          );

        const userId =
          Number(user?.id);

        const response =
          await fetch(
            `${API_BASE_URL}/api/orders/${order!.id}/return`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                'x-user-id':
                  String(userId),
              },

              body:
                JSON.stringify({
                  user_id:
                    userId,

                  reason:
                    finalReason,

                  return_reason:
                    finalReason,
                }),
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        console.log(
          'RETURN RESPONSE:',
          data
        );

        const message =
          String(
            data?.message || ''
          ).toLowerCase();

        if (
          message.includes(
            'return request already exists'
          )
        ) {
          const existingStatus =
            data?.return_status ||
            data?.order?.return_status ||
            'Requested';

          const existingReason =
            data?.return_reason ||
            data?.order?.return_reason ||
            finalReason;

          setOrder(
            (previous) =>
              previous
                ? {
                    ...previous,

                    return_status:
                      getReturnStatusLabel(
                        existingStatus
                      ),

                    return_reason:
                      existingReason,
                  }
                : previous
          );

          await saveReturnLocally(
            order!.id,
            existingReason,
            existingStatus
          );

          setShowReturnModal(
            false
          );

          setReturnReason('');

          setOtherReturnReason('');

          return;
        }

        if (
          !response.ok ||
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              'Failed to submit return request.'
          );
        }

        const savedReason =
          data?.return_reason ||
          data?.order?.return_reason ||
          finalReason;

        setOrder(
          (previous) =>
            previous
              ? {
                  ...previous,

                  return_status:
                    'Requested',

                  return_reason:
                    savedReason,
                }
              : previous
        );

        await saveReturnLocally(
          order!.id,
          savedReason,
          'Requested'
        );

        setShowReturnModal(
          false
        );

        setReturnReason('');

        setOtherReturnReason('');
      } catch (err: any) {
        Alert.alert(
          'Return Failed',
          err?.message ||
            'Failed to submit return request.'
        );
      } finally {
        setLoadingReturn(
          false
        );
      }
    };

  /* ===================================================
     NOW CONDITIONAL RETURNS
     
     IMPORTANT:
     ALL HOOKS ABOVE THIS LINE.
  =================================================== */

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
          style={
            styles.loadingText
          }
        >
          Loading order tracking...
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={
            styles.errorIcon
          }
        >
          ⚠️
        </Text>

        <Text
          style={
            styles.errorTitle
          }
        >
          Order Not Found
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error ||
            'Unable to find this order.'}
        </Text>

        <TouchableOpacity
          style={
            styles.backHomeButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backHomeText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ===================================================
     ORDER VARIABLES
  =================================================== */

  const currentOrder =
    order;

  const rawStatus =
    String(
      currentOrder.order_status ||
        'Placed'
    ).trim();

  const normalizedStatus =
    rawStatus.toLowerCase();

  const isCancelled =
    normalizedStatus ===
    'cancelled';

  const isDelivered =
    normalizedStatus ===
    'delivered';

  const isShipped =
    normalizedStatus ===
    'shipped';

  const isOutForDelivery =
    normalizedStatus ===
    'out for delivery';

  /* ===================================================
     RETURN STATUS
  =================================================== */

  const returnStatus =
    String(
      currentOrder.return_status ||
        ''
    ).trim();

  const normalizedReturnStatus =
    normalizeReturnStatus(
      returnStatus
    );

  const isReturnRequested =
    normalizedReturnStatus ===
      'requested' ||
    normalizedReturnStatus ===
      'return requested';

  const isReturnPickupScheduled =
    normalizedReturnStatus ===
    'pickup scheduled';

  const isReturnPickedUp =
    normalizedReturnStatus ===
    'picked up';

  const returnCompleted =
    isReturnCompletedStatus(
      returnStatus
    );

  const hasReturnRequest =
    hasAnyReturnStatus(
      returnStatus
    );

  /* ===================================================
     ACTIONS
  =================================================== */

  const canCancel =
    !isCancelled &&
    !isDelivered &&
    !isShipped &&
    !isOutForDelivery;

  const canReturn =
    isDelivered &&
    !hasReturnRequest &&
    !isCancelled;

  /* ===================================================
     TRACKING
  =================================================== */

  const statusMap: {
    [key: string]: number;
  } = {
    placed: 0,
    confirmed: 1,
    shipped: 2,
    'out for delivery': 3,
    delivered: 4,
  };

  const currentStep =
    statusMap[
      normalizedStatus
    ] ?? 0;

  /* ===================================================
     PAYMENT
  =================================================== */

  const paymentMethod =
    String(
      currentOrder.payment_method ||
        currentOrder.paymentMethod ||
        'cod'
    )
      .trim()
      .toLowerCase();

  let paymentText =
    'Cash on Delivery';

  if (
    paymentMethod ===
      'razorpay' ||
    paymentMethod ===
      'online' ||
    paymentMethod ===
      'card' ||
    paymentMethod ===
      'credit' ||
    paymentMethod ===
      'debit'
  ) {
    paymentText =
      'Credit / Debit Card';
  }

  if (
    paymentMethod ===
    'upi'
  ) {
    paymentText =
      'UPI';
  }

  /* ===================================================
     TOTAL
  =================================================== */

  const totalAmount =
    Number(
      currentOrder.total_amount ??
        currentOrder.total ??
        0
    );

  /* ===================================================
     DATE
  =================================================== */

  const orderDate =
    currentOrder.created_at
      ? new Date(
          currentOrder.created_at
        ).toLocaleString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        )
      : '';

  /* ===================================================
     CUSTOMER
  =================================================== */

  const customerName =
    currentOrder.full_name ||
    currentOrder.address_name ||
    currentOrder.customer_name ||
    currentOrder.user_name ||
    'Customer';

  const customerPhone =
    currentOrder.phone ||
    currentOrder.address_phone ||
    currentOrder.customer_phone ||
    currentOrder.user_phone ||
    '';

  /* ===================================================
     ADDRESS
  =================================================== */

  const addressParts = [
    currentOrder.address_line ||
      currentOrder.address ||
      currentOrder.street ||
      currentOrder.address1,

    currentOrder.address2,

    currentOrder.city ||
      currentOrder.district,

    currentOrder.state,

    currentOrder.pincode ||
      currentOrder.postal_code ||
      currentOrder.zipcode ||
      currentOrder.zip_code,
  ].filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
  );

  let customerAddress =
    addressParts.join(
      ', '
    );

  if (
    !customerAddress &&
    currentOrder.shipping_address
  ) {
    try {
      const shippingAddress =
        typeof currentOrder.shipping_address ===
        'string'
          ? JSON.parse(
              currentOrder.shipping_address
            )
          : currentOrder.shipping_address;

      const fallbackParts = [
        shippingAddress?.address_line ||
          shippingAddress?.address ||
          shippingAddress?.street,

        shippingAddress?.area,

        shippingAddress?.address2,

        shippingAddress?.city ||
          shippingAddress?.district,

        shippingAddress?.state,

        shippingAddress?.pincode ||
          shippingAddress?.postal_code ||
          shippingAddress?.zipcode ||
          shippingAddress?.zip_code,
      ].filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ''
      );

      customerAddress =
        fallbackParts.join(
          ', '
        );
    } catch {
      customerAddress =
        String(
          currentOrder.shipping_address
        );
    }
  }

  if (!customerAddress) {
    customerAddress =
      'Address not available';
  }

  /* ===================================================
     UI
  =================================================== */

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
            ‹
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.trackingLabel
            }
          >
            ORDER TRACKING
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            Track Your Order
          </Text>

          <Text
            style={
              styles.headerOrderNumber
            }
          >
            Order #{currentOrder.id}
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

        <View
          style={
            styles.orderCard
          }
        >
          <View
            style={
              styles.orderTop
            }
          >
            <View>
              <Text
                style={
                  styles.orderLabel
                }
              >
                Order Status
              </Text>

              <Text
                style={
                  styles.orderId
                }
              >
                #{currentOrder.id}
              </Text>
            </View>

            <View
              style={
                isCancelled
                  ? styles.cancelledBadge
                  : returnCompleted
                  ? styles.returnedBadge
                  : styles.statusBadge
              }
            >
              <Text
                style={
                  isCancelled
                    ? styles.cancelledText
                    : returnCompleted
                    ? styles.returnedText
                    : styles.statusText
                }
              >
                {isCancelled
                  ? 'Cancelled'
                  : returnCompleted
                  ? 'Returned'
                  : rawStatus}
              </Text>
            </View>
          </View>

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
              Order Date
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {orderDate}
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
              Payment Method
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {paymentText}
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
              Total Amount
            </Text>

            <Text
              style={
                styles.total
              }
            >
              ₹
              {totalAmount.toLocaleString(
                'en-IN'
              )}
            </Text>
          </View>
        </View>

        {/* =================================================
            CANCELLED CARD
        ================================================= */}

        {isCancelled && (
          <View
            style={
              styles.cancelledCard
            }
          >
            <View
              style={
                styles.cancelledCircle
              }
            >
              <Text
                style={
                  styles.cancelledIcon
                }
              >
                ✕
              </Text>
            </View>

            <Text
              style={
                styles.cancelledLabel
              }
            >
              ORDER CANCELLED
            </Text>

            <Text
              style={
                styles.cancelledTitle
              }
            >
              This order has been cancelled
            </Text>

            <Text
              style={
                styles.cancelledDescription
              }
            >
              Your order was cancelled successfully
              and will not be delivered.
            </Text>

            {currentOrder.cancellation_reason ? (
              <View
                style={
                  styles.reasonDisplayCard
                }
              >
                <Text
                  style={
                    styles.reasonDisplayLabel
                  }
                >
                  Cancellation Reason
                </Text>

                <Text
                  style={
                    styles.reasonDisplayText
                  }
                >
                  {
                    currentOrder.cancellation_reason
                  }
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* =================================================
            RETURN COMPLETED
        ================================================= */}

        {returnCompleted &&
          !isCancelled && (
            <View
              style={
                styles.returnedCard
              }
            >
              <View
                style={
                  styles.returnedCircle
                }
              >
                <Text
                  style={
                    styles.returnedIcon
                  }
                >
                  ✓
                </Text>
              </View>

              <Text
                style={
                  styles.returnedLabel
                }
              >
                RETURN COMPLETED
              </Text>

              <Text
                style={
                  styles.returnedTitle
                }
              >
                Order is Returned
              </Text>

              <Text
                style={
                  styles.returnedDescription
                }
              >
                Your product has been successfully
                returned.
              </Text>

              <View
                style={
                  styles.returnStatusBox
                }
              >
                <Text
                  style={
                    styles.returnStatusLabel
                  }
                >
                  RETURN STATUS
                </Text>

                <Text
                  style={
                    styles.returnStatusValue
                  }
                >
                  {
                    getReturnStatusLabel(
                      returnStatus
                    )
                  }
                </Text>
              </View>

              {currentOrder.return_reason ? (
                <View
                  style={
                    styles.returnReasonDisplay
                  }
                >
                  <Text
                    style={
                      styles.returnReasonLabel
                    }
                  >
                    RETURN REASON
                  </Text>

                  <Text
                    style={
                      styles.returnReasonValue
                    }
                  >
                    {
                      currentOrder.return_reason
                    }
                  </Text>
                </View>
              ) : null}
            </View>
          )}

        {/* =================================================
            RETURN REQUEST STATUS
        ================================================= */}

        {isDelivered &&
          hasReturnRequest &&
          !returnCompleted &&
          !isCancelled && (
            <View
              style={
                styles.returnRequestedCard
              }
            >
              <View
                style={
                  styles.returnRequestedIcon
                }
              >
                <Text
                  style={
                    styles.returnRequestedIconText
                  }
                >
                  ↩
                </Text>
              </View>

              <View
                style={
                  styles.returnRequestedContent
                }
              >
                <Text
                  style={
                    styles.returnRequestedLabel
                  }
                >
                  RETURN REQUEST
                </Text>

                <Text
                  style={
                    styles.returnRequestedTitle
                  }
                >
                  Return request submitted
                </Text>

                <Text
                  style={
                    styles.actionDescription
                  }
                >
                  Your return request is currently{' '}
                  <Text
                    style={
                      styles.boldText
                    }
                  >
                    {
                      getReturnStatusLabel(
                        returnStatus
                      )
                    }
                  </Text>
                </Text>

                {currentOrder.return_reason ? (
                  <Text
                    style={
                      styles.returnReasonText
                    }
                  >
                    Reason:{' '}
                    {
                      currentOrder.return_reason
                    }
                  </Text>
                ) : null}
              </View>

              <View
                style={
                  styles.returnStatusPill
                }
              >
                <Text
                  style={
                    styles.returnStatusPillText
                  }
                >
                  {
                    getReturnStatusLabel(
                      returnStatus
                    )
                  }
                </Text>
              </View>
            </View>
          )}

        {/* =================================================
            NORMAL ORDER CONTENT
        ================================================= */}

        {!isCancelled &&
          !returnCompleted && (
            <>
              {/* ORDER TRACKING */}

              <View
                style={
                  styles.trackingCard
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Order Tracking
                </Text>

                {trackingSteps.map(
                  (
                    step,
                    index
                  ) => {
                    const completed =
                      index <=
                      currentStep;

                    const active =
                      index ===
                      currentStep;

                    const isLast =
                      index ===
                      trackingSteps.length -
                        1;

                    return (
                      <View
                        key={step}
                        style={
                          styles.stepRow
                        }
                      >
                        <View
                          style={
                            styles.timeline
                          }
                        >
                          <View
                            style={[
                              styles.circle,

                              completed &&
                                styles.completedCircle,

                              active &&
                                styles.activeCircle,
                            ]}
                          >
                            {completed ? (
                              <Text
                                style={
                                  styles.check
                                }
                              >
                                ✓
                              </Text>
                            ) : (
                              <View
                                style={
                                  styles.smallDot
                                }
                              />
                            )}
                          </View>

                          {!isLast && (
                            <View
                              style={[
                                styles.line,

                                index <
                                  currentStep &&
                                  styles.completedLine,
                              ]}
                            />
                          )}
                        </View>

                        <View
                          style={
                            styles.stepContent
                          }
                        >
                          <Text
                            style={[
                              styles.stepTitle,

                              completed &&
                                styles.completedTitle,
                            ]}
                          >
                            {step}
                          </Text>

                          <Text
                            style={
                              styles.stepDescription
                            }
                          >
                            {index ===
                              0 &&
                              'Your order has been placed successfully.'}

                            {index ===
                              1 &&
                              'Your order has been confirmed.'}

                            {index ===
                              2 &&
                              'Your package has been shipped.'}

                            {index ===
                              3 &&
                              'Your package is on the way to you.'}

                            {index ===
                              4 &&
                              'Your order has been delivered.'}
                          </Text>

                          {active && (
                            <View
                              style={
                                styles.currentBadge
                              }
                            >
                              <Text
                                style={
                                  styles.currentBadgeText
                                }
                              >
                                CURRENT STATUS
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  }
                )}
              </View>

              {/* ADDRESS */}

              <View
                style={
                  styles.addressCard
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Delivery Address
                </Text>

                <View
                  style={
                    styles.addressHeader
                  }
                >
                  <View
                    style={
                      styles.locationCircle
                    }
                  >
                    <Text
                      style={
                        styles.locationIcon
                      }
                    >
                      📍
                    </Text>
                  </View>

                  <View
                    style={
                      styles.addressInfo
                    }
                  >
                    <Text
                      style={
                        styles.addressName
                      }
                    >
                      {customerName}
                    </Text>

                    {customerPhone ? (
                      <Text
                        style={
                          styles.addressPhone
                        }
                      >
                        {customerPhone}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <Text
                  style={
                    styles.addressLine
                  }
                >
                  📍 {customerAddress}
                </Text>
              </View>

              {/* CANCEL */}

              {canCancel && (
                <View
                  style={
                    styles.cancelOrderCard
                  }
                >
                  <View
                    style={
                      styles.actionIconRed
                    }
                  >
                    <Text
                      style={
                        styles.actionIconText
                      }
                    >
                      ✕
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.actionTitle
                    }
                  >
                    Want to cancel this order?
                  </Text>

                  <Text
                    style={
                      styles.actionDescription
                    }
                  >
                    You can cancel this order
                    before it is shipped.
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.cancelButton
                    }
                    onPress={() =>
                      setShowCancelModal(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.cancelButtonText
                      }
                    >
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* SHIPPING */}

              {(isShipped ||
                isOutForDelivery) && (
                <View
                  style={
                    styles.shippingNotice
                  }
                >
                  <Text
                    style={
                      styles.shippingIcon
                    }
                  >
                    📦
                  </Text>

                  <View
                    style={
                      styles.shippingContent
                    }
                  >
                    <Text
                      style={
                        styles.shippingTitle
                      }
                    >
                      Order cancellation unavailable
                    </Text>

                    <Text
                      style={
                        styles.actionDescription
                      }
                    >
                      This order has already been
                      shipped and can no longer be
                      cancelled.
                    </Text>
                  </View>
                </View>
              )}

              {/* RETURN */}

              {canReturn && (
                <View
                  style={
                    styles.returnOrderCard
                  }
                >
                  <View
                    style={
                      styles.actionIconOrange
                    }
                  >
                    <Text
                      style={
                        styles.returnActionIcon
                      }
                    >
                      ↩
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.returnSmallLabel
                    }
                  >
                    RETURN AVAILABLE
                  </Text>

                  <Text
                    style={
                      styles.actionTitle
                    }
                  >
                    Not happy with your order?
                  </Text>

                  <Text
                    style={
                      styles.actionDescription
                    }
                  >
                    You can request a return for
                    this delivered product. Select
                    a reason and submit your request.
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.returnButton
                    }
                    onPress={() =>
                      setShowReturnModal(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.returnButtonText
                      }
                    >
                      Request Return
                    </Text>

                    <Text
                      style={
                        styles.returnArrow
                      }
                    >
                      →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

        {/* =================================================
            FEEDBACK CARD
           
            Outside normal-order block intentionally.
            So delivered order can still show feedback.
        ================================================= */}

        {isDelivered &&
          !isCancelled &&
          !allProductsReviewed && (
            <View
              style={
                styles.feedbackCard
              }
            >
              <View
                style={
                  styles.feedbackIcon
                }
              >
                <Text
                  style={
                    styles.feedbackIconText
                  }
                >
                  ⭐
                </Text>
              </View>

              <Text
                style={
                  styles.feedbackSmallLabel
                }
              >
                PRODUCT FEEDBACK
              </Text>

              <Text
                style={
                  styles.feedbackTitle
                }
              >
                How was your product?
              </Text>

              <Text
                style={
                  styles.feedbackDescription
                }
              >
                Share your rating and feedback
                to help other customers.
              </Text>

              <TouchableOpacity
                style={
                  styles.feedbackButton
                }
                onPress={
                  openFeedback
                }
                disabled={
                  loadingReviewCheck
                }
              >
                {loadingReviewCheck ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.feedbackButtonText
                      }
                    >
                      Give Feedback
                    </Text>

                    <Text
                      style={
                        styles.feedbackArrow
                      }
                    >
                      →
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        {/* =================================================
            THANK YOU CARD
        ================================================= */}

        {isDelivered &&
          !isCancelled &&
          allProductsReviewed && (
            <View
              style={
                styles.feedbackThanksCard
              }
            >
              <View
                style={
                  styles.feedbackThanksIcon
                }
              >
                <Text
                  style={
                    styles.feedbackThanksIconText
                  }
                >
                  ✓
                </Text>
              </View>

              <View
                style={
                  styles.feedbackThanksContent
                }
              >
                <Text
                  style={
                    styles.feedbackThanksSmallLabel
                  }
                >
                  PRODUCT FEEDBACK
                </Text>

                <Text
                  style={
                    styles.feedbackThanksTitle
                  }
                >
                  Thanks for your feedback!
                </Text>

                <Text
                  style={
                    styles.feedbackThanksDescription
                  }
                >
                  Your feedback has been submitted
                  successfully. We appreciate you
                  sharing your experience.
                </Text>
              </View>
            </View>
          )}

        {/* =================================================
            ORDER INFO
        ================================================= */}

        <View
          style={
            styles.orderInfoCard
          }
        >
          <View>
            <Text
              style={
                styles.infoLabel
              }
            >
              ORDER
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              #{currentOrder.id}
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.infoLabel
              }
            >
              PAYMENT
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {paymentText}
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.infoLabel
              }
            >
              TOTAL
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              ₹
              {totalAmount.toLocaleString(
                'en-IN'
              )}
            </Text>
          </View>
        </View>

        {/* BACK TO ORDERS */}

        <TouchableOpacity
          style={
            styles.ordersButton
          }
          onPress={() =>
            router.push(
              '/order-history' as any
            )
          }
        >
          <Text
            style={
              styles.ordersButtonText
            }
          >
            ← Back to My Orders
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 30,
          }}
        />
      </ScrollView>

      {/* =================================================
          CANCEL MODAL
      ================================================= */}
<Modal
  visible={showCancelModal}
  transparent
  animationType="slide"
  onRequestClose={() =>
    setShowCancelModal(false)
  }
>
  <KeyboardAvoidingView
    style={styles.modalKeyboard}
    behavior={
      Platform.OS === 'ios'
        ? 'padding'
        : 'height'
    }
    keyboardVerticalOffset={
      Platform.OS === 'ios'
        ? 0
        : 20
    }
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>

        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <Text style={styles.cancelModalSmall}>
              CANCEL ORDER
            </Text>

            <Text style={styles.modalTitle}>
              Why do you want to cancel?
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() =>
              setShowCancelModal(false)
            }
          >
            <Text style={styles.closeText}>
              ×
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.modalDescription}>
          Select the reason for cancelling this order.
        </Text>

        <ScrollView
  style={styles.reasonScroll}
  contentContainerStyle={styles.reasonScrollContent}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
  showsVerticalScrollIndicator={false}
>
          {cancelReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonOption,
                cancelReason === reason &&
                  styles.cancelReasonSelected,
              ]}
              onPress={() =>
                setCancelReason(reason)
              }
            >
              <View
                style={[
                  styles.radio,
                  cancelReason === reason &&
                    styles.cancelRadioSelected,
                ]}
              >
                {cancelReason === reason && (
                  <Text style={styles.radioCheck}>
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.reasonText}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}

          {cancelReason === 'Other' && (
            <TextInput
              style={styles.otherInput}
              placeholder="Please describe why you want to cancel..."
              placeholderTextColor="#9ca3af"
              multiline
              value={otherCancelReason}
              onChangeText={setOtherCancelReason}
            />
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.keepButton}
            onPress={() =>
              setShowCancelModal(false)
            }
            disabled={loadingCancel}
          >
            <Text style={styles.keepButtonText}>
              Keep Order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitCancelButton,
              (
                loadingCancel ||
                !cancelReason ||
                (
                  cancelReason === 'Other' &&
                  !otherCancelReason.trim()
                )
              ) && styles.disabledButton,
            ]}
            onPress={handleCancelOrder}
            disabled={
              loadingCancel ||
              !cancelReason ||
              (
                cancelReason === 'Other' &&
                !otherCancelReason.trim()
              )
            }
          >
            {loadingCancel ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <Text style={styles.submitButtonText}>
                Cancel Order
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
      {/* =================================================
          RETURN MODAL
      ================================================= */}
<Modal
  visible={showReturnModal}
  transparent
  animationType="slide"
  onRequestClose={() =>
    setShowReturnModal(false)
  }
>
  <KeyboardAvoidingView
    style={styles.modalKeyboard}
    behavior={
      Platform.OS === 'ios'
        ? 'padding'
        : 'height'
    }
    keyboardVerticalOffset={
      Platform.OS === 'ios'
        ? 0
        : 20
    }
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>

        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <Text style={styles.returnModalSmall}>
              RETURN ORDER
            </Text>

            <Text style={styles.modalTitle}>
              Why do you want to return?
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() =>
              setShowReturnModal(false)
            }
          >
            <Text style={styles.closeText}>
              ×
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.modalDescription}>
          Select the reason for returning this order.
        </Text>

        <ScrollView
          style={styles.reasonScroll}
          contentContainerStyle={styles.reasonScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {returnReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonOption,
                returnReason === reason &&
                  styles.returnReasonSelected,
              ]}
              onPress={() =>
                setReturnReason(reason)
              }
            >
              <View
                style={[
                  styles.radio,
                  returnReason === reason &&
                    styles.returnRadioSelected,
                ]}
              >
                {returnReason === reason && (
                  <Text style={styles.radioCheck}>
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.reasonText}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}

          {returnReason === 'Other' && (
            <TextInput
              style={styles.otherInput}
              placeholder="Please describe the reason..."
              placeholderTextColor="#9ca3af"
              multiline
              value={otherReturnReason}
              onChangeText={setOtherReturnReason}
            />
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.keepButton}
            onPress={() =>
              setShowReturnModal(false)
            }
            disabled={loadingReturn}
          >
            <Text style={styles.keepButtonText}>
              Keep Order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitReturnButton,
              (
                loadingReturn ||
                !returnReason ||
                (
                  returnReason === 'Other' &&
                  !otherReturnReason.trim()
                )
              ) && styles.disabledButton,
            ]}
            onPress={handleReturnOrder}
            disabled={
              loadingReturn ||
              !returnReason ||
              (
                returnReason === 'Other' &&
                !otherReturnReason.trim()
              )
            }
          >
            {loadingReturn ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <Text style={styles.submitButtonText}>
                Request Return
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>

      {/* =================================================
          FEEDBACK MODAL
      ================================================= */}
<Modal
  visible={showFeedbackModal}
  transparent
  animationType="slide"
  onRequestClose={() =>
    setShowFeedbackModal(false)
  }
>
  <KeyboardAvoidingView
    style={styles.modalKeyboard}
    behavior={
      Platform.OS === 'ios'
        ? 'padding'
        : 'height'
    }
    keyboardVerticalOffset={
      Platform.OS === 'ios'
        ? 0
        : 20
    }
  >
    <View
      style={styles.modalOverlay}
    >
      <View
        style={styles.feedbackModalCard}
      >
            {/* HEADER */}

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.modalHeaderContent
                }
              >
                <Text
                  style={
                    styles.feedbackModalSmall
                  }
                >
                  PRODUCT FEEDBACK
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Rate your product
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setShowFeedbackModal(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>
<ScrollView
  style={styles.feedbackModalScroll}
  contentContainerStyle={
    styles.feedbackModalScrollContent
  }
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
>
              {/* PRODUCT LIST */}

              {feedbackProducts.length >
                1 && (
                <View
                  style={
                    styles.feedbackProductList
                  }
                >
                  <Text
                    style={
                      styles.feedbackSectionLabel
                    }
                  >
                    SELECT PRODUCT
                  </Text>

                  {feedbackProducts.map(
                    (
                      product
                    ) => {
                      const isReviewed =
                        Boolean(
                          reviewedProducts[
                            product.product_id
                          ]
                        );

                      const isSelected =
                        feedbackProduct?.product_id ===
                        product.product_id;

                      return (
                        <TouchableOpacity
                          key={
                            product.product_id
                          }
                          style={[
                            styles.feedbackProductOption,

                            isSelected &&
                              styles.feedbackProductSelected,

                            isReviewed &&
                              styles.feedbackProductReviewed,
                          ]}
                          disabled={
                            isReviewed
                          }
                          onPress={() =>
                            selectFeedbackProduct(
                              product
                            )
                          }
                        >
                          <View
                            style={
                              styles.feedbackProductImagePlaceholder
                            }
                          >
                            <Text
                              style={
                                styles.feedbackProductImageText
                              }
                            >
                              📦
                            </Text>
                          </View>

                          <View
                            style={
                              styles.feedbackProductInfo
                            }
                          >
                            <Text
                              numberOfLines={
                                2
                              }
                              style={
                                styles.feedbackProductName
                              }
                            >
                              {
                                product.product_name
                              }
                            </Text>

                            {isReviewed && (
                              <Text
                                style={
                                  styles.reviewedText
                                }
                              >
                                ✓ Reviewed
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              )}

              {/* SELECTED PRODUCT */}

              {feedbackProduct && (
                <View
                  style={
                    styles.selectedFeedbackProduct
                  }
                >
                  <View
                    style={
                      styles.selectedProductIcon
                    }
                  >
                    <Text
                      style={
                        styles.selectedProductIconText
                      }
                    >
                      📦
                    </Text>
                  </View>

                  <View
                    style={
                      styles.selectedProductInfo
                    }
                  >
                    <Text
                      style={
                        styles.selectedProductLabel
                      }
                    >
                      PRODUCT
                    </Text>

                    <Text
                      numberOfLines={
                        2
                      }
                      style={
                        styles.selectedProductName
                      }
                    >
                      {
                        feedbackProduct.product_name
                      }
                    </Text>
                  </View>
                </View>
              )}

              {/* RATING */}

              <View
                style={
                  styles.feedbackRatingSection
                }
              >
                <Text
                  style={
                    styles.feedbackQuestion
                  }
                >
                  How would you rate this product?
                </Text>

                <View
                  style={
                    styles.feedbackStars
                  }
                >
                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <TouchableOpacity
                        key={
                          star
                        }
                        onPress={() =>
                          setFeedbackRating(
                            star
                          )
                        }
                        style={
                          styles.starButton
                        }
                      >
                        <Text
                          style={[
                            styles.starText,

                            star <=
                              feedbackRating &&
                              styles.activeStar,
                          ]}
                        >
                          ★
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {feedbackRating >
                  0 && (
                  <Text
                    style={
                      styles.ratingText
                    }
                  >
                    {feedbackRating ===
                      1 &&
                      'Poor'}

                    {feedbackRating ===
                      2 &&
                      'Fair'}

                    {feedbackRating ===
                      3 &&
                      'Good'}

                    {feedbackRating ===
                      4 &&
                      'Very Good'}

                    {feedbackRating ===
                      5 &&
                      'Excellent'}
                  </Text>
                )}
              </View>

              {/* TEXT */}

              <View
                style={
                  styles.feedbackTextSection
                }
              >
                <Text
                  style={
                    styles.feedbackInputLabel
                  }
                >
                  Your Feedback
                </Text>

                <TextInput
                  style={
                    styles.feedbackTextInput
                  }
                  placeholder="Tell us about your experience with this product..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={
                    5
                  }
                  maxLength={
                    1000
                  }
                  value={
                    feedbackText
                  }
                  onChangeText={
                    setFeedbackText
                  }
                />

                <Text
                  style={
                    styles.characterCount
                  }
                >
                  {
                    feedbackText.length
                  }
                  /1000
                </Text>
              </View>
            </ScrollView>

            {/* ACTIONS */}

            <View
              style={
                styles.feedbackModalActions
              }
            >
              <TouchableOpacity
                style={
                  styles.feedbackCancelButton
                }
                onPress={() =>
                  setShowFeedbackModal(
                    false
                  )
                }
                disabled={
                  loadingFeedback
                }
              >
                <Text
                  style={
                    styles.feedbackCancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackSubmitButton,

                  (
                    loadingFeedback ||
                    !feedbackProduct ||
                    !feedbackRating ||
                    !feedbackText.trim()
                  ) &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSubmitFeedback
                }
                disabled={
                  loadingFeedback ||
                  !feedbackProduct ||
                  !feedbackRating ||
                  !feedbackText.trim()
                }
              >
                {loadingFeedback ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.feedbackSubmitText
                    }
                  >
                    Submit Feedback
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
         </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f8f8',
    },
    modalKeyboard: {
  flex: 1,
},

feedbackModalScroll: {
  flex: 1,
},

feedbackModalScrollContent: {
  paddingBottom: 30,
},

    content: {
      padding: 14,
      paddingBottom: 40,
    },

    loadingContainer: {
      flex: 1,
      backgroundColor: '#f8f8f8',
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      marginTop: 12,
      color: '#777',
      fontSize: 14,
    },

    errorContainer: {
      flex: 1,
      backgroundColor: '#f8f8f8',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },

    errorIcon: {
      fontSize: 55,
      marginBottom: 15,
    },

    errorTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#181818',
      textAlign: 'center',
    },

    errorText: {
      marginTop: 8,
      color: '#777',
      textAlign: 'center',
      lineHeight: 21,
    },

    backHomeButton: {
      marginTop: 25,
      paddingHorizontal: 25,
      paddingVertical: 13,
      backgroundColor: '#7c3aed',
      borderRadius: 10,
    },

    backHomeText: {
      color: '#fff',
      fontWeight: '800',
    },

    header: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 15,
      backgroundColor: '#fff',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },

    headerSpacer: {
      width: 42,
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

    trackingLabel: {
      fontSize: 10,
      color: '#7c3aed',
      fontWeight: '900',
      letterSpacing: 1,
    },

    headerTitle: {
      marginTop: 2,
      fontSize: 19,
      fontWeight: '800',
      color: '#181818',
    },

    headerOrderNumber: {
      marginTop: 2,
      fontSize: 12,
      color: '#777',
    },

    orderCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },

    orderTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    orderLabel: {
      fontSize: 12,
      color: '#777',
    },

    orderId: {
      marginTop: 3,
      fontSize: 18,
      fontWeight: '800',
      color: '#181818',
    },

    statusBadge: {
      backgroundColor: '#dcfce7',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },

    statusText: {
      color: '#15803d',
      fontSize: 12,
      fontWeight: '800',
    },

    cancelledBadge: {
      backgroundColor: '#fee2e2',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },

    cancelledText: {
      color: '#dc2626',
      fontSize: 12,
      fontWeight: '800',
    },

    returnedBadge: {
      backgroundColor: '#fef3c7',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },

    returnedText: {
      color: '#d97706',
      fontSize: 12,
      fontWeight: '800',
    },

    divider: {
      height: 1,
      backgroundColor: '#eeeeee',
      marginVertical: 14,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 9,
    },

    summaryLabel: {
      fontSize: 13,
      color: '#777',
    },

    summaryValue: {
      flex: 1,
      marginLeft: 15,
      textAlign: 'right',
      fontSize: 13,
      color: '#333',
      fontWeight: '600',
    },

    total: {
      fontSize: 16,
      color: '#7c3aed',
      fontWeight: '800',
    },

    trackingCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#181818',
      marginBottom: 18,
    },

    stepRow: {
      flexDirection: 'row',
      minHeight: 82,
    },

    timeline: {
      width: 40,
      alignItems: 'center',
    },

    circle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#e5e7eb',
      alignItems: 'center',
      justifyContent: 'center',
    },

    completedCircle: {
      backgroundColor: '#7c3aed',
    },

    activeCircle: {
      borderWidth: 3,
      borderColor: '#ddd6fe',
    },

    check: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '900',
    },

    smallDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#9ca3af',
    },

    line: {
      width: 2,
      flex: 1,
      backgroundColor: '#e5e7eb',
      marginVertical: 2,
    },

    completedLine: {
      backgroundColor: '#7c3aed',
    },

    stepContent: {
      flex: 1,
      paddingLeft: 12,
      paddingBottom: 12,
    },

    stepTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#999',
    },

    completedTitle: {
      color: '#181818',
    },

    stepDescription: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      color: '#888',
    },

    currentBadge: {
      alignSelf: 'flex-start',
      marginTop: 7,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: '#f3e8ff',
    },

    currentBadgeText: {
      color: '#7c3aed',
      fontSize: 10,
      fontWeight: '800',
    },

    addressCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
    },

    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    locationCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#f3e8ff',
      justifyContent: 'center',
      alignItems: 'center',
    },

    locationIcon: {
      fontSize: 20,
    },

    addressInfo: {
      marginLeft: 12,
      flex: 1,
    },

    addressName: {
      fontSize: 15,
      fontWeight: '800',
      color: '#181818',
    },

    addressPhone: {
      marginTop: 3,
      fontSize: 13,
      color: '#777',
    },

    addressLine: {
      marginTop: 14,
      fontSize: 14,
      lineHeight: 21,
      color: '#333',
    },

    cancelledCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 25,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#fecaca',
    },

    cancelledCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelledIcon: {
      fontSize: 40,
      fontWeight: '800',
      color: '#dc2626',
    },

    cancelledLabel: {
      marginTop: 15,
      fontSize: 10,
      fontWeight: '900',
      color: '#dc2626',
      letterSpacing: 1,
    },

    cancelledTitle: {
      marginTop: 5,
      fontSize: 20,
      fontWeight: '800',
      color: '#dc2626',
      textAlign: 'center',
    },

    cancelledDescription: {
      marginTop: 8,
      textAlign: 'center',
      color: '#777',
      lineHeight: 20,
      fontSize: 13,
    },

    reasonDisplayCard: {
      width: '100%',
      marginTop: 16,
      backgroundColor: '#fff7ed',
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: '#fed7aa',
    },

    reasonDisplayLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#9a3412',
    },

    reasonDisplayText: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '700',
      color: '#7c2d12',
    },

    returnedCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 25,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#fde68a',
    },

    returnedCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#fef3c7',
      alignItems: 'center',
      justifyContent: 'center',
    },

    returnedIcon: {
      fontSize: 36,
      fontWeight: '900',
      color: '#d97706',
    },

    returnedLabel: {
      marginTop: 15,
      fontSize: 10,
      fontWeight: '900',
      color: '#d97706',
      letterSpacing: 1,
    },

    returnedTitle: {
      marginTop: 5,
      fontSize: 20,
      fontWeight: '800',
      color: '#d97706',
      textAlign: 'center',
    },

    returnedDescription: {
      marginTop: 8,
      fontSize: 13,
      color: '#777',
      textAlign: 'center',
      lineHeight: 20,
    },

    returnStatusBox: {
      width: '100%',
      marginTop: 16,
      padding: 12,
      borderRadius: 10,
      backgroundColor: '#fffbeb',
      borderWidth: 1,
      borderColor: '#fde68a',
    },

    returnStatusLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#92400e',
    },

    returnStatusValue: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '800',
      color: '#78350f',
    },

    returnReasonDisplay: {
      width: '100%',
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: '#fff7ed',
      borderWidth: 1,
      borderColor: '#fed7aa',
    },

    returnReasonLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#9a3412',
    },

    returnReasonValue: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '700',
      color: '#7c2d12',
    },

    returnRequestedCard: {
      backgroundColor: '#ecfdf5',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },

    returnRequestedIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    returnRequestedIconText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '900',
    },

    returnRequestedContent: {
      flex: 1,
      paddingRight: 8,
    },

    returnRequestedLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#047857',
      letterSpacing: 0.8,
    },

    returnRequestedTitle: {
      marginTop: 3,
      fontSize: 15,
      fontWeight: '800',
      color: '#065f46',
    },

    boldText: {
      fontWeight: '900',
      color: '#047857',
    },

    returnReasonText: {
      marginTop: 5,
      fontSize: 12,
      color: '#047857',
      lineHeight: 18,
    },

    returnStatusPill: {
      marginTop: 2,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: '#d1fae5',
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },

    returnStatusPillText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#047857',
    },

    cancelOrderCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#fee2e2',
    },

    returnOrderCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#fed7aa',
    },

    actionIconRed: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    actionIconOrange: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#fff7ed',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    actionIconText: {
      fontSize: 19,
      color: '#dc2626',
      fontWeight: '900',
    },

    returnActionIcon: {
      fontSize: 25,
      color: '#d97706',
      fontWeight: '900',
    },

    returnSmallLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: '#d97706',
      letterSpacing: 0.8,
      marginBottom: 2,
    },

    actionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#181818',
    },

    actionDescription: {
      marginTop: 5,
      fontSize: 12,
      color: '#777',
      lineHeight: 18,
    },

    cancelButton: {
      height: 46,
      marginTop: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#dc2626',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelButtonText: {
      color: '#dc2626',
      fontSize: 13,
      fontWeight: '800',
    },

    returnButton: {
      height: 46,
      marginTop: 14,
      borderRadius: 10,
      backgroundColor: '#d97706',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },

    returnButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
    },

    returnArrow: {
      marginLeft: 8,
      color: '#fff',
      fontSize: 16,
      fontWeight: '900',
    },

    shippingNotice: {
      backgroundColor: '#eff6ff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: '#bfdbfe',
    },

    shippingIcon: {
      fontSize: 24,
      marginRight: 12,
    },

    shippingContent: {
      flex: 1,
    },

    shippingTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#1d4ed8',
    },

    /* =================================================
       FEEDBACK CARD
    ================================================= */

    feedbackCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e9d5ff',
    },

    feedbackIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#f3e8ff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    feedbackIconText: {
      fontSize: 22,
    },

    feedbackSmallLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: '#7c3aed',
      letterSpacing: 0.8,
    },

    feedbackTitle: {
      marginTop: 4,
      fontSize: 17,
      fontWeight: '800',
      color: '#181818',
    },

    feedbackDescription: {
      marginTop: 6,
      fontSize: 12,
      color: '#777',
      lineHeight: 18,
    },

    feedbackButton: {
      height: 46,
      marginTop: 14,
      borderRadius: 10,
      backgroundColor: '#7c3aed',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },

    feedbackButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
    },

    feedbackArrow: {
      marginLeft: 8,
      color: '#fff',
      fontSize: 17,
      fontWeight: '900',
    },

    /* =================================================
       THANKS CARD
    ================================================= */

    feedbackThanksCard: {
      backgroundColor: '#ecfdf5',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },

    feedbackThanksIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },

    feedbackThanksIconText: {
      color: '#fff',
      fontSize: 26,
      fontWeight: '900',
    },

    feedbackThanksContent: {
      flex: 1,
    },

    feedbackThanksSmallLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: '#047857',
      letterSpacing: 0.8,
    },

    feedbackThanksTitle: {
      marginTop: 3,
      fontSize: 17,
      fontWeight: '800',
      color: '#065f46',
    },

    feedbackThanksDescription: {
      marginTop: 5,
      fontSize: 12,
      color: '#047857',
      lineHeight: 18,
    },

    /* =================================================
       ORDER INFO
    ================================================= */

    orderInfoCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },

    infoLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: '#9ca3af',
      letterSpacing: 0.6,
    },

    infoValue: {
      marginTop: 5,
      fontSize: 13,
      fontWeight: '800',
      color: '#181818',
    },

    ordersButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: '#7c3aed',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },

    ordersButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '800',
    },

    /* =================================================
       MODAL
    ================================================= */

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },

    modalCard: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 18,
  height: '88%',
  maxHeight: '88%',
},

    feedbackModalCard: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 18,
  height: '92%',
  maxHeight: '92%',
},

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },

    modalHeaderContent: {
      flex: 1,
      paddingRight: 12,
    },

    cancelModalSmall: {
      fontSize: 10,
      fontWeight: '800',
      color: '#dc2626',
      letterSpacing: 0.8,
    },

    returnModalSmall: {
      fontSize: 10,
      fontWeight: '800',
      color: '#d97706',
      letterSpacing: 0.8,
    },

    feedbackModalSmall: {
      fontSize: 10,
      fontWeight: '800',
      color: '#7c3aed',
      letterSpacing: 0.8,
    },

    modalTitle: {
      marginTop: 4,
      fontSize: 20,
      fontWeight: '800',
      color: '#181818',
    },

    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },

    closeText: {
      fontSize: 25,
      color: '#374151',
      lineHeight: 28,
    },

    modalDescription: {
      marginTop: 10,
      marginBottom: 12,
      fontSize: 13,
      color: '#777',
      lineHeight: 19,
    },

   reasonScroll: {
  flex: 1,
},

reasonScrollContent: {
  paddingBottom: 40,
},


    reasonOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 7,
      backgroundColor: '#f9fafb',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },

    cancelReasonSelected: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
    },

    returnReasonSelected: {
      backgroundColor: '#fff7ed',
      borderColor: '#fed7aa',
    },

    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#9ca3af',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },

    cancelRadioSelected: {
      backgroundColor: '#dc2626',
      borderColor: '#dc2626',
    },

    returnRadioSelected: {
      backgroundColor: '#d97706',
      borderColor: '#d97706',
    },

    radioCheck: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '900',
    },

    reasonText: {
      flex: 1,
      fontSize: 13,
      color: '#374151',
      fontWeight: '600',
    },

    otherInput: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 10,
      padding: 12,
      fontSize: 13,
      color: '#111827',
      textAlignVertical: 'top',
      marginTop: 5,
      marginBottom: 10,
    },

    modalActions: {
      flexDirection: 'row',
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
    },

    keepButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#d1d5db',
      justifyContent: 'center',
      alignItems: 'center',
    },

    keepButtonText: {
      color: '#374151',
      fontSize: 13,
      fontWeight: '700',
    },

    submitCancelButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      backgroundColor: '#dc2626',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },

    submitReturnButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      backgroundColor: '#d97706',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },

    submitButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.5,
    },

    /* =================================================
       FEEDBACK MODAL
    ================================================= */

    feedbackProductList: {
      marginTop: 18,
      marginBottom: 12,
    },

    feedbackSectionLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: '#6b7280',
      letterSpacing: 0.8,
      marginBottom: 8,
    },

    feedbackProductOption: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: '#f9fafb',
      marginBottom: 7,
    },

    feedbackProductSelected: {
      borderColor: '#c4b5fd',
      backgroundColor: '#f5f3ff',
    },

    feedbackProductReviewed: {
      opacity: 0.55,
    },

    feedbackProductImagePlaceholder: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: '#f3f4f6',
      alignItems: 'center',
      justifyContent: 'center',
    },

    feedbackProductImageText: {
      fontSize: 20,
    },

    feedbackProductInfo: {
      flex: 1,
      marginLeft: 10,
    },

    feedbackProductName: {
      fontSize: 13,
      fontWeight: '700',
      color: '#181818',
    },

    reviewedText: {
      marginTop: 3,
      fontSize: 10,
      fontWeight: '800',
      color: '#059669',
    },

    selectedFeedbackProduct: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: '#f5f3ff',
      borderWidth: 1,
      borderColor: '#ddd6fe',
      marginTop: 5,
      marginBottom: 18,
    },

    selectedProductIcon: {
      width: 46,
      height: 46,
      borderRadius: 10,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },

    selectedProductIconText: {
      fontSize: 22,
    },

    selectedProductInfo: {
      flex: 1,
      marginLeft: 11,
    },

    selectedProductLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: '#7c3aed',
      letterSpacing: 0.8,
    },

    selectedProductName: {
      marginTop: 3,
      fontSize: 14,
      fontWeight: '800',
      color: '#181818',
    },

    feedbackRatingSection: {
      alignItems: 'center',
      marginBottom: 18,
    },

    feedbackQuestion: {
      fontSize: 13,
      color: '#374151',
      fontWeight: '600',
      textAlign: 'center',
    },

    feedbackStars: {
      flexDirection: 'row',
      marginTop: 10,
    },

    starButton: {
      paddingHorizontal: 5,
      paddingVertical: 3,
    },

    starText: {
      fontSize: 34,
      color: '#d1d5db',
    },

    activeStar: {
      color: '#f59e0b',
    },

    ratingText: {
      marginTop: 5,
      fontSize: 12,
      color: '#7c3aed',
      fontWeight: '800',
    },

    feedbackTextSection: {
      marginBottom: 15,
    },

    feedbackInputLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: '#374151',
      marginBottom: 8,
    },

    feedbackTextInput: {
      minHeight: 110,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 12,
      padding: 12,
      fontSize: 13,
      color: '#111827',
      textAlignVertical: 'top',
    },

    characterCount: {
      textAlign: 'right',
      marginTop: 5,
      fontSize: 10,
      color: '#9ca3af',
    },

    feedbackModalActions: {
      flexDirection: 'row',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
    },

    feedbackCancelButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#d1d5db',
      alignItems: 'center',
      justifyContent: 'center',
    },

    feedbackCancelText: {
      color: '#374151',
      fontSize: 13,
      fontWeight: '700',
    },

    feedbackSubmitButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      backgroundColor: '#7c3aed',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    feedbackSubmitText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
    },
  });