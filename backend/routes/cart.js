const express = require('express');
const db = require('../db');

const router = express.Router();

// GET user's cart
router.get('/:userId', async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT 
        cart_items.id,
        cart_items.user_id,
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price,
        products.category,
        products.image
       FROM cart_items
       JOIN products
         ON cart_items.product_id = products.id
       WHERE cart_items.user_id = ?
       ORDER BY cart_items.id DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      cart: items,
    });
  } catch (error) {
    console.error('Get cart error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
    });
  }
});

// ADD product to cart
router.post('/', async (req, res) => {
  try {
    const { user_id, product_id, quantity = 1 } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required',
      });
    }

    const [result] = await db.query(
      `INSERT INTO cart_items
        (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
        quantity = quantity + VALUES(quantity)`,
      [user_id, product_id, quantity]
    );

    res.json({
      success: true,
      message: 'Product added to cart',
    });
  } catch (error) {
    console.error('Add cart error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add product to cart',
    });
  }
});

// UPDATE quantity
router.put('/:productId', async (req, res) => {
  try {
    const { user_id, quantity } = req.body;

    if (!user_id || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'user_id and quantity are required',
      });
    }

    if (quantity <= 0) {
      await db.query(
        `DELETE FROM cart_items
         WHERE user_id = ? AND product_id = ?`,
        [user_id, req.params.productId]
      );

      return res.json({
        success: true,
        message: 'Product removed from cart',
      });
    }

    await db.query(
      `UPDATE cart_items
       SET quantity = ?
       WHERE user_id = ? AND product_id = ?`,
      [quantity, user_id, req.params.productId]
    );

    res.json({
      success: true,
      message: 'Cart quantity updated',
    });
  } catch (error) {
    console.error('Update cart error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
    });
  }
});

// REMOVE product from cart
router.delete('/:productId', async (req, res) => {
  try {
    const { user_id } = req.body;

    await db.query(
      `DELETE FROM cart_items
       WHERE user_id = ? AND product_id = ?`,
      [user_id, req.params.productId]
    );

    res.json({
      success: true,
      message: 'Product removed from cart',
    });
  } catch (error) {
    console.error('Remove cart error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to remove product from cart',
    });
  }
});

module.exports = router;