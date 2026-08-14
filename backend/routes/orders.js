const express = require("express");
const db = require("../db");

const router = express.Router();

// =========================
// CREATE ORDER
// =========================

router.post("/", async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const {
      user_id,
      address_id,
      total_amount,
      payment_method,
      items,
    } = req.body;

    if (
      !user_id ||
      !address_id ||
      total_amount === undefined ||
      !payment_method ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing order details",
      });
    }

    await connection.beginTransaction();

    // Create order
    const [orderResult] = await connection.query(
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
        payment_method,
        "Pending",
        "Placed",
      ]
    );

    const orderId = orderResult.insertId;

    // Create order items
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

    // Remove purchased items from cart
    await connection.query(
      `DELETE FROM cart_items
       WHERE user_id = ?`,
      [user_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order_id: orderId,
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });

  } finally {

    if (connection) {
      connection.release();
    }

  }
});


// =========================
// GET ORDER ITEMS
// IMPORTANT: KEEP THIS BEFORE /:userId
// =========================

router.get("/:orderId/items", async (req, res) => {
  try {

    const [items] = await db.query(
      `SELECT
        order_items.id,
        order_items.order_id,
        order_items.product_id,
        order_items.quantity,
        order_items.price,
        products.name,
        products.image,
        products.category

       FROM order_items

       JOIN products
         ON order_items.product_id = products.id

       WHERE order_items.order_id = ?`,
      [req.params.orderId]
    );

    res.json({
      success: true,
      items,
    });

  } catch (error) {

    console.error(
      "Get order items error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch order items",
    });

  }
});


// =========================
// GET USER ORDERS
// =========================

router.get("/:userId", async (req, res) => {
  try {

    const [orders] = await db.query(
      `SELECT
        orders.id,
        orders.user_id,
        orders.address_id,
        orders.total_amount,
        orders.payment_method,
        orders.payment_status,
        orders.order_status,
        orders.created_at,

        addresses.full_name,
        addresses.phone,
        addresses.address_line,
        addresses.city,
        addresses.state,
        addresses.pincode

       FROM orders

       JOIN addresses
         ON orders.address_id = addresses.id

       WHERE orders.user_id = ?

       ORDER BY orders.id DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      orders,
    });

  } catch (error) {

    console.error(
      "Get orders error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });

  }
});


module.exports = router;