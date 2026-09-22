import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL } from '../../config/api';

type ProductItem = {
  id?: number | string;
  product_id?: number | string;
  product_name?: string;
  name?: string;
  title?: string;
  quantity?: number;
  price?: number | string;
  unit_price?: number | string;
  total_price?: number | string;
  subtotal?: number | string;
  image?: string;
  image_url?: string;
};

type Order = {
  id: number | string;

  order_number?: string;
  order_id?: string;

  user_id?: number | string;

  status?: string;
  order_status?: string;

  payment_method?: string;
  payment_status?: string;

  total_amount?: number | string;
  subtotal?: number | string;
  delivery_charge?: number | string;
  shipping_charge?: number | string;
  discount?: number | string;

  created_at?: string;
  order_date?: string;

  customer_name?: string;
  full_name?: string;
  customer_phone?: string;
  phone?: string;

  address_line?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postal_code?: string;

  items?: ProductItem[];

  [key: string]: any;
};

export default function OrderDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();
  const id = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const getLoggedInUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('loggedInUser');

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.log('Error reading loggedInUser:', error);
      return null;
    }
  };

  const getAuthToken = async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.log('Error reading authToken:', error);
      return null;
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);

      if (!id) {
        Alert.alert('Error', 'Order ID is missing.');
        return;
      }

      const user = await getLoggedInUser();
      const token = await getAuthToken();

      if (!user) {
        Alert.alert('Login Required', 'Please login again.');
        return;
      }

      const userId =
        user.id ??
        user.user_id ??
        user.userId;

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId),
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data = await response.json();

      console.log('Order details response:', data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Failed to load order details.'
        );
      }

      /*
        Backend may return:
        1. order object directly
        2. { order: {...} }
        3. { data: {...} }
      */

      const fetchedOrder =
        data?.order ||
        data?.data ||
        data;

      if (!fetchedOrder) {
        throw new Error('Order details not found.');
      }

      setOrder(fetchedOrder);
    } catch (error: any) {
      console.log('Load order error:', error);

      Alert.alert(
        'Error',
        error?.message || 'Unable to load order details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getNumber = (value: any) => {
    const num = Number(value);

    if (Number.isNaN(num)) {
      return 0;
    }

    return num;
  };

  const formatCurrency = (value: any) => {
    return `₹${getNumber(value).toFixed(2)}`;
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) {
      return 'N/A';
    }

    try {
      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return String(dateValue);
      }

      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateValue);
    }
  };

  const getOrderNumber = () => {
    return (
      order?.order_number ||
      order?.order_id ||
      `#${order?.id ?? ''}`
    );
  };

  const getOrderStatus = () => {
    return (
      order?.status ||
      order?.order_status ||
      'Pending'
    );
  };

  const getPaymentMethod = () => {
    return (
      order?.payment_method ||
      order?.payment_type ||
      'N/A'
    );
  };

  const getPaymentStatus = () => {
    return (
      order?.payment_status ||
      'N/A'
    );
  };

  const getCustomerName = () => {
    return (
      order?.customer_name ||
      order?.full_name ||
      'Customer'
    );
  };

  const getCustomerPhone = () => {
    return (
      order?.customer_phone ||
      order?.phone ||
      ''
    );
  };

  const getAddressLine = () => {
    return (
      order?.address_line ||
      order?.address ||
      ''
    );
  };

  const getPincode = () => {
    return (
      order?.pincode ||
      order?.postal_code ||
      ''
    );
  };

  const items = useMemo(() => {
    if (!Array.isArray(order?.items)) {
      return [];
    }

    return order.items;
  }, [order]);

  const calculateItemTotal = (item: ProductItem) => {
    const quantity = getNumber(item.quantity || 1);

    if (item.total_price !== undefined) {
      return getNumber(item.total_price);
    }

    if (item.subtotal !== undefined) {
      return getNumber(item.subtotal);
    }

    const unitPrice = getNumber(
      item.price ??
        item.unit_price ??
        0
    );

    return quantity * unitPrice;
  };

  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + calculateItemTotal(item);
    }, 0);
  }, [items]);

  const subtotal =
    order?.subtotal !== undefined
      ? getNumber(order.subtotal)
      : calculatedSubtotal;

  const deliveryCharge = getNumber(
    order?.delivery_charge ??
      order?.shipping_charge ??
      0
  );

  const discount = getNumber(
    order?.discount ?? 0
  );

  const totalAmount =
    order?.total_amount !== undefined
      ? getNumber(order.total_amount)
      : subtotal + deliveryCharge - discount;

  const orderDate =
    order?.created_at ||
    order?.order_date;

  const createInvoiceHtml = () => {
    if (!order) {
      return '';
    }

    const escapeHtml = (value: any) => {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const invoiceRows = items
      .map((item, index) => {
        const productName =
          item.product_name ||
          item.name ||
          item.title ||
          `Product ${index + 1}`;

        const quantity =
          getNumber(item.quantity || 1);

        const unitPrice =
          getNumber(
            item.price ??
              item.unit_price ??
              0
          );

        const lineTotal =
          calculateItemTotal(item);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(productName)}</td>
            <td style="text-align:center;">
              ${quantity}
            </td>
            <td style="text-align:right;">
              ₹${unitPrice.toFixed(2)}
            </td>
            <td style="text-align:right;">
              ₹${lineTotal.toFixed(2)}
            </td>
          </tr>
        `;
      })
      .join('');

    const addressParts = [
      getAddressLine(),
      order?.city,
      order?.state,
      getPincode(),
    ].filter(Boolean);

    const customerAddress =
      addressParts.length > 0
        ? addressParts.join(', ')
        : 'Not available';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 30px;
              color: #222;
              background: #ffffff;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #222;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }

            .shop-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 6px;
            }

            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              text-align: right;
            }

            .invoice-label {
              font-size: 13px;
              color: #666;
              margin-bottom: 4px;
            }

            .info-section {
              display: flex;
              justify-content: space-between;
              gap: 30px;
              margin-bottom: 25px;
            }

            .info-box {
              width: 48%;
            }

            .section-title {
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
            }

            .info-text {
              font-size: 13px;
              line-height: 1.6;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }

            th {
              background: #f1f1f1;
              font-weight: bold;
              padding: 10px;
              border: 1px solid #ddd;
              font-size: 13px;
              text-align: left;
            }

            td {
              padding: 10px;
              border: 1px solid #ddd;
              font-size: 13px;
            }

            .summary {
              width: 320px;
              margin-left: auto;
              margin-top: 22px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 7px 0;
              font-size: 14px;
            }

            .summary-total {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              margin-top: 8px;
              border-top: 2px solid #222;
              font-size: 18px;
              font-weight: bold;
            }

            .payment-box {
              margin-top: 25px;
              padding: 15px;
              border: 1px solid #ddd;
              background: #fafafa;
            }

            .footer {
              margin-top: 45px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>

        <body>

          <div class="header">
            <div>
              <div class="shop-name">
                ShopEase
              </div>

              <div class="info-text">
                Your trusted online shopping partner
              </div>
            </div>

            <div>
              <div class="invoice-title">
                INVOICE
              </div>

              <div class="invoice-label">
                Order ID
              </div>

              <div>
                ${escapeHtml(getOrderNumber())}
              </div>
            </div>
          </div>

          <div class="info-section">

            <div class="info-box">
              <div class="section-title">
                Customer Details
              </div>

              <div class="info-text">
                <strong>
                  ${escapeHtml(getCustomerName())}
                </strong>
                <br/>

                ${
                  getCustomerPhone()
                    ? `Phone: ${escapeHtml(
                        getCustomerPhone()
                      )}<br/>`
                    : ''
                }

                ${escapeHtml(customerAddress)}
              </div>
            </div>

            <div class="info-box">
              <div class="section-title">
                Order Details
              </div>

              <div class="info-text">
                <strong>Order Date:</strong>
                ${escapeHtml(
                  formatDate(orderDate)
                )}
                <br/>

                <strong>Status:</strong>
                ${escapeHtml(getOrderStatus())}
                <br/>

                <strong>Payment:</strong>
                ${escapeHtml(getPaymentMethod())}
                <br/>

                <strong>Payment Status:</strong>
                ${escapeHtml(getPaymentStatus())}
              </div>
            </div>

          </div>

          <table>
            <thead>
              <tr>
                <th style="width:50px;">#</th>
                <th>Product</th>
                <th style="width:90px;">
                  Qty
                </th>
                <th style="width:120px;">
                  Price
                </th>
                <th style="width:120px;">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              ${
                invoiceRows ||
                `
                  <tr>
                    <td colspan="5"
                        style="text-align:center;">
                      No products found
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>

          <div class="summary">

            <div class="summary-row">
              <span>Subtotal</span>
              <span>
                ₹${subtotal.toFixed(2)}
              </span>
            </div>

            <div class="summary-row">
              <span>Delivery Charge</span>
              <span>
                ₹${deliveryCharge.toFixed(2)}
              </span>
            </div>

            ${
              discount > 0
                ? `
                  <div class="summary-row">
                    <span>Discount</span>
                    <span>
                      -₹${discount.toFixed(2)}
                    </span>
                  </div>
                `
                : ''
            }

            <div class="summary-total">
              <span>Total</span>
              <span>
                ₹${totalAmount.toFixed(2)}
              </span>
            </div>

          </div>

          <div class="payment-box">
            <strong>
              Payment Method:
            </strong>

            ${escapeHtml(getPaymentMethod())}

            <br/>

            <strong>
              Payment Status:
            </strong>

            ${escapeHtml(getPaymentStatus())}
          </div>

          <div class="footer">
            Thank you for shopping with ShopEase.
            <br/>
            This is a computer-generated invoice.
          </div>

        </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    try {
      if (!order) {
        Alert.alert(
          'Invoice Error',
          'Order details are not available yet.'
        );
        return;
      }

      setInvoiceLoading(true);

      const html = createInvoiceHtml();

      if (!html) {
        throw new Error(
          'Unable to create invoice.'
        );
      }

      /*
        Creates a PDF file in the app cache.
      */

      const result =
        await Print.printToFileAsync({
          html,
          base64: false,
        });

      const pdfUri = result.uri;

      console.log(
        'Invoice PDF generated:',
        pdfUri
      );

      /*
        Open Android sharing/save dialog.
        From there user can save it to Files/Drive,
        WhatsApp it, email it, etc.
      */

      const sharingAvailable =
        await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(
          pdfUri,
          {
            mimeType: 'application/pdf',
            dialogTitle:
              'Download / Share ShopEase Invoice',
            UTI: 'com.adobe.pdf',
          }
        );
      } else {
        /*
          Fallback to normal device share.
        */

        await Share.share({
          message:
            `ShopEase Invoice - ${getOrderNumber()}\n` +
            `Total: ${formatCurrency(
              totalAmount
            )}`,
          url: pdfUri,
        });
      }
    } catch (error: any) {
      console.log(
        'Invoice generation error:',
        error
      );

      Alert.alert(
        'Invoice Error',
        error?.message ||
          'Unable to generate invoice.'
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.loadingText}>
          Loading order details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>
          Order not found
        </Text>

        <Text style={styles.errorText}>
          We could not load this order.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Order Details
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* ORDER SUMMARY CARD */}

        <View style={styles.card}>
          <View style={styles.orderHeaderRow}>
            <View>
              <Text style={styles.cardLabel}>
                Order ID
              </Text>

              <Text style={styles.orderId}>
                {getOrderNumber()}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {getOrderStatus()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.twoColumnRow}>

            <View style={styles.column}>
              <Text style={styles.cardLabel}>
                Order Date
              </Text>

              <Text style={styles.cardValue}>
                {formatDate(orderDate)}
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.cardLabel}>
                Payment
              </Text>

              <Text style={styles.cardValue}>
                {getPaymentMethod()}
              </Text>
            </View>

          </View>
        </View>

        {/* PRODUCTS */}

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>
            Products
          </Text>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>
              No products found.
            </Text>
          ) : (
            items.map(
              (
                item: ProductItem,
                index: number
              ) => {
                const productName =
                  item.product_name ||
                  item.name ||
                  item.title ||
                  `Product ${index + 1}`;

                const quantity =
                  getNumber(
                    item.quantity || 1
                  );

                const unitPrice =
                  getNumber(
                    item.price ??
                      item.unit_price ??
                      0
                  );

                const itemTotal =
                  calculateItemTotal(item);

                return (
                  <View
                    key={
                      String(
                        item.id ??
                          item.product_id ??
                          index
                      )
                    }
                    style={
                      styles.productRow
                    }
                  >
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
                        {productName}
                      </Text>

                      <Text
                        style={
                          styles.productQty
                        }
                      >
                        Qty: {quantity}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.productPriceBox
                      }
                    >
                      <Text
                        style={
                          styles.productUnitPrice
                        }
                      >
                        {formatCurrency(
                          unitPrice
                        )}
                      </Text>

                      <Text
                        style={
                          styles.productTotal
                        }
                      >
                        {formatCurrency(
                          itemTotal
                        )}
                      </Text>
                    </View>
                  </View>
                );
              }
            )
          )}
        </View>

        {/* DELIVERY ADDRESS */}

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>
            Delivery Address
          </Text>

          <Text style={styles.addressName}>
            {getCustomerName()}
          </Text>

          {getCustomerPhone() ? (
            <Text style={styles.addressText}>
              📞 {getCustomerPhone()}
            </Text>
          ) : null}

          {getAddressLine() ? (
            <Text style={styles.addressText}>
              {getAddressLine()}
            </Text>
          ) : null}

          {order?.city ? (
            <Text style={styles.addressText}>
              {order.city}
            </Text>
          ) : null}

          {order?.state ? (
            <Text style={styles.addressText}>
              {order.state}
            </Text>
          ) : null}

          {getPincode() ? (
            <Text style={styles.addressText}>
              {getPincode()}
            </Text>
          ) : null}

          {!getAddressLine() &&
          !order?.city &&
          !order?.state &&
          !getPincode() ? (
            <Text style={styles.emptyText}>
              Address information not available.
            </Text>
          ) : null}
        </View>

        {/* PAYMENT DETAILS */}

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>
            Payment Details
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Subtotal
            </Text>

            <Text style={styles.priceValue}>
              {formatCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Delivery Charge
            </Text>

            <Text style={styles.priceValue}>
              {formatCurrency(
                deliveryCharge
              )}
            </Text>
          </View>

          {discount > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Discount
              </Text>

              <Text
                style={[
                  styles.priceValue,
                  styles.discountText,
                ]}
              >
                -{formatCurrency(
                  discount
                )}
              </Text>
            </View>
          ) : null}

          <View style={styles.paymentDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(
                totalAmount
              )}
            </Text>
          </View>

          <View
            style={styles.paymentStatusBox}
          >
            <Text
              style={
                styles.paymentStatusLabel
              }
            >
              Payment Method
            </Text>

            <Text
              style={
                styles.paymentStatusValue
              }
            >
              {getPaymentMethod()}
            </Text>
          </View>

          <View
            style={styles.paymentStatusBox}
          >
            <Text
              style={
                styles.paymentStatusLabel
              }
            >
              Payment Status
            </Text>

            <Text
              style={
                styles.paymentStatusValue
              }
            >
              {getPaymentStatus()}
            </Text>
          </View>
        </View>

        {/* DOWNLOAD INVOICE */}

        <TouchableOpacity
          style={[
            styles.invoiceButton,
            invoiceLoading &&
              styles.disabledButton,
          ]}
          onPress={handleDownloadInvoice}
          disabled={invoiceLoading}
          activeOpacity={0.8}
        >
          {invoiceLoading ? (
            <>
              <ActivityIndicator
                color="#ffffff"
                size="small"
              />

              <Text
                style={
                  styles.invoiceButtonText
                }
              >
                Generating Invoice...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={
                  styles.invoiceIcon
                }
              >
                📄
              </Text>

              <Text
                style={
                  styles.invoiceButtonText
                }
              >
                Download Invoice
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.invoiceHint}>
          Your invoice will be generated as a PDF.
          You can save it, share it or send it to
          another app.
        </Text>

        <View style={styles.bottomSpace} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666666',
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 15,
    color: '#777777',
    textAlign: 'center',
    marginBottom: 20,
  },

  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  backIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f4f7',
  },

  backIcon: {
    fontSize: 32,
    lineHeight: 34,
    color: '#222222',
    marginTop: -2,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
  },

  headerSpacer: {
    width: 42,
  },

  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },

  orderId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 15,
  },

  twoColumnRow: {
    flexDirection: 'row',
  },

  column: {
    flex: 1,
  },

  cardValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },

  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 14,
  },

  emptyText: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 21,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  productInfo: {
    flex: 1,
    paddingRight: 12,
  },

  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    lineHeight: 20,
  },

  productQty: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },

  productPriceBox: {
    alignItems: 'flex-end',
  },

  productUnitPrice: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 3,
  },

  productTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
  },

  addressText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 21,
    marginBottom: 3,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },

  priceLabel: {
    fontSize: 14,
    color: '#666666',
  },

  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },

  discountText: {
    color: '#2e7d32',
  },

  paymentDivider: {
    height: 1,
    backgroundColor: '#dddddd',
    marginVertical: 8,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 15,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
  },

  paymentStatusBox: {
    backgroundColor: '#f7f8fa',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },

  paymentStatusLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 3,
  },

  paymentStatusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },

  invoiceButton: {
    marginHorizontal: 15,
    marginTop: 20,
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  invoiceIcon: {
    fontSize: 20,
    marginRight: 9,
  },

  invoiceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.7,
  },

  invoiceHint: {
    marginHorizontal: 25,
    marginTop: 9,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#888888',
  },

  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 10,
  },

  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 15,
  },
});