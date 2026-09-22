import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import RazorpayCheckout from 'react-native-razorpay';

import { API_BASE_URL } from '../../config/api';
import { useCart } from '../../context/CartContext';

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

export default function CheckoutScreen() {
  const router = useRouter();

  const { cartItems, cartTotal, clearCart } = useCart();

  // =====================================================
  // ADDRESS
  // =====================================================

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [addressLoading, setAddressLoading] =
    useState(true);

  const [addAddressVisible, setAddAddressVisible] =
    useState(false);

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');

  // =====================================================
  // PAYMENT
  // =====================================================

  const [paymentMethod, setPaymentMethod] =
    useState<'Cash on Delivery' | 'Razorpay'>(
      'Cash on Delivery'
    );

  const [processing, setProcessing] =
    useState(false);

  // =====================================================
  // GET USER
  // =====================================================

  const getUser = async () => {
    const storedUser =
      await AsyncStorage.getItem('loggedInUser');

    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser);

      if (!user?.id) {
        return null;
      }

      return user;
    } catch (error) {
      console.error(
        'GET USER PARSE ERROR:',
        error
      );

      return null;
    }
  };

  // =====================================================
  // GET AUTH TOKEN
  // =====================================================

  const getAuthToken = async () => {
    const token =
      await AsyncStorage.getItem('authToken');

    if (!token) {
      return null;
    }

    return token;
  };

  // =====================================================
  // NORMALIZE ADDRESS
  // =====================================================

  const normalizeAddressValue = (
    value: unknown
  ) => {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  };

  // =====================================================
  // REMOVE DUPLICATE ADDRESSES
  // =====================================================

  const removeDuplicateAddresses = (
    list: Address[]
  ) => {
    const uniqueAddresses: Address[] = [];
    const seen = new Set<string>();

    for (const item of list) {
      const uniqueKey = [
        normalizeAddressValue(item.full_name),
        normalizeAddressValue(item.phone),
        normalizeAddressValue(item.address_line),
        normalizeAddressValue(item.city),
        normalizeAddressValue(item.state),
        normalizeAddressValue(item.pincode),
      ].join('|');

      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueAddresses.push(item);
      }
    }

    return uniqueAddresses;
  };

  // =====================================================
  // LOAD SAVED ADDRESSES
  // =====================================================

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);

      const user = await getUser();

      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login before checkout.'
        );
        return;
      }

      const token = await getAuthToken();

      if (!token) {
        Alert.alert(
          'Login Required',
          'Your login session has expired. Please login again.'
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/addresses/${user.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-user-id': String(user.id),
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      console.log(
        'CHECKOUT ADDRESSES RESPONSE:',
        data
      );

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            'Failed to load addresses'
        );
      }

      const list = Array.isArray(
        data.addresses
      )
        ? data.addresses
        : [];

      const uniqueAddresses =
        removeDuplicateAddresses(list);

      console.log(
        'UNIQUE CHECKOUT ADDRESSES:',
        uniqueAddresses
      );

      setAddresses(uniqueAddresses);

      if (
        selectedAddressId !== null &&
        uniqueAddresses.some(
          (item) =>
            Number(item.id) ===
            Number(selectedAddressId)
        )
      ) {
        return;
      }

      if (uniqueAddresses.length > 0) {
        setSelectedAddressId(
          Number(uniqueAddresses[0].id)
        );
      } else {
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error(
        'Load checkout addresses:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to load saved addresses.'
      );
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // =====================================================
  // SELECTED ADDRESS
  // =====================================================

  const selectedAddress =
    addresses.find(
      (item) =>
        Number(item.id) ===
        Number(selectedAddressId)
    );

  // =====================================================
  // ADD ADDRESS
  // =====================================================

  const saveNewAddress = async () => {
    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      Alert.alert(
        'Missing Details',
        'Please fill all address details.'
      );
      return;
    }

    if (
      !/^\d{10}$/.test(
        phone.trim()
      )
    ) {
      Alert.alert(
        'Invalid Phone',
        'Enter a valid 10-digit phone number.'
      );
      return;
    }

    if (
      !/^\d{6}$/.test(
        pincode.trim()
      )
    ) {
      Alert.alert(
        'Invalid Pincode',
        'Enter a valid 6-digit pincode.'
      );
      return;
    }

    // =================================================
    // PREVENT DUPLICATE BEFORE API CALL
    // =================================================

    const newAddressKey = [
      normalizeAddressValue(name),
      normalizeAddressValue(phone),
      normalizeAddressValue(address),
      normalizeAddressValue(city),
      normalizeAddressValue(state),
      normalizeAddressValue(pincode),
    ].join('|');

    const alreadyExists =
      addresses.some((item) => {
        const existingKey = [
          normalizeAddressValue(
            item.full_name
          ),
          normalizeAddressValue(
            item.phone
          ),
          normalizeAddressValue(
            item.address_line
          ),
          normalizeAddressValue(
            item.city
          ),
          normalizeAddressValue(
            item.state
          ),
          normalizeAddressValue(
            item.pincode
          ),
        ].join('|');

        return (
          existingKey ===
          newAddressKey
        );
      });

    if (alreadyExists) {
      Alert.alert(
        'Address Already Saved',
        'This address is already saved.'
      );
      return;
    }

    try {
      setSavingAddress(true);

      const user = await getUser();

      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login again.'
        );
        return;
      }

      const token =
        await getAuthToken();

      if (!token) {
        Alert.alert(
          'Login Required',
          'Your login session has expired. Please login again.'
        );
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/addresses`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

              'x-user-id':
                String(user.id),
            },

            body: JSON.stringify({
              user_id:
                Number(user.id),

              full_name:
                name.trim(),

              phone:
                phone.trim(),

              address_line:
                address.trim(),

              city:
                city.trim(),

              state:
                state.trim(),

              pincode:
                pincode.trim(),
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        'SAVE CHECKOUT ADDRESS RESPONSE:',
        data
      );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            'Failed to save address'
        );
      }

      const newAddress =
        data?.address;

      setName('');
      setPhone('');
      setAddress('');
      setCity('');
      setState('Tamil Nadu');
      setPincode('');

      setAddAddressVisible(false);

      await loadAddresses();

      if (newAddress?.id) {
        setSelectedAddressId(
          Number(newAddress.id)
        );
      }

      Alert.alert(
        'Success',
        'Address added successfully.'
      );
    } catch (error) {
      console.error(
        'Save checkout address:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to save address.'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // =====================================================
  // CREATE COD ORDER
  // =====================================================

  const createCODOrder = async (
    userId: number,
    addressId: number
  ) => {
    const token =
      await getAuthToken();

    if (!token) {
      throw new Error(
        'Login session expired. Please login again.'
      );
    }

    const orderItems =
      cartItems.map((item) => ({
        product_id:
          Number(item.id),

        quantity:
          Number(item.quantity),

        price:
          Number(item.price),
      }));

    console.log(
      'CREATE COD ORDER - user:',
      userId
    );

    console.log(
      'CREATE COD ORDER - address:',
      addressId
    );

    console.log(
      'CREATE COD ORDER - items:',
      orderItems
    );

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
              Number(cartTotal),

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
      'CREATE COD ORDER RESPONSE:',
      data
    );

    if (
      !response.ok ||
      !data?.success
    ) {
      throw new Error(
        data?.message ||
          'Failed to create order'
      );
    }

    return data;
  };

  // =====================================================
  // RAZORPAY
  // =====================================================

  const startRazorpayPayment =
    async (
      userId: number,
      addressId: number
    ) => {
      const token =
        await getAuthToken();

      if (!token) {
        throw new Error(
          'Login session expired. Please login again.'
        );
      }

      const orderItems =
        cartItems.map((item) => ({
          product_id:
            Number(item.id),

          quantity:
            Number(item.quantity),

          price:
            Number(item.price),
        }));

      console.log(
        'RAZORPAY CREATE ORDER'
      );

      const createResponse =
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
                Number(cartTotal),
            }),
          }
        );

      const createData =
        await createResponse.json();

      console.log(
        'RAZORPAY CREATE RESPONSE:',
        createData
      );

      if (
        !createResponse.ok ||
        !createData?.success
      ) {
        throw new Error(
          createData?.message ||
            'Unable to create Razorpay order'
        );
      }

      const options = {
        key:
          createData.key_id,

        amount:
          createData.amount,

        currency:
          createData.currency ||
          'INR',

        name:
          'ShopEase',

        description:
          'ShopEase Order Payment',

        order_id:
          createData.razorpay_order_id,

        prefill: {
          name:
            selectedAddress?.full_name ||
            '',

          contact:
            selectedAddress?.phone ||
            '',
        },

        theme: {
          color: '#7c3aed',
        },
      };

      const paymentResult =
        await RazorpayCheckout.open(
          options
        );

      console.log(
        'RAZORPAY PAYMENT RESULT:',
        paymentResult
      );

      const verifyResponse =
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
              razorpay_order_id:
                paymentResult
                  .razorpay_order_id,

              razorpay_payment_id:
                paymentResult
                  .razorpay_payment_id,

              razorpay_signature:
                paymentResult
                  .razorpay_signature,

              user_id:
                userId,

              address_id:
                addressId,

              total_amount:
                Number(cartTotal),

              items:
                orderItems,
            }),
          }
        );

      const verifyData =
        await verifyResponse.json();

      console.log(
        'RAZORPAY VERIFY RESPONSE:',
        verifyData
      );

      if (
        !verifyResponse.ok ||
        !verifyData?.success
      ) {
        throw new Error(
          verifyData?.message ||
            'Payment verification failed'
        );
      }

      return verifyData;
    };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const placeOrder =
    async () => {
      if (
        !cartItems ||
        cartItems.length === 0
      ) {
        Alert.alert(
          'Empty Cart',
          'Please add products to your cart first.'
        );
        return;
      }

      if (!selectedAddressId) {
        Alert.alert(
          'Address Required',
          'Please select a delivery address.'
        );
        return;
      }

      const user =
        await getUser();

      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login before placing an order.'
        );
        return;
      }

      const token =
        await getAuthToken();

      if (!token) {
        Alert.alert(
          'Login Required',
          'Your login session has expired. Please login again.'
        );
        return;
      }

      try {
        setProcessing(true);

        // =================================================
        // COD
        // =================================================

        if (
          paymentMethod ===
          'Cash on Delivery'
        ) {
          const orderData =
            await createCODOrder(
              Number(user.id),
              Number(
                selectedAddressId
              )
            );

          if (
            !orderData?.order?.id
          ) {
            throw new Error(
              'Order ID was not returned.'
            );
          }

          const createdOrderId =
            String(
              orderData.order.id
            );

          const createdOrderTotal =
            String(cartTotal);

          clearCart();

          router.replace({
            pathname:
              '/order-success',

            params: {
              orderId:
                createdOrderId,

              total:
                createdOrderTotal,
            },
          } as any);

          return;
        }

        // =================================================
        // RAZORPAY
        // =================================================

        const paymentData =
          await startRazorpayPayment(
            Number(user.id),
            Number(
              selectedAddressId
            )
          );

        if (
          !paymentData?.order_id
        ) {
          throw new Error(
            'Payment order was not created correctly.'
          );
        }

        const createdOrderId =
          String(
            paymentData.order_id
          );

        const createdOrderTotal =
          String(cartTotal);

        clearCart();

        router.replace({
          pathname:
            '/order-success',

          params: {
            orderId:
              createdOrderId,

            total:
              createdOrderTotal,
          },
        } as any);
      } catch (error: any) {
        console.error(
          'Checkout payment/order error:',
          error
        );

        if (
          error?.code === 2 ||
          error?.description
            ?.toLowerCase()
            .includes('cancel')
        ) {
          Alert.alert(
            'Payment Cancelled',
            'You cancelled the payment.'
          );

          return;
        }

        Alert.alert(
          'Payment Failed',
          error?.message ||
            error?.description ||
            'Unable to complete payment.'
        );
      } finally {
        setProcessing(false);
      }
    };

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
        >
          Checkout
        </Text>

        <View
          style={styles.headerSpace}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Order Summary
          </Text>

          {cartItems.map((item) => (
            <View
              key={String(item.id)}
              style={styles.orderItem}
            >
              <View
                style={styles.itemInfo}
              >
                <Text
                  style={styles.itemName}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.itemQuantity
                  }
                >
                  Quantity: {item.quantity}
                </Text>
              </View>

              <Text
                style={styles.itemPrice}
              >
                ₹
                {(
                  Number(item.price) *
                  Number(item.quantity)
                ).toLocaleString(
                  'en-IN'
                )}
              </Text>
            </View>
          ))}

          <View
            style={styles.divider}
          />

          <View
            style={styles.totalRow}
          >
            <Text
              style={styles.totalLabel}
            >
              Total
            </Text>

            <Text
              style={styles.totalPrice}
            >
              ₹
              {Number(
                cartTotal
              ).toLocaleString(
                'en-IN'
              )}
            </Text>
          </View>
        </View>

        {/* =================================================
            DELIVERY ADDRESS
        ================================================= */}

        <View style={styles.section}>
          <View
            style={
              styles.sectionHeaderRow
            }
          >
            <Text
              style={styles.sectionTitle}
            >
              Delivery Address
            </Text>

            <TouchableOpacity
              onPress={() =>
                setAddAddressVisible(
                  true
                )
              }
            >
              <Text
                style={styles.addText}
              >
                + Add New
              </Text>
            </TouchableOpacity>
          </View>

          {addressLoading ? (
            <View
              style={styles.loaderBox}
            >
              <ActivityIndicator
                size="small"
                color="#7c3aed"
              />

              <Text
                style={
                  styles.loaderText
                }
              >
                Loading addresses...
              </Text>
            </View>
          ) : addresses.length ===
            0 ? (
            <View
              style={
                styles.emptyAddress
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No saved address
              </Text>

              <Text
                style={
                  styles.emptySubtext
                }
              >
                Add a delivery address to continue.
              </Text>

              <TouchableOpacity
                style={
                  styles.addAddressButton
                }
                onPress={() =>
                  setAddAddressVisible(
                    true
                  )
                }
              >
                <Text
                  style={
                    styles.addAddressButtonText
                  }
                >
                  + Add Address
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((item) => {
              const selected =
                Number(
                  selectedAddressId
                ) ===
                Number(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.addressCard,
                    selected &&
                      styles.addressCardSelected,
                  ]}
                  onPress={() =>
                    setSelectedAddressId(
                      Number(item.id)
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={
                      styles.addressTop
                    }
                  >
                    <View
                      style={
                        styles.radio
                      }
                    >
                      {selected && (
                        <View
                          style={
                            styles.radioDot
                          }
                        />
                      )}
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
                        numberOfLines={1}
                      >
                        {item.full_name}
                      </Text>

                      <Text
                        style={
                          styles.addressPhone
                        }
                      >
                        {item.phone}
                      </Text>
                    </View>

                    {selected && (
                      <Text
                        style={
                          styles.selectedText
                        }
                      >
                        ✓ Selected
                      </Text>
                    )}
                  </View>

                  <Text
                    style={
                      styles.addressText
                    }
                    numberOfLines={2}
                  >
                    {item.address_line}
                  </Text>

                  <Text
                    style={
                      styles.addressLocation
                    }
                    numberOfLines={1}
                  >
                    {item.city},{' '}
                    {item.state} -{' '}
                    {item.pincode}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* =================================================
            PAYMENT
        ================================================= */}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Payment Method
          </Text>

          {/* RAZORPAY */}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod ===
                'Razorpay' &&
                styles.paymentOptionActive,
            ]}
            onPress={() =>
              setPaymentMethod(
                'Razorpay'
              )
            }
          >
            <Text
              style={styles.paymentIcon}
            >
              💳
            </Text>

            <View
              style={styles.paymentInfo}
            >
              <Text
                style={
                  styles.paymentTitle
                }
              >
                Razorpay
              </Text>

              <Text
                style={
                  styles.paymentSubtext
                }
              >
                UPI, Cards, Net Banking & Wallets
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  'Razorpay' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod ===
                'Razorpay' && (
                <View
                  style={
                    styles.radioDot
                  }
                />
              )}
            </View>
          </TouchableOpacity>

          {/* COD */}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod ===
                'Cash on Delivery' &&
                styles.paymentOptionActive,
            ]}
            onPress={() =>
              setPaymentMethod(
                'Cash on Delivery'
              )
            }
          >
            <Text
              style={styles.paymentIcon}
            >
              💵
            </Text>

            <View
              style={styles.paymentInfo}
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
                Pay when your order arrives
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod ===
                  'Cash on Delivery' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod ===
                'Cash on Delivery' && (
                <View
                  style={
                    styles.radioDot
                  }
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* =================================================
            PLACE ORDER
        ================================================= */}

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            processing &&
              styles.disabledButton,
          ]}
          onPress={placeOrder}
          disabled={processing}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator
              color="#fff"
            />
          ) : (
            <Text
              style={
                styles.placeOrderText
              }
            >
              {paymentMethod ===
              'Razorpay'
                ? `Pay ₹${Number(
                    cartTotal
                  ).toLocaleString(
                    'en-IN'
                  )}`
                : `Place Order • ₹${Number(
                    cartTotal
                  ).toLocaleString(
                    'en-IN'
                  )}`}
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{ height: 40 }}
        />
      </ScrollView>

      {/* =================================================
          ADD ADDRESS MODAL
      ================================================= */}

      <Modal
        visible={
          addAddressVisible
        }
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!savingAddress) {
            setAddAddressVisible(
              false
            );
          }
        }}
      >
        {/* KEYBOARD FIX START */}

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
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.modalContainer
              }
            >
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
                  Add New Address
                </Text>

                <TouchableOpacity
                  disabled={
                    savingAddress
                  }
                  onPress={() =>
                    setAddAddressVisible(
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
                style={styles.modalScroll}
                contentContainerStyle={
                  styles.modalScrollContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  editable={
                    !savingAddress
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(text) =>
                    setPhone(
                      text
                        .replace(
                          /[^0-9]/g,
                          ''
                        )
                        .slice(0, 10)
                    )
                  }
                  maxLength={10}
                  editable={
                    !savingAddress
                  }
                />

                <TextInput
                  style={[
                    styles.input,
                    styles.addressInput,
                  ]}
                  placeholder="Full Address"
                  placeholderTextColor="#999"
                  multiline
                  value={address}
                  onChangeText={setAddress}
                  editable={
                    !savingAddress
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#999"
                  value={city}
                  onChangeText={setCity}
                  editable={
                    !savingAddress
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#999"
                  value={state}
                  onChangeText={setState}
                  editable={
                    !savingAddress
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Pincode"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={pincode}
                  onChangeText={(text) =>
                    setPincode(
                      text
                        .replace(
                          /[^0-9]/g,
                          ''
                        )
                        .slice(0, 6)
                    )
                  }
                  maxLength={6}
                  editable={
                    !savingAddress
                  }
                />

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    savingAddress &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    saveNewAddress
                  }
                  disabled={
                    savingAddress
                  }
                >
                  {savingAddress ? (
                    <ActivityIndicator
                      color="#fff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Save Address
                    </Text>
                  )}
                </TouchableOpacity>

                <View
                  style={{
                    height: 30,
                  }}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* KEYBOARD FIX END */}
      </Modal>
    </View>
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

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },

  headerSpace: {
    width: 42,
  },

  scroll: {
    flex: 1,
  },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 13,
    borderRadius: 13,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181818',
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  addText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },

  // =====================================================
  // ORDER
  // =====================================================

  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  itemQuantity: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 9,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },

  totalPrice: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111',
  },

  // =====================================================
  // ADDRESS
  // =====================================================

  addressCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
    backgroundColor: '#ffffff',
  },

  addressCardSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
  },

  addressTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  addressInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 6,
  },

  addressName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
  },

  addressPhone: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  selectedText: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '800',
  },

  addressText: {
    marginTop: 6,
    fontSize: 11,
    color: '#444',
    lineHeight: 16,
  },

  addressLocation: {
    marginTop: 2,
    fontSize: 11,
    color: '#666',
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

  loaderBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  loaderText: {
    marginTop: 7,
    color: '#777',
    fontSize: 12,
  },

  emptyAddress: {
    alignItems: 'center',
    paddingVertical: 15,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  emptySubtext: {
    marginTop: 4,
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
  },

  addAddressButton: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },

  addAddressButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  // =====================================================
  // PAYMENT
  // =====================================================

  paymentOption: {
    minHeight: 65,
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

  paymentInfo: {
    flex: 1,
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

  // =====================================================
  // PLACE ORDER
  // =====================================================

  placeOrderButton: {
    marginHorizontal: 12,
    marginTop: 10,
    height: 53,
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
    opacity: 0.6,
  },

  // =====================================================
  // MODAL
  // =====================================================

  modalKeyboard: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 17,

    // KEYBOARD FIX
    height: '90%',
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },

  closeText: {
    fontSize: 31,
    color: '#555',
  },

  // KEYBOARD FIX
  modalScroll: {
    flex: 1,
  },

  // KEYBOARD FIX
  modalScrollContent: {
    paddingBottom: 30,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 13,
    color: '#222',
    backgroundColor: '#fff',
    marginBottom: 10,
  },

  addressInput: {
    height: 80,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  saveButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 9,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});