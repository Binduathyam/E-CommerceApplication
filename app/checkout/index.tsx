import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';

export default function CheckoutScreen() {
  const router = useRouter();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  const { addOrder } = useOrders();

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [city, setCity] = React.useState('');
  const [pincode, setPincode] = React.useState('');

  const [paymentMethod, setPaymentMethod] =
    React.useState('Cash on Delivery');

  // CARD
  const [cardNumber, setCardNumber] =
    React.useState('');
  const [cardName, setCardName] =
    React.useState('');
  const [expiryDate, setExpiryDate] =
    React.useState('');
  const [cvv, setCvv] =
    React.useState('');

  // UPI
  const [upiId, setUpiId] =
    React.useState('');

  // NET BANKING
  const [selectedBank, setSelectedBank] =
    React.useState('');
  const [accountHolder, setAccountHolder] =
    React.useState('');
  const [accountNumber, setAccountNumber] =
    React.useState('');

  const banks = [
    'SBI',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Canara Bank',
  ];

  const formatCardNumber = (text: string) => {
    const numbers = text
      .replace(/[^0-9]/g, '')
      .slice(0, 16);

    return numbers.replace(
      /(.{4})/g,
      '$1 '
    ).trim();
  };

  const formatExpiryDate = (text: string) => {
    const numbers = text
      .replace(/[^0-9]/g, '')
      .slice(0, 4);

    if (numbers.length > 2) {
      return (
        numbers.slice(0, 2) +
        '/' +
        numbers.slice(2)
      );
    }

    return numbers;
  };

  const placeOrder = () => {
    // BASIC DETAILS
    if (
      !name.trim() ||
      !phone ||
      !address.trim() ||
      !city.trim() ||
      !pincode
    ) {
      alert('Please fill all address details');
      return;
    }

    // PHONE
    if (!/^\d{10}$/.test(phone)) {
      alert(
        'Please enter a valid 10-digit phone number'
      );
      return;
    }

    // PINCODE
    if (!/^\d{6}$/.test(pincode)) {
      alert(
        'Please enter a valid 6-digit pincode'
      );
      return;
    }

    // CARD VALIDATION
    if (paymentMethod === 'Card') {
      const cleanCardNumber =
        cardNumber.replace(/\s/g, '');

      if (!/^\d{16}$/.test(cleanCardNumber)) {
        alert(
          'Please enter a valid 16-digit card number'
        );
        return;
      }

      if (!cardName.trim()) {
        alert(
          'Please enter card holder name'
        );
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        alert(
          'Please enter expiry date as MM/YY'
        );
        return;
      }

      if (!/^\d{3}$/.test(cvv)) {
        alert(
          'Please enter a valid 3-digit CVV'
        );
        return;
      }
    }

    // UPI VALIDATION
    if (paymentMethod === 'UPI') {
      if (!upiId.trim()) {
        alert('Please enter your UPI ID');
        return;
      }

      if (
        !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(
          upiId.trim()
        )
      ) {
        alert(
          'Please enter a valid UPI ID'
        );
        return;
      }
    }

    // NET BANKING VALIDATION
    if (paymentMethod === 'Net Banking') {
      if (!selectedBank) {
        alert('Please select your bank');
        return;
      }

      if (!accountHolder.trim()) {
        alert(
          'Please enter account holder name'
        );
        return;
      }

      if (!/^\d{9,18}$/.test(accountNumber)) {
        alert(
          'Please enter a valid account number'
        );
        return;
      }
    }

    // SAVE ORDER
    addOrder({
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN'),
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: cartTotal,
      status: 'Confirmed',
    });

    // CLEAR CART
    clearCart();

    // SUCCESS
    router.push('/order-success' as any);
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Checkout
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* DELIVERY ADDRESS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Delivery Address
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={phone}
            onChangeText={(text) =>
              setPhone(
                text.replace(/[^0-9]/g, '')
              )
            }
            maxLength={10}
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
          />

          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
          />

          <TextInput
            style={styles.input}
            placeholder="Pincode"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={pincode}
            onChangeText={(text) =>
              setPincode(
                text.replace(/[^0-9]/g, '')
              )
            }
            maxLength={6}
          />
        </View>

        {/* PRODUCTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Items
          </Text>

          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>
              No items in cart
            </Text>
          ) : (
            cartItems.map((item) => (
              <View
                key={item.id}
                style={styles.itemRow}
              >
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {item.name}
                  </Text>

                  <Text style={styles.itemQuantity}>
                    Quantity: {item.quantity}
                  </Text>
                </View>

                <Text style={styles.itemPrice}>
                  ₹
                  {(
                    item.price * item.quantity
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* ORDER SUMMARY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Summary
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Subtotal
            </Text>

            <Text style={styles.value}>
              ₹{cartTotal.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Delivery
            </Text>

            <Text style={styles.free}>
              FREE
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalValue}>
              ₹{cartTotal.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          {/* CARD */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'Card' &&
                styles.paymentOptionActive,
            ]}
            onPress={() =>
              setPaymentMethod('Card')
            }
          >
            <Text style={styles.paymentIcon}>
              💳
            </Text>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Card
              </Text>

              <Text style={styles.paymentSubtext}>
                Credit or Debit Card
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === 'Card' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod === 'Card' && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>

          {/* CARD DETAILS */}
          {paymentMethod === 'Card' && (
            <View style={styles.detailsBox}>

              <TextInput
                style={styles.input}
                placeholder="Card Number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={(text) =>
                  setCardNumber(
                    formatCardNumber(text)
                  )
                }
                maxLength={19}
              />

              <TextInput
                style={styles.input}
                placeholder="Card Holder Name"
                placeholderTextColor="#999"
                value={cardName}
                onChangeText={setCardName}
              />

              <View style={styles.twoInputs}>

                <TextInput
                  style={[
                    styles.input,
                    styles.smallInput,
                  ]}
                  placeholder="MM/YY"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={expiryDate}
                  onChangeText={(text) =>
                    setExpiryDate(
                      formatExpiryDate(text)
                    )
                  }
                  maxLength={5}
                />

                <TextInput
                  style={[
                    styles.input,
                    styles.smallInput,
                  ]}
                  placeholder="CVV"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  secureTextEntry
                  value={cvv}
                  onChangeText={(text) =>
                    setCvv(
                      text
                        .replace(
                          /[^0-9]/g,
                          ''
                        )
                        .slice(0, 3)
                    )
                  }
                  maxLength={3}
                />

              </View>
            </View>
          )}

          {/* UPI */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'UPI' &&
                styles.paymentOptionActive,
            ]}
            onPress={() =>
              setPaymentMethod('UPI')
            }
          >
            <Text style={styles.paymentIcon}>
              📱
            </Text>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                UPI
              </Text>

              <Text style={styles.paymentSubtext}>
                Google Pay, PhonePe, Paytm
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === 'UPI' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod === 'UPI' && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>

          {/* UPI DETAILS */}
          {paymentMethod === 'UPI' && (
            <View style={styles.detailsBox}>
              <TextInput
                style={styles.input}
                placeholder="Enter UPI ID"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={upiId}
                onChangeText={setUpiId}
              />

              <Text style={styles.exampleText}>
                Example: yourname@upi
              </Text>
            </View>
          )}

          {/* NET BANKING */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'Net Banking' &&
                styles.paymentOptionActive,
            ]}
            onPress={() =>
              setPaymentMethod('Net Banking')
            }
          >
            <Text style={styles.paymentIcon}>
              🏦
            </Text>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Net Banking
              </Text>

              <Text style={styles.paymentSubtext}>
                Pay using your bank account
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                paymentMethod === 'Net Banking' &&
                  styles.radioActive,
              ]}
            >
              {paymentMethod === 'Net Banking' && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>

          {/* NET BANKING DETAILS */}
          {paymentMethod === 'Net Banking' && (
            <View style={styles.detailsBox}>

              <Text style={styles.detailsLabel}>
                Select Bank
              </Text>

              <View style={styles.bankList}>
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={[
                      styles.bankButton,
                      selectedBank === bank &&
                        styles.bankButtonActive,
                    ]}
                    onPress={() =>
                      setSelectedBank(bank)
                    }
                  >
                    <Text
                      style={[
                        styles.bankText,
                        selectedBank === bank &&
                          styles.bankTextActive,
                      ]}
                    >
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Account Holder Name"
                placeholderTextColor="#999"
                value={accountHolder}
                onChangeText={setAccountHolder}
              />

              <TextInput
                style={styles.input}
                placeholder="Account Number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={(text) =>
                  setAccountNumber(
                    text.replace(
                      /[^0-9]/g,
                      ''
                    )
                  )
                }
                maxLength={18}
              />
            </View>
          )}

          {/* CASH ON DELIVERY */}
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
            <Text style={styles.paymentIcon}>
              💵
            </Text>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Cash on Delivery
              </Text>

              <Text style={styles.paymentSubtext}>
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
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* PLACE ORDER */}
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={placeOrder}
        >
          <Text style={styles.placeOrderText}>
            Place Order • ₹
            {cartTotal.toLocaleString('en-IN')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
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

  scroll: {
    flex: 1,
  },

  section: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
    marginBottom: 15,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222',
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },

  addressInput: {
    height: 85,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  itemDetails: {
    flex: 1,
  },

  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },

  itemQuantity: {
    marginTop: 5,
    fontSize: 12,
    color: '#777',
  },

  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7c3aed',
  },

  emptyText: {
    color: '#777',
    fontSize: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  label: {
    color: '#666',
    fontSize: 14,
  },

  value: {
    color: '#222',
    fontSize: 14,
    fontWeight: '600',
  },

  free: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 5,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181818',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7c3aed',
  },

  paymentOption: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },

  paymentOptionActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
  },

  paymentIcon: {
    fontSize: 25,
    width: 40,
  },

  paymentInfo: {
    flex: 1,
    marginLeft: 8,
  },

  paymentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },

  paymentSubtext: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioActive: {
    borderColor: '#7c3aed',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
  },

  detailsBox: {
    backgroundColor: '#faf7ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  twoInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  smallInput: {
    width: '48%',
    marginBottom: 0,
  },

  exampleText: {
    fontSize: 12,
    color: '#777',
    marginTop: -3,
    marginBottom: 4,
  },

  detailsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
  },

  bankList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  bankButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
  },

  bankButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },

  bankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },

  bankTextActive: {
    color: '#ffffff',
  },

  placeOrderButton: {
    marginHorizontal: 12,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeOrderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});