const express = require("express");
const db = require("../db");

const router = express.Router();

/* =========================================================
   GET USER CART
========================================================= */

router.get("/:userId", async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT
        cart_items.id,
        cart_items.user_id,
        cart_items.product_id,
        cart_items.quantity,

        cart_items.price AS cart_price,
        cart_items.gst_rate AS cart_gst_rate,

        cart_items.selected_size,
        cart_items.variant_id,

        products.name,
        products.price AS product_price,
        products.original_price,
        products.discount,
        products.gst_rate AS product_gst_rate,
        products.category,
        products.image

       FROM cart_items

       JOIN products
         ON cart_items.product_id = products.id

       WHERE cart_items.user_id = ?

       ORDER BY cart_items.id DESC`,
      [req.params.userId]
    );

    const cart = items.map((item) => ({
      // IMPORTANT:
      // This is the cart_items table ID.
      // Frontend uses this as cartItemId.
      id: Number(item.id),
      cartItemId: Number(item.id),

      user_id: Number(item.user_id),

      product_id: Number(item.product_id),

      quantity: Number(item.quantity) || 1,

      name: item.name,

      price:
        Number(item.cart_price) > 0
          ? Number(item.cart_price)
          : Number(item.product_price) || 0,

      original_price:
        Number(item.original_price) || 0,

      discount:
        Number(item.discount) || 0,

      gst_rate:
        Number(item.cart_gst_rate) > 0
          ? Number(item.cart_gst_rate)
          : Number(item.product_gst_rate) || 0,

      category: item.category,

      image: item.image,

      // =====================================================
      // SELECTED SIZE
      // =====================================================

      selected_size:
        item.selected_size || null,

      selectedSize:
        item.selected_size || null,

      // =====================================================
      // VARIANT ID
      // =====================================================

      variant_id:
        item.variant_id !== null
          ? Number(item.variant_id)
          : null,

      variantId:
        item.variant_id !== null
          ? Number(item.variant_id)
          : null,
    }));

    res.json({
      success: true,
      cart,
    });

  } catch (error) {

    console.error(
      "Get cart error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
});


/* =========================================================
   ADD PRODUCT TO CART
========================================================= */

router.post("/", async (req, res) => {
  try {

    const {
      user_id,
      product_id,
      quantity = 1,
      price = 0,
      gst_rate = 0,
      selected_size = null,
      variant_id = null,
    } = req.body;


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!user_id || !product_id) {

      return res.status(400).json({
        success: false,
        message:
          "user_id and product_id are required",
      });

    }


    const finalQuantity =
      Number(quantity) > 0
        ? Number(quantity)
        : 1;


    const finalPrice =
      Number(price) || 0;


    const finalGstRate =
      Number(gst_rate) || 0;


    const finalVariantId =
      variant_id !== null &&
      variant_id !== undefined &&
      variant_id !== "" &&
      Number(variant_id) > 0
        ? Number(variant_id)
        : null;


    const finalSelectedSize =
      selected_size !== null &&
      selected_size !== undefined &&
      selected_size !== ""
        ? String(selected_size)
        : null;


    /* =====================================================
       CHECK EXISTING CART ITEM
       
       Same:
       user + product + variant + size
    ===================================================== */

    let existingRows;


    if (finalVariantId !== null) {

      [existingRows] = await db.query(
        `SELECT
           id,
           quantity
         FROM cart_items
         WHERE user_id = ?
           AND product_id = ?
           AND variant_id = ?
           AND (
             selected_size = ?
             OR (
               selected_size IS NULL
               AND ? IS NULL
             )
           )
         LIMIT 1`,
        [
          user_id,
          product_id,
          finalVariantId,
          finalSelectedSize,
          finalSelectedSize,
        ]
      );

    } else {

      [existingRows] = await db.query(
        `SELECT
           id,
           quantity
         FROM cart_items
         WHERE user_id = ?
           AND product_id = ?
           AND variant_id IS NULL
           AND (
             selected_size = ?
             OR (
               selected_size IS NULL
               AND ? IS NULL
             )
           )
         LIMIT 1`,
        [
          user_id,
          product_id,
          finalSelectedSize,
          finalSelectedSize,
        ]
      );

    }


    /* =====================================================
       UPDATE EXISTING CART ITEM
    ===================================================== */

    if (existingRows.length > 0) {

      const existingItem =
        existingRows[0];


      await db.query(
        `UPDATE cart_items
         SET
           quantity = quantity + ?,
           price = ?,
           gst_rate = ?,
           selected_size = ?,
           variant_id = ?
         WHERE id = ?`,
        [
          finalQuantity,
          finalPrice,
          finalGstRate,
          finalSelectedSize,
          finalVariantId,
          existingItem.id,
        ]
      );

    }


    /* =====================================================
       INSERT NEW CART ITEM
    ===================================================== */

    else {

      await db.query(
        `INSERT INTO cart_items
        (
          user_id,
          product_id,
          quantity,
          price,
          gst_rate,
          selected_size,
          variant_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          product_id,
          finalQuantity,
          finalPrice,
          finalGstRate,
          finalSelectedSize,
          finalVariantId,
        ]
      );

    }


    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json({
      success: true,
      message:
        "Product added to cart",
    });

  } catch (error) {

    console.error(
      "Add cart error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to add product to cart",
    });

  }
});


/* =========================================================
   UPDATE CART QUANTITY
========================================================= */

router.put("/:cartItemId", async (req, res) => {
  try {

    const {
      user_id,
      quantity,
    } = req.body;


    const cartItemId =
      Number(req.params.cartItemId);


    const finalQuantity =
      Number(quantity);


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !user_id ||
      !cartItemId ||
      quantity === undefined
    ) {

      return res.status(400).json({
        success: false,
        message:
          "user_id, cartItemId and quantity are required",
      });

    }


    if (
      !Number.isFinite(finalQuantity)
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid quantity",
      });

    }


    /* =====================================================
       REMOVE WHEN QUANTITY <= 0
    ===================================================== */

    if (finalQuantity <= 0) {

      const [result] =
        await db.query(
          `DELETE FROM cart_items
           WHERE id = ?
             AND user_id = ?`,
          [
            cartItemId,
            user_id,
          ]
        );


      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Cart item not found",
        });

      }


      return res.json({
        success: true,
        message:
          "Product removed from cart",
      });

    }


    /* =====================================================
       UPDATE CART ITEM
    ===================================================== */

    const [result] =
      await db.query(
        `UPDATE cart_items
         SET quantity = ?
         WHERE id = ?
           AND user_id = ?`,
        [
          finalQuantity,
          cartItemId,
          user_id,
        ]
      );


    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message:
          "Cart item not found",
      });

    }


    res.json({
      success: true,
      message:
        "Cart quantity updated",
    });

  } catch (error) {

    console.error(
      "Update cart error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update cart",
    });

  }
});


/* =========================================================
   REMOVE PRODUCT FROM CART
========================================================= */

router.delete("/:cartItemId", async (req, res) => {
  try {

    const {
      user_id,
    } = req.body;


    const cartItemId =
 Number(req.params.cartItemId);


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !user_id ||
      !cartItemId
    ) {

      return res.status(400).json({
        success: false,
        message:
          "user_id and cartItemId are required",
      });

    }


    /* =====================================================
       DELETE USING cart_items.id
    ===================================================== */

    const [result] =
      await db.query(
        `DELETE FROM cart_items
         WHERE id = ?
           AND user_id = ?`,
        [
          cartItemId,
          user_id,
        ]
      );


    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message:
          "Cart item not found",
      });

    }


    res.json({
      success: true,
      message:
        "Product removed from cart",
    });

  } catch (error) {

    console.error(
      "Remove cart error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to remove product from cart",
    });

  }
});


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;