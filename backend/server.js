const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const addressRoutes = require('./routes/addresses');
const orderRoutes = require('./routes/orders');

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// API ROUTES
// =========================

app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api/cart', cartRoutes);

app.use('/api/wishlist', wishlistRoutes);

app.use('/api/addresses', addressRoutes);

app.use('/api/orders', orderRoutes);

// =========================
// HOME
// =========================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ShopEase Backend is running',
  });
});

// =========================
// DATABASE TEST
// =========================

app.get('/api/test-db', async (req, res) => {
  try {
    const db = require('./db');

    const [rows] = await db.query(
      'SELECT 1 AS connected'
    );

    res.json({
      success: true,
      message: 'Database connected successfully',
      data: rows,
    });
  } catch (error) {
    console.error(
      'Database test error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `ShopEase Backend running on port ${PORT}`
  );
});