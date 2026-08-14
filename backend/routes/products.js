const express = require('express');
const db = require('../db');

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT * FROM products ORDER BY id DESC'
    );

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Products error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product: products[0],
    });
  } catch (error) {
    console.error('Product error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
});

module.exports = router;