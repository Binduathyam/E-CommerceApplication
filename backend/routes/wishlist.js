const express = require('express');
const db = require('../db');

const router = express.Router();

// GET user's wishlist
router.get('/:userId', async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT
        wishlist_items.id,
        wishlist_items.user_id,
        wishlist_items.product_id,
        products.name,
        products.price,
        products.category,
        products.image,
        products.description
       FROM wishlist_items
       JOIN products
         ON wishlist_items.product_id = products.id
       WHERE wishlist_items.user_id = ?
       ORDER BY wishlist_items.id DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      wishlist: items,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
    });
  }
});

// ADD product to wishlist
router.post('/', async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required',
      });
    }

    await db.query(
      `INSERT INTO wishlist_items
        (user_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
        product_id = VALUES(product_id)`,
      [user_id, product_id]
    );

    res.json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error) {
    console.error('Add wishlist error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
    });
  }
});

// REMOVE product from wishlist
router.delete('/:productId', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
      });
    }

    await db.query(
      `DELETE FROM wishlist_items
       WHERE user_id = ? AND product_id = ?`,
      [user_id, req.params.productId]
    );

    res.json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Remove wishlist error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
    });
  }
});

module.exports = router;