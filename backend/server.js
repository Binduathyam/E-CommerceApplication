const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

require("./db");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const reviewsRoutes = require("./routes/reviews");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const addressRoutes = require("./routes/addresses");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payment");
const merchantRoutes = require("./routes/merchant");
const adminRoutes = require("./routes/admin");
const deliveryRoutes = require("./routes/delivery");

const app = express();

/* =========================================
   CORS
========================================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id"
    ],

    credentials: true
  })
);

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* =========================================
   ROUTES
========================================= */

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/products", productRoutes);

app.use("/api/reviews", reviewsRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/addresses", addressRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/merchant", merchantRoutes);

app.use("/api/delivery", deliveryRoutes);

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ShopEase Backend is running"
  });
});

/* =========================================
   DATABASE TEST
========================================= */

app.get("/api/test-db", async (req, res) => {
  try {
    const db = require("./db");

    const [rows] = await db.query(
      "SELECT 1 AS connected"
    );

    res.json({
      success: true,
      message: "Database connected successfully",
      data: rows
    });

  } catch (error) {

    console.error(
      "Database test error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

/* =========================================
   404 HANDLER

   Express 5 compatible
========================================= */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });

});

/* =========================================
   ERROR HANDLER
========================================= */

app.use((error, req, res, next) => {

  console.error(
    "Server error:",
    error
  );

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message
  });

});

/* =========================================
   SERVER
========================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log("");
  console.log("====================================");
  console.log("   ShopEase Backend Started");
  console.log("====================================");

  console.log(
    `Server: http://localhost:${PORT}`
  );

  console.log(
    `Database Test: http://localhost:${PORT}/api/test-db`
  );

  console.log(
    `Auth API: http://localhost:${PORT}/api/auth`
  );

  console.log(
    `Address API: http://localhost:${PORT}/api/addresses`
  );

  console.log(
    `Orders API: http://localhost:${PORT}/api/orders`
  );

  console.log(
    `Payment API: http://localhost:${PORT}/api/payment`
  );

  console.log(
    `Merchant API: http://localhost:${PORT}/api/merchant`
  );

  console.log(
    `Delivery API: http://localhost:${PORT}/api/delivery`
  );

  console.log("====================================");
  console.log("");

});