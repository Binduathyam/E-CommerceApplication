const express = require("express");
const db = require("../db");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   MERCHANT DASHBOARD
   GET /api/merchant/dashboard/:merchantId
===================================================== */

router.get(
  "/dashboard/:merchantId",
  requireAuth,
  requireRole("merchant"),
  async (req, res) => {
    try {
      const merchantId =
        req.params.merchantId;
        if (String(req.user.id) !== String(merchantId)) {
  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
}

      /* =========================================
         CHECK MERCHANT
      ========================================= */

      const [merchant] =
        await db.query(
          `SELECT
             id,
             name,
             business_name,
             email,
             phone,
             role
           FROM users
           WHERE id = ?
           AND role = 'merchant'`,
          [merchantId]
        );

      if (merchant.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Merchant not found",
        });
      }

      /* =========================================
         TOTAL PRODUCTS
      ========================================= */

      const [productResult] =
        await db.query(
          `SELECT
             COUNT(*) AS total_products
           FROM products
           WHERE merchant_id = ?`,
          [merchantId]
        );

      /* =========================================
         TOTAL ORDERS
      ========================================= */

      const [orderResult] =
        await db.query(
          `SELECT
             COUNT(DISTINCT oi.order_id)
             AS total_orders

           FROM order_items oi

           JOIN products p
             ON oi.product_id = p.id

           JOIN orders o
             ON oi.order_id = o.id

           WHERE p.merchant_id = ?

           AND LOWER(
             COALESCE(
               o.order_status,
               ''
             )
           ) != 'cancelled'`,
          [merchantId]
        );

      /* =========================================
         TOTAL SALES
      ========================================= */

      const [salesResult] =
        await db.query(
          `SELECT
             COALESCE(
               SUM(
                 oi.quantity * oi.price
               ),
               0
             ) AS total_sales

           FROM order_items oi

           JOIN products p
             ON oi.product_id = p.id

           JOIN orders o
             ON oi.order_id = o.id

           WHERE p.merchant_id = ?

           AND LOWER(
             COALESCE(
               o.order_status,
               ''
             )
           ) != 'cancelled'

           AND (
             LOWER(
               COALESCE(
                 o.payment_status,
                 ''
               )
             ) = 'paid'

             OR LOWER(
               COALESCE(
                 o.payment_method,
                 ''
               )
             ) IN (
               'cod',
               'cash on delivery'
             )
           )`,
          [merchantId]
        );

      /* =========================================
         LOW STOCK COUNT
         STOCK <= 5
      ========================================= */

      const [lowStockResult] =
        await db.query(
          `SELECT
             COUNT(*) AS low_stock

           FROM products

           WHERE merchant_id = ?

           AND stock <= 5`,
          [merchantId]
        );

      /* =========================================
         OUT OF STOCK
         STOCK <= 0
      ========================================= */

      const [outOfStockResult] =
        await db.query(
          `SELECT
             COUNT(*) AS out_of_stock

           FROM products

           WHERE merchant_id = ?

           AND stock <= 0`,
          [merchantId]
        );

      /* =========================================
         LOW STOCK PRODUCTS
      ========================================= */

      const [lowStockProducts] =
        await db.query(
          `SELECT
             id,
             name,
             price,
             stock,
             image

           FROM products

           WHERE merchant_id = ?

           AND stock <= 5

           ORDER BY
             stock ASC,
             id DESC

           LIMIT 5`,
          [merchantId]
        );

      /* =========================================
         RECENT ORDERS
      ========================================= */

      const [recentOrders] =
        await db.query(
          `SELECT
             o.id,
             o.user_id,
             o.total_amount,
             o.payment_method,
             o.payment_status,
             o.order_status,
             o.created_at,

             u.name AS customer_name,

             GROUP_CONCAT(
               DISTINCT p.name
               ORDER BY p.name
               SEPARATOR ', '
             ) AS product_names,

             SUM(
               oi.quantity
             ) AS total_quantity

           FROM orders o

           JOIN order_items oi
             ON o.id = oi.order_id

           JOIN products p
             ON oi.product_id = p.id

           LEFT JOIN users u
             ON o.user_id = u.id

           WHERE p.merchant_id = ?

           GROUP BY
             o.id,
             o.user_id,
             o.total_amount,
             o.payment_method,
             o.payment_status,
             o.order_status,
             o.created_at,
             u.name

           ORDER BY
             o.id DESC

           LIMIT 5`,
          [merchantId]
        );

      /* =========================================
         ORDER STATUS COUNTS
      ========================================= */

      const [statusResult] =
        await db.query(
          `SELECT

             LOWER(
               o.order_status
             ) AS order_status,

             COUNT(
               DISTINCT o.id
             ) AS count

           FROM orders o

           JOIN order_items oi
             ON o.id = oi.order_id

           JOIN products p
             ON oi.product_id = p.id

           WHERE p.merchant_id = ?

           GROUP BY
             LOWER(
               o.order_status
             )`,
          [merchantId]
        );

      const orderStatuses = {
        placed: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      statusResult.forEach(
        (row) => {
          const status =
            row.order_status;

          if (
            Object.prototype.hasOwnProperty.call(
              orderStatuses,
              status
            )
          ) {
            orderStatuses[status] =
              Number(row.count);
          }
        }
      );

      /* =========================================
         DASHBOARD RESPONSE
      ========================================= */

      res.json({
        success: true,

        merchant: {
          id:
            merchant[0].id,

          name:
            merchant[0].name,

          business_name:
            merchant[0].business_name,

          email:
            merchant[0].email,

          phone:
            merchant[0].phone,

          role:
            merchant[0].role,
        },

        dashboard: {
          total_products:
            Number(
              productResult[0]
                .total_products || 0
            ),

          total_orders:
            Number(
              orderResult[0]
                .total_orders || 0
            ),

          total_sales:
            Number(
              salesResult[0]
                .total_sales || 0
            ),

          low_stock:
            Number(
              lowStockResult[0]
                .low_stock || 0
            ),

          out_of_stock:
            Number(
              outOfStockResult[0]
                .out_of_stock || 0
            ),

          orders:
            orderStatuses,

          recent_orders:
            recentOrders,

          low_stock_products:
            lowStockProducts,
        },
      });

    } catch (error) {
      console.error(
        "Merchant dashboard error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch merchant dashboard",
      });
    }
  }
);


/* =====================================================
   MERCHANT SALES
   GET /api/merchant/sales/:merchantId
===================================================== */

router.get(
  "/sales/:merchantId",
  requireAuth,
  requireRole("merchant"),
  async (req, res) => {
    try {
      const merchantId =
        req.params.merchantId;
        if (String(req.user.id) !== String(merchantId)) {
  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
}

      /* =========================================
         CHECK MERCHANT
      ========================================= */

      const [merchant] =
        await db.query(
          `SELECT
             id,
             name,
             business_name
           FROM users
           WHERE id = ?
           AND role = 'merchant'`,
          [merchantId]
        );

      if (merchant.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Merchant not found",
        });
      }

      /* =========================================
         SALES SUMMARY
      ========================================= */

      const [summary] =
        await db.query(
          `SELECT

             COUNT(
               DISTINCT o.id
             ) AS total_orders,

             COALESCE(
               SUM(
                 oi.quantity * oi.price
               ),
               0
             ) AS total_sales,

             COUNT(
               DISTINCT CASE

                 WHEN LOWER(
                   COALESCE(
                     o.payment_status,
                     ''
                   )
                 ) = 'paid'

                 THEN o.id

               END
             ) AS paid_orders,

             COUNT(
               DISTINCT CASE

                 WHEN LOWER(
                   COALESCE(
                     o.payment_method,
                     ''
                   )
                 ) IN (
                   'cod',
                   'cash on delivery'
                 )

                 THEN o.id

               END
             ) AS cod_orders

           FROM orders o

           JOIN order_items oi
             ON o.id = oi.order_id

           JOIN products p
             ON oi.product_id = p.id

           WHERE p.merchant_id = ?

           AND LOWER(
             COALESCE(
               o.order_status,
               ''
             )
           ) != 'cancelled'`,
          [merchantId]
        );

      /* =========================================
         SALES LIST
      ========================================= */

      const [sales] =
        await db.query(
          `SELECT

             o.id AS order_id,

             o.user_id,

             o.created_at,

             o.total_amount,

             o.payment_method,

             o.payment_status,

             o.order_status,

             oi.product_id,

             p.name AS product_name,

             p.image,

             oi.quantity,

             oi.price,

             (
               oi.quantity * oi.price
             ) AS item_total

           FROM orders o

           JOIN order_items oi
             ON o.id = oi.order_id

           JOIN products p
             ON oi.product_id = p.id

           WHERE p.merchant_id = ?

           AND LOWER(
             COALESCE(
               o.order_status,
               ''
             )
           ) != 'cancelled'

           ORDER BY
             o.id DESC`,
          [merchantId]
        );

      /* =========================================
         MONTHLY SALES
      ========================================= */

      const [monthlySales] =
        await db.query(
          `SELECT

             DATE_FORMAT(
               o.created_at,
               '%Y-%m'
             ) AS month,

             COALESCE(
               SUM(
                 oi.quantity * oi.price
               ),
               0
             ) AS sales

           FROM orders o

           JOIN order_items oi
             ON o.id = oi.order_id

           JOIN products p
             ON oi.product_id = p.id

           WHERE p.merchant_id = ?

           AND LOWER(
             COALESCE(
               o.order_status,
               ''
             )
           ) != 'cancelled'

           GROUP BY
             DATE_FORMAT(
               o.created_at,
               '%Y-%m'
             )

           ORDER BY
             month DESC

           LIMIT 12`,
          [merchantId]
        );

      /* =========================================
         RESPONSE
      ========================================= */

      res.json({
        success: true,

        merchant: {
          id:
            merchant[0].id,

          name:
            merchant[0].name,

          business_name:
            merchant[0].business_name,
        },

        summary: {
          total_orders:
            Number(
              summary[0]
                .total_orders || 0
            ),

          total_sales:
            Number(
              summary[0]
                .total_sales || 0
            ),

          paid_orders:
            Number(
              summary[0]
                .paid_orders || 0
            ),

          cod_orders:
            Number(
              summary[0]
                .cod_orders || 0
            ),
        },

        monthly_sales:
          monthlySales.map(
            (row) => ({
              month:
                row.month,

              sales:
                Number(
                  row.sales || 0
                ),
            })
          ),

        sales:
          sales.map(
            (row) => ({
              order_id:
                row.order_id,

              user_id:
                row.user_id,

              created_at:
                row.created_at,

              total_amount:
                Number(
                  row.total_amount || 0
                ),

              payment_method:
                row.payment_method,

              payment_status:
                row.payment_status,

              order_status:
                row.order_status,

              product_id:
                row.product_id,

              product_name:
                row.product_name,

              image:
                row.image,

              quantity:
                Number(
                  row.quantity || 0
                ),

              price:
                Number(
                  row.price || 0
                ),

              item_total:
                Number(
                  row.item_total || 0
                ),
            })
          ),
      });

    } catch (error) {
      console.error(
        "Merchant sales error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch merchant sales",
      });
    }
  }
);
/* =====================================================
   MERCHANT INVENTORY
===================================================== */

router.get(
  "/inventory/:merchantId",
  requireAuth,
  requireRole("merchant"),
  async (req, res) => {
    try {
      const merchantId = req.params.merchantId;
      if (String(req.user.id) !== String(merchantId)) {
  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
}

      const [products] = await db.query(
        `
        SELECT
          id,
          name,
          category,
          price,
          original_price,
          discount,
          stock,
          brand,
          image,
          description,
          created_at

        FROM products

        WHERE merchant_id = ?

        ORDER BY
          CASE
            WHEN stock <= 0 THEN 0
            WHEN stock <= 5 THEN 1
            ELSE 2
          END,
          stock ASC,
          id DESC
        `,
        [merchantId]
      );

      const totalProducts = products.length;

      const lowStockProducts = products.filter(
        (product) =>
          Number(product.stock || 0) > 0 &&
          Number(product.stock || 0) <= 5
      ).length;

      const outOfStockProducts = products.filter(
        (product) =>
          Number(product.stock || 0) <= 0
      ).length;

      const totalStock = products.reduce(
        (total, product) =>
          total + Number(product.stock || 0),
        0
      );

      res.json({
        success: true,

        summary: {
          total_products: totalProducts,
          total_stock: totalStock,
          low_stock: lowStockProducts,
          out_of_stock: outOfStockProducts,
        },

        products,
      });

    } catch (error) {
      console.error(
        "Merchant inventory error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch merchant inventory",
        error: error.message,
      });
    }
  }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;