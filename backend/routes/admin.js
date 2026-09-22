const express = require("express");

const db = require("../db");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");


const router = express.Router();


// =====================================================
// ADMIN AUTHENTICATION FOR ALL ROUTES BELOW
// =====================================================

router.use(
  requireAuth,
  requireRole("admin")
);


// =====================================================
// ADMIN DASHBOARD
// =====================================================

router.get(
  "/dashboard",

  async (req, res) => {

    try {


      // ===============================================
      // TOTAL CUSTOMERS
      // ===============================================

      const [customerResult] =
        await db.query(`
          SELECT COUNT(*) AS total_customers
          FROM users
          WHERE role = 'customer'
        `);


      // ===============================================
      // TOTAL MERCHANTS
      // ===============================================

      const [merchantResult] =
        await db.query(`
          SELECT COUNT(*) AS total_merchants
          FROM users
          WHERE role = 'merchant'
        `);


      // ===============================================
      // TOTAL PRODUCTS
      // ===============================================

      const [productResult] =
        await db.query(`
          SELECT COUNT(*) AS total_products
          FROM products
        `);


      // ===============================================
      // TOTAL ORDERS
      // ===============================================

      const [orderResult] =
        await db.query(`
          SELECT COUNT(*) AS total_orders
          FROM orders

          WHERE LOWER(
            COALESCE(order_status, '')
          ) != 'cancelled'
        `);


      // ===============================================
      // TOTAL REVENUE
      // ===============================================

      const [revenueResult] =
        await db.query(`
          SELECT
            COALESCE(
              SUM(total_amount),
              0
            ) AS total_revenue

          FROM orders

          WHERE LOWER(
            COALESCE(order_status, '')
          ) != 'cancelled'

          AND (
            LOWER(
              COALESCE(payment_status, '')
            ) = 'paid'

            OR LOWER(
              COALESCE(payment_method, '')
            ) IN (
              'cod',
              'cash on delivery'
            )
          )
        `);


      // ===============================================
      // PENDING ORDERS
      // ===============================================

      const [pendingResult] =
        await db.query(`
          SELECT COUNT(*) AS pending_orders
          FROM orders

          WHERE LOWER(
            COALESCE(order_status, '')
          ) IN (
            'placed',
            'pending'
          )
        `);


      // ===============================================
      // LOW STOCK
      // ===============================================

      const [lowStockResult] =
        await db.query(`
          SELECT COUNT(*) AS low_stock
          FROM products

          WHERE stock > 0
          AND stock <= 5
        `);


      // ===============================================
      // OUT OF STOCK
      // ===============================================

      const [outOfStockResult] =
        await db.query(`
          SELECT COUNT(*) AS out_of_stock
          FROM products

          WHERE stock <= 0
        `);


      // ===============================================
      // RECENT ORDERS
      // ===============================================

      const [recentOrders] =
        await db.query(`
          SELECT

            o.id,
            o.user_id,
            o.total_amount,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.created_at,

            u.name AS customer_name

          FROM orders o

          LEFT JOIN users u
            ON o.user_id = u.id

          ORDER BY o.id DESC

          LIMIT 5
        `);


      // ===============================================
      // RECENT CUSTOMERS
      // ===============================================

      const [recentCustomers] =
        await db.query(`
          SELECT

            id,
            name,
            email,
            phone,
            created_at

          FROM users

          WHERE role = 'customer'

          ORDER BY id DESC

          LIMIT 5
        `);


      // ===============================================
      // RECENT MERCHANTS
      // ===============================================

      const [recentMerchants] =
        await db.query(`
          SELECT

            id,
            name,
            business_name,
            email,
            phone,
            created_at

          FROM users

          WHERE role = 'merchant'

          ORDER BY id DESC

          LIMIT 5
        `);


      // ===============================================
      // RESPONSE
      // ===============================================

      res.json({

        success: true,

        dashboard: {

          total_customers:
            Number(
              customerResult[0]
                .total_customers
            ),

          total_merchants:
            Number(
              merchantResult[0]
                .total_merchants
            ),

          total_products:
            Number(
              productResult[0]
                .total_products
            ),

          total_orders:
            Number(
              orderResult[0]
                .total_orders
            ),

          total_revenue:
            Number(
              revenueResult[0]
                .total_revenue
            ),

          pending_orders:
            Number(
              pendingResult[0]
                .pending_orders
            ),

          low_stock:
            Number(
              lowStockResult[0]
                .low_stock
            ),

          out_of_stock:
            Number(
              outOfStockResult[0]
                .out_of_stock
            ),

          recent_orders:
            recentOrders,

          recent_customers:
            recentCustomers,

          recent_merchants:
            recentMerchants,

        },

      });


    } catch (error) {

      console.error(
        "Admin dashboard error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch admin dashboard",

      });

    }

  }
);


// =====================================================
// GET ALL CUSTOMERS
// =====================================================

router.get(
  "/customers",

  async (req, res) => {

    try {

      const [customers] =
        await db.query(`

          SELECT

            u.id,
            u.name,
            u.email,
            u.phone,
            u.created_at,

            COUNT(
              DISTINCT o.id
            ) AS total_orders,

            COALESCE(
              SUM(
                CASE

                  WHEN LOWER(
                    COALESCE(
                      o.order_status,
                      ''
                    )
                  ) != 'cancelled'

                  THEN o.total_amount

                  ELSE 0

                END
              ),
              0
            ) AS total_spent

          FROM users u

          LEFT JOIN orders o
            ON u.id = o.user_id

          WHERE u.role = 'customer'

          GROUP BY

            u.id,
            u.name,
            u.email,
            u.phone,
            u.created_at

          ORDER BY u.id DESC

        `);


      res.json({

        success: true,

        customers:
          customers.map(
            (customer) => ({

              ...customer,

              total_orders:
                Number(
                  customer.total_orders
                ),

              total_spent:
                Number(
                  customer.total_spent
                ),

            })
          ),

      });


    } catch (error) {

      console.error(
        "Admin customers error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch customers",

      });

    }

  }
);

// =====================================================
// APPROVE PRODUCT
// =====================================================

router.put(
  "/products/:id/approve",

  async (req, res) => {

    try {

      const productId = req.params.id;


      const [result] =
        await db.query(

          `
            UPDATE products

            SET status = 'approved'

            WHERE id = ?
          `,

          [productId]

        );


      if (result.affectedRows === 0) {

        return res.status(404).json({

          success: false,

          message: "Product not found",

        });

      }


      res.json({

        success: true,

        message: "Product approved successfully",

      });


    } catch (error) {

      console.error(
        "Approve product error:",
        error
      );


      res.status(500).json({

        success: false,

        message: "Failed to approve product",

      });

    }

  }
);


// =====================================================
// REJECT PRODUCT
// =====================================================

router.put(
  "/products/:id/reject",

  async (req, res) => {

    try {

      const productId = req.params.id;


      const [result] =
        await db.query(

          `
            UPDATE products

            SET status = 'rejected'

            WHERE id = ?
          `,

          [productId]

        );


      if (result.affectedRows === 0) {

        return res.status(404).json({

          success: false,

          message: "Product not found",

        });

      }


      res.json({

        success: true,

        message: "Product rejected",

      });


    } catch (error) {

      console.error(
        "Reject product error:",
        error
      );


      res.status(500).json({

        success: false,

        message: "Failed to reject product",

      });

    }

  }
);
// =====================================================
// DELETE PRODUCT
// =====================================================

router.delete(
  "/products/:id",

  async (req, res) => {

    try {

      const productId = req.params.id;

      console.log(
        "Admin deleting product:",
        productId
      );


      // ===============================================
      // CHECK PRODUCT EXISTS
      // ===============================================

      const [products] =
        await db.query(
          `
            SELECT id
            FROM products
            WHERE id = ?
          `,
          [productId]
        );


      if (products.length === 0) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found",

        });

      }


      // ===============================================
      // DELETE PRODUCT
      // ===============================================

      await db.query(
        `
          DELETE FROM products
          WHERE id = ?
        `,
        [productId]
      );


      // ===============================================
      // SUCCESS
      // ===============================================

      res.json({

        success: true,

        message:
          "Product deleted successfully",

      });


    } catch (error) {

      console.error(
        "Delete product error:",
        error
      );


      // ===============================================
      // FOREIGN KEY ERROR
      // ===============================================

      if (
        error.code ===
        "ER_ROW_IS_REFERENCED_2"
      ) {

        return res.status(409).json({

          success: false,

          message:
            "This product cannot be deleted because it is already used in existing orders.",

        });

      }


      res.status(500).json({

        success: false,

        message:
          "Failed to delete product",

      });

    }

  }
);
// =====================================================
// GET ALL DELIVERY PARTNERS
// =====================================================

router.get(
  "/delivery-partners",

  async (req, res) => {

    try {

      const [partners] =
        await db.query(`
          SELECT

            id,
            name,
            email,
            phone,
            city,
            vehicle_type,
            vehicle_number,
            status,
            availability_status,
            created_at

          FROM delivery_partners

          ORDER BY id DESC
        `);


      res.json({

        success: true,

        count:
          partners.length,

        partners,

      });


    } catch (error) {

      console.error(
        "Admin delivery partners error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch delivery partners",

        error:
          error.message,

      });

    }

  }
);
// =====================================================
// GET ALL MERCHANTS
// =====================================================

router.get(
  "/merchants",

  async (req, res) => {

    try {

      const [merchants] =
        await db.query(`

          SELECT

            u.id,
            u.name,
            u.business_name,
            u.email,
            u.phone,
            u.created_at,

            COUNT(
              DISTINCT p.id
            ) AS total_products,

            COUNT(
              DISTINCT o.id
            ) AS total_orders,

            COALESCE(
              SUM(

                CASE

                  WHEN LOWER(
                    COALESCE(
                      o.order_status,
                      ''
                    )
                  ) != 'cancelled'

                  THEN
                    oi.quantity *
                    oi.price

                  ELSE 0

                END

              ),
              0
            ) AS total_sales

          FROM users u

          LEFT JOIN products p
            ON u.id = p.merchant_id

          LEFT JOIN order_items oi
            ON p.id = oi.product_id

          LEFT JOIN orders o
            ON oi.order_id = o.id

          WHERE u.role = 'merchant'

          GROUP BY

            u.id,
            u.name,
            u.business_name,
            u.email,
            u.phone,
            u.created_at

          ORDER BY u.id DESC

        `);


      res.json({

        success: true,

        merchants:
          merchants.map(
            (merchant) => ({

              ...merchant,

              total_products:
                Number(
                  merchant.total_products
                ),

              total_orders:
                Number(
                  merchant.total_orders
                ),

              total_sales:
                Number(
                  merchant.total_sales
                ),

            })
          ),

      });


    } catch (error) {

      console.error(
        "Admin merchants error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch merchants",

      });

    }

  }
);


// =====================================================
// GET ALL PRODUCTS
// =====================================================

router.get(
  "/products",

  async (req, res) => {

    try {

      const [products] =
        await db.query(`

          SELECT

            p.id,
            p.name,
            p.category,
            p.price,
            p.original_price,
            p.discount,
            p.stock,
            p.brand,
            p.description,
            p.image,
            p.status,
            p.created_at,

            u.id AS merchant_id,
            u.name AS merchant_name,
            u.business_name

          FROM products p

          LEFT JOIN users u
            ON p.merchant_id = u.id

          ORDER BY p.id DESC

        `);


      res.json({

        success: true,

        products,

      });


    } catch (error) {

      console.error(
        "Admin products error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch products",

      });

    }

  }
);




// =====================================================
// GET ALL ORDERS
// =====================================================

router.get(
  "/orders",

  async (req, res) => {

    try {

      const [orders] =
        await db.query(`

          SELECT

            o.id,
            o.user_id,
            o.total_amount,
            o.payment_method,
           o.payment_status,
o.order_status,
o.return_status,
o.return_reason,
o.return_requested_at,
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


          GROUP BY

            o.id,
            o.user_id,
            o.total_amount,
            o.payment_method,
           o.payment_status,
o.order_status,
o.return_status,
o.return_reason,
o.return_requested_at,
o.created_at,
u.name

          ORDER BY o.id DESC

        `);


      res.json({

        success: true,

        orders,

      });


    } catch (error) {

      console.error(
        "Admin orders error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch admin orders",

      });

    }

  }
);


// =====================================================
// GET ALL PAYMENTS
// =====================================================

router.get(
  "/payments",

  async (req, res) => {

    try {

      const [payments] =
        await db.query(`

          SELECT

            o.id,
            o.user_id,
            o.total_amount,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.created_at,

            u.name AS customer_name


          FROM orders o


          LEFT JOIN users u
            ON o.user_id = u.id


          ORDER BY o.id DESC

        `);


      res.json({

        success: true,

        payments,

      });


    } catch (error) {

      console.error(
        "Admin payments error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch payments",

      });

    }

  }
);

// =====================================================
// ADMIN PROFIT / FINANCIAL SUMMARY
// =====================================================

router.get(
  "/profit",

  async (req, res) => {

    try {

      /*
        ===============================================
        SHOP EASE FINANCIAL RULES

        Merchant gets 90% of order value.
        Delivery partner gets ₹50 per delivered order.
        Remaining amount = ShopEase profit.

        These values can be changed later.
        ===============================================
      */

      const MERCHANT_PAYOUT_PERCENTAGE = 90;

      const DELIVERY_PARTNER_FEE = 50;


      // ===============================================
      // GET DELIVERED / PAID ORDERS
      // ===============================================

      const [orders] =
        await db.query(`
          SELECT

            o.id,
            o.total_amount,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.delivery_status,
            o.created_at,

            u.name AS customer_name

          FROM orders o

          LEFT JOIN users u
            ON o.user_id = u.id

          WHERE

            LOWER(
              COALESCE(
                o.order_status,
                ''
              )
            ) = 'delivered'

            AND LOWER(
              COALESCE(
                o.payment_status,
                ''
              )
            ) = 'paid'

          ORDER BY o.id DESC
        `);


      // ===============================================
      // CALCULATE FINANCIALS
      // ===============================================

      let totalSales = 0;

      let merchantPayouts = 0;

      let deliveryPartnerPay = 0;


      const formattedOrders =
        orders.map((order) => {

          const amount =
            Number(
              order.total_amount || 0
            );


          const merchantAmount =
            amount *
            (
              MERCHANT_PAYOUT_PERCENTAGE /
              100
            );


          const deliveryAmount =
            DELIVERY_PARTNER_FEE;


          const profit =
            amount -
            merchantAmount -
            deliveryAmount;


          totalSales += amount;

          merchantPayouts +=
            merchantAmount;

          deliveryPartnerPay +=
            deliveryAmount;


          return {

            ...order,

            total_amount:
              amount,

            merchant_payout:
              Number(
                merchantAmount.toFixed(2)
              ),

            delivery_partner_pay:
              Number(
                deliveryAmount.toFixed(2)
              ),

            shop_ease_profit:
              Number(
                profit.toFixed(2)
              ),

          };

        });


      // ===============================================
      // TOTAL SHOP EASE PROFIT
      // ===============================================

      const shopEaseProfit =
        totalSales -
        merchantPayouts -
        deliveryPartnerPay;


      // ===============================================
      // PROFIT PERCENTAGE
      // ===============================================

      const profitPercentage =
        totalSales > 0
          ? (
              (
                shopEaseProfit /
                totalSales
              ) *
              100
            )
          : 0;


      // ===============================================
      // RESPONSE
      // ===============================================

      res.json({

        success: true,

        summary: {

          total_sales:
            Number(
              totalSales.toFixed(2)
            ),

          merchant_payouts:
            Number(
              merchantPayouts.toFixed(2)
            ),

          delivery_partner_pay:
            Number(
              deliveryPartnerPay.toFixed(2)
            ),

          shop_ease_profit:
            Number(
              shopEaseProfit.toFixed(2)
            ),

          profit_percentage:
            Number(
              profitPercentage.toFixed(2)
            ),

          merchant_payout_percentage:
            MERCHANT_PAYOUT_PERCENTAGE,

          delivery_partner_fee:
            DELIVERY_PARTNER_FEE,

          total_delivered_orders:
            formattedOrders.length,

        },

        orders:
          formattedOrders,

      });


    } catch (error) {

      console.error(
        "Admin profit error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch profit details",

        error:
          error.message,

      });

    }

  }
);

// =====================================================
// ADMIN REPORTS
// =====================================================

router.get(
  "/reports",

  async (req, res) => {

    try {


      const [customers] =
        await db.query(`

          SELECT COUNT(*) AS total_customers

          FROM users

          WHERE role = 'customer'

        `);


      const [merchants] =
        await db.query(`

          SELECT COUNT(*) AS total_merchants

          FROM users

          WHERE role = 'merchant'

        `);


      const [products] =
        await db.query(`

          SELECT COUNT(*) AS total_products

          FROM products

        `);


      const [orders] =
        await db.query(`

          SELECT COUNT(*) AS total_orders

          FROM orders

          WHERE LOWER(
            COALESCE(
              order_status,
              ''
            )
          ) != 'cancelled'

        `);


      const [revenue] =
        await db.query(`

          SELECT

            COALESCE(
              SUM(total_amount),
              0
            ) AS total_revenue

          FROM orders

          WHERE LOWER(
            COALESCE(
              order_status,
              ''
            )
          ) != 'cancelled'

        `);


      const [pending] =
        await db.query(`

          SELECT COUNT(*) AS pending_orders

          FROM orders

          WHERE LOWER(
            COALESCE(
              order_status,
              ''
            )
          ) IN (

            'placed',

            'pending'

          )

        `);


      const [lowStock] =
        await db.query(`

          SELECT COUNT(*) AS low_stock

          FROM products

          WHERE stock > 0

          AND stock <= 5

        `);


      res.json({

        success: true,


        report: {

          total_customers:

            Number(
              customers[0]
                .total_customers
            ),


          total_merchants:

            Number(
              merchants[0]
                .total_merchants
            ),


          total_products:

            Number(
              products[0]
                .total_products
            ),


          total_orders:

            Number(
              orders[0]
                .total_orders
            ),


          total_revenue:

            Number(
              revenue[0]
                .total_revenue
            ),


          pending_orders:

            Number(
              pending[0]
                .pending_orders
            ),


          low_stock:

            Number(
              lowStock[0]
                .low_stock
            ),

        },

      });


    } catch (error) {

      console.error(
        "Admin reports error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch reports",

      });

    }

  }
);


// =====================================================
// GET PRODUCT FEEDBACK
// =====================================================

router.get(
  "/products/:id/feedback",

  async (req, res) => {
    try {
      const productId = req.params.id;

      // Get product
      const [products] = await db.query(
        `
          SELECT
            id,
            name,
            image
          FROM products
          WHERE id = ?
        `,
        [productId]
      );

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Get customer reviews
      const [reviews] = await db.query(
        `
          SELECT
            pr.id,
            pr.product_id,
            pr.customer_id,
            pr.order_id,
            pr.rating,
            pr.feedback,
            pr.created_at,
            u.name AS customer_name

          FROM product_reviews pr

          LEFT JOIN users u
            ON pr.customer_id = u.id

          WHERE pr.product_id = ?

          ORDER BY pr.created_at DESC
        `,
        [productId]
      );

      // Get admin rating
      const [adminRatings] = await db.query(
        `
          SELECT
            rating,
            created_at
          FROM admin_product_ratings
          WHERE product_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [productId]
      );

      const totalReviews = reviews.length;

      const averageRating =
        totalReviews > 0
          ? Number(
              (
                reviews.reduce(
                  (sum, review) =>
                    sum + Number(review.rating || 0),
                  0
                ) / totalReviews
              ).toFixed(1)
            )
          : 0;

      res.json({
        success: true,

        product: products[0],

        reviews,

        totalReviews,

        averageRating,

        adminRating:
          adminRatings.length > 0
            ? Number(adminRatings[0].rating)
            : null,
      });

    } catch (error) {
      console.error(
        "Admin product feedback error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch product feedback",
      });
    }
  }
);


// =====================================================
// SAVE / UPDATE ADMIN PRODUCT RATING
// =====================================================

router.put(
  "/products/:id/admin-rating",

  async (req, res) => {
    try {
      const productId = req.params.id;
      const adminId = req.user.id;
      const rating = Number(req.body.rating);

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5",
        });
      }

      // Check product
      const [products] = await db.query(
        `
          SELECT id
          FROM products
          WHERE id = ?
        `,
        [productId]
      );

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Insert or update admin rating
      await db.query(
        `
          INSERT INTO admin_product_ratings
          (
            product_id,
            admin_id,
            rating
          )
          VALUES (?, ?, ?)

          ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            created_at = CURRENT_TIMESTAMP
        `,
        [
          productId,
          adminId,
          rating,
        ]
      );

      res.json({
        success: true,
        message:
          "Admin rating saved successfully",
        rating,
      });

    } catch (error) {
      console.error(
        "Admin product rating error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save admin rating",
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;