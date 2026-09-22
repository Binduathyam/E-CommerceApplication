const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// =====================================================
// RAZORPAY INSTANCE
// =====================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// CREATE RAZORPAY TEST ORDER
// =====================================================

router.post('/create-order', async (req, res) => {
  try {
    const {
      user_id,
      total_amount,
    } = req.body;

    if (!user_id || total_amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'User ID and amount are required',
      });
    }

    const amount = Number(total_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount',
      });
    }

    // Razorpay expects amount in paise
    const amountInPaise = Math.round(amount * 100);

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `shopease_${user_id}_${Date.now()}`,
        notes: {
          user_id: String(user_id),
        },
      });

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',

      key_id: process.env.RAZORPAY_KEY_ID,

      razorpay_order_id:
        razorpayOrder.id,

      amount: razorpayOrder.amount,

      currency:
        razorpayOrder.currency,
    });
  } catch (error) {
    console.error(
      'Create Razorpay order error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Failed to create payment order',
    });
  }
});

// =====================================================
// VERIFY PAYMENT + CREATE SHOPEase ORDER
// =====================================================

router.post('/verify', async (req, res) => {
  let connection;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      user_id,
      address_id,
      total_amount,
      items,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !user_id ||
      !address_id ||
      total_amount === undefined ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing payment verification details',
      });
    }

    // -------------------------------------------------
    // VERIFY RAZORPAY SIGNATURE
    // -------------------------------------------------

    const generatedSignature =
      crypto
        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest('hex');

    const isSignatureValid =
      generatedSignature ===
      razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message:
          'Payment verification failed',
      });
    }

    // -------------------------------------------------
    // DATABASE TRANSACTION
    // -------------------------------------------------

    connection =
      await db.getConnection();

    await connection.beginTransaction();

    // -------------------------------------------------
    // CREATE SHOPEase ORDER
    // -------------------------------------------------

    const [orderResult] =
      await connection.query(
        `INSERT INTO orders
        (
          user_id,
          address_id,
          total_amount,
          payment_method,
          payment_status,
          order_status
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          address_id,
          total_amount,
          'Razorpay',
          'Paid',
          'Placed',
        ]
      );

    const orderId =
      orderResult.insertId;


    

    // -------------------------------------------------
    // CREATE ORDER ITEMS
    // -------------------------------------------------

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items
        (
          order_id,
          product_id,
          quantity,
          price
        )
        VALUES (?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          item.price,
        ]
      );
    }

    // -------------------------------------------------
    // CLEAR CART
    // -------------------------------------------------

    await connection.query(
      `DELETE FROM cart_items
       WHERE user_id = ?`,
      [user_id]
    );

    // -------------------------------------------------
    // COMMIT
    // -------------------------------------------------

    await connection.commit();

    res.status(201).json({
      success: true,

      message:
        'Payment verified and order created successfully',

      order_id: orderId,

      payment_id:
        razorpay_payment_id,

      payment_status: 'Paid',

      order_status: 'Placed',
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'Payment verification error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Payment verification failed',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;