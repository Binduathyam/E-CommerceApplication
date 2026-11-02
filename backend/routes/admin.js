const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");



const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");


const router = express.Router();

// =================================================
// BANNER IMAGE UPLOAD CONFIG
// =================================================

const bannerUploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "banners"
);

if (!fs.existsSync(bannerUploadDirectory)) {
  fs.mkdirSync(bannerUploadDirectory, {
    recursive: true,
  });

  console.log(
    "Banner upload directory created:",
    bannerUploadDirectory
  );
}


// =================================================
// BANNER MULTER STORAGE
// =================================================

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannerUploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `banner-${Date.now()}${extension}`;

    cb(null, filename);
  },
});


const uploadBanner = multer({
  storage: bannerStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
      );
    }
  },
});

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
            u.email,
            u.phone,
            u.business_name,
            u.aadhaar_image,
            u.approval_status,
            u.approval_date,
            u.created_at,

            COUNT(
              DISTINCT p.id
            ) AS total_products

          FROM users u

          LEFT JOIN products p
            ON p.merchant_id = u.id

          WHERE u.role = 'merchant'

          GROUP BY

            u.id,
            u.name,
            u.email,
            u.phone,
            u.business_name,
            u.aadhaar_image,
            u.approval_status,
            u.approval_date,
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

              total_orders: 0,

              total_sales: 0,

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
// APPROVE MERCHANT
// =====================================================

router.put(
  "/merchants/:id/approved",

  async (req, res) => {

    try {

      const merchantId =
        req.params.id;


      const [result] =
        await db.query(
          `
            UPDATE users

            SET
              approval_status = 'Approved',
              approval_date = NOW()

            WHERE
              id = ?
              AND role = 'merchant'
          `,
          [merchantId]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Merchant not found",

        });

      }


      res.json({

        success: true,

        message:
          "Merchant approved successfully",

      });


    } catch (error) {

      console.error(
        "Approve merchant error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to approve merchant",

      });

    }

  }
);


// =====================================================
// REJECT MERCHANT
// =====================================================

router.put(
  "/merchants/:id/rejected",

  async (req, res) => {

    try {

      const merchantId =
        req.params.id;


      const [result] =
        await db.query(
          `
            UPDATE users

            SET
              approval_status = 'Rejected',
              approval_date = NOW()

            WHERE
              id = ?
              AND role = 'merchant'
          `,
          [merchantId]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Merchant not found",

        });

      }


      res.json({

        success: true,

        message:
          "Merchant rejected successfully",

      });


    } catch (error) {

      console.error(
        "Reject merchant error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to reject merchant",

      });

    }

  }
);

// =====================================================
// APPROVE DELIVERY PARTNER
// =====================================================

router.put(
  "/delivery-partners/:id/approved",

  async (req, res) => {

    try {

      const deliveryPartnerId =
        req.params.id;

      const [result] =
        await db.query(
          `
            UPDATE delivery_partners

            SET
              approval_status = 'Approved',
              approval_date = NOW()

            WHERE
              id = ?
          `,
          [deliveryPartnerId]
        );

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Delivery partner not found",

        });

      }

      res.json({

        success: true,

        message:
          "Delivery partner approved successfully",

      });

    } catch (error) {

      console.error(
        "Approve delivery partner error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to approve delivery partner",

      });

    }

  }
);


// =====================================================
// REJECT DELIVERY PARTNER
// =====================================================

router.put(
  "/delivery-partners/:id/rejected",

  async (req, res) => {

    try {

      const deliveryPartnerId =
        req.params.id;

      const [result] =
        await db.query(
          `
            UPDATE delivery_partners

            SET
              approval_status = 'Rejected',
              approval_date = NOW()

            WHERE
              id = ?
          `,
          [deliveryPartnerId]
        );

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Delivery partner not found",

        });

      }

      res.json({

        success: true,

        message:
          "Delivery partner rejected successfully",

      });

    } catch (error) {

      console.error(
        "Reject delivery partner error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to reject delivery partner",

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
            approval_status,
            license_number,
            license_image,
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

        console.log("ADMIN.JS PRODUCTS ROUTE HIT");

    try {

      const [products] =
        await db.query(`

          SELECT

            p.id,
            p.name,
            p.category,
            COALESCE(
  (
    SELECT MIN(pv1.price)
    FROM product_variants pv1
    WHERE pv1.product_id = p.id
  ),
  p.price
) AS price,

p.original_price,

COALESCE(
  (
    SELECT ROUND(
      (
        1 - (
          MIN(pv2.discount_price) /
          NULLIF(MIN(pv2.price), 0)
        )
      ) * 100
    )
    FROM product_variants pv2
    WHERE pv2.product_id = p.id
      AND pv2.discount_price IS NOT NULL
  ),
  p.discount
) AS discount,

COALESCE(
  (
    SELECT SUM(pv3.stock)
    FROM product_variants pv3
    WHERE pv3.product_id = p.id
  ),
  p.stock
) AS stock,
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
// BANNER MANAGEMENT
// =====================================================


// =====================================================
// UPLOAD BANNER IMAGE
// =====================================================

router.post(
  "/banners/upload-image",
  uploadBanner.single("image"),
  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Banner image is required",
        });
      }

      const imageUrl =
        `/uploads/banners/${req.file.filename}`;

      res.status(201).json({
        success: true,
        message: "Banner image uploaded successfully",
        image: imageUrl,
      });

    } catch (error) {

      console.error(
        "Banner image upload error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to upload banner image",
        error: error.message,
      });

    }
  }
);

// =====================================================
// CREATE BANNER
// =====================================================

router.post(
  "/banners",
  async (req, res) => {

    try {

      const {
        title,
        description,
        discount,
        button_text,
        image,
        is_active
      } = req.body;


      // ===============================================
      // VALIDATION
      // ===============================================

      if (!title || !title.trim()) {

        return res.status(400).json({
          success: false,
          message: "Banner title is required",
        });

      }


      if (!image || !image.trim()) {

        return res.status(400).json({
          success: false,
          message: "Banner image is required",
        });

      }


      // ===============================================
      // IF THIS BANNER IS ACTIVE,
      // DEACTIVATE OTHER BANNERS
      // ===============================================

      if (is_active === true) {

        await db.query(`
          UPDATE banners
          SET is_active = FALSE
          WHERE is_active = TRUE
        `);

      }


      // ===============================================
      // INSERT BANNER
      // ===============================================

      const [result] = await db.query(
        `
          INSERT INTO banners
          (
            title,
            description,
            discount,
            button_text,
            image,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          title.trim(),
          description || "",
          discount || "",
          button_text || "Shop Now",
          image.trim(),
          is_active === true ? true : false
        ]
      );


      // ===============================================
      // SUCCESS
      // ===============================================

      res.status(201).json({

        success: true,

        message: "Banner created successfully",

        bannerId: result.insertId,

      });


    } catch (error) {

      console.error(
        "Create banner error:",
        error
      );


      res.status(500).json({

        success: false,

        message: "Failed to create banner",

        error: error.message,

      });

    }

  }
);


// =====================================================
// GET ALL BANNERS
// =====================================================

router.get(
  "/banners",
  async (req, res) => {

    try {

      const [banners] = await db.query(
        `
          SELECT
            id,
            title,
            description,
            discount,
            button_text,
            image,
            is_active,
            created_at,
            updated_at
          FROM banners
          ORDER BY id DESC
        `
      );


      res.json({

        success: true,

        banners,

      });


    } catch (error) {

      console.error(
        "Get banners error:",
        error
      );


      res.status(500).json({

        success: false,

        message: "Failed to fetch banners",

        error: error.message,

      });

    }

  }
);


// =====================================================
// UPDATE BANNER
// =====================================================

router.put(
  "/banners/:id",
  async (req, res) => {

    try {

      const bannerId =
        req.params.id;


      const {
        title,
        description,
        discount,
        button_text,
        image,
        is_active
      } = req.body;


      // ===============================================
      // CHECK BANNER
      // ===============================================

      const [existing] =
        await db.query(
          `
            SELECT id
            FROM banners
            WHERE id = ?
          `,
          [bannerId]
        );


      if (existing.length === 0) {

        return res.status(404).json({

          success: false,

          message: "Banner not found",

        });

      }


      // ===============================================
      // IF ACTIVE,
      // DEACTIVATE OTHER BANNERS
      // ===============================================

      if (is_active === true) {

        await db.query(
          `
            UPDATE banners
            SET is_active = FALSE
            WHERE id != ?
          `,
          [bannerId]
        );

      }


      // ===============================================
      // UPDATE
      // ===============================================

      await db.query(
        `
          UPDATE banners
          SET
            title = ?,
            description = ?,
            discount = ?,
            button_text = ?,
            image = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          title.trim(),
          description || "",
          discount || "",
          button_text || "Shop Now",
 image.trim(),
          is_active === true ? true : false,
          bannerId
        ]
      );


      res.json({

        success: true,

        message:
          "Banner updated successfully",

      });


    } catch (error) {

      console.error(
        "Update banner error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to update banner",

        error: error.message,

      });

    }

  }
);


// =====================================================
// DELETE BANNER
// =====================================================

router.delete(
  "/banners/:id",
  async (req, res) => {

    try {

      const bannerId =
        req.params.id;


      const [result] =
        await db.query(
          `
            DELETE FROM banners
            WHERE id = ?
          `,
          [bannerId]
        );


      if (result.affectedRows === 0) {

        return res.status(404).json({

          success: false,

          message: "Banner not found",

        });

      }


      res.json({

        success: true,

        message:
          "Banner deleted successfully",

      });


    } catch (error) {

      console.error(
        "Delete banner error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to delete banner",

        error: error.message,

      });

    }

  }
);


// =====================================================
// EXPORT
// =====================================================


// =====================================================
// DISPATCH HUB MANAGEMENT
// Admin-only routes; router-level authentication applies.
// =====================================================

// GET /api/admin/dispatch-hubs?city=...&status=Active
router.get("/dispatch-hubs", async (req, res) => {
  try {
    const { city, status } = req.query;
    const conditions = [];
    const params = [];

    if (city) {
      conditions.push("city = ?");
      params.push(String(city).trim());
    }

    if (status) {
      const normalizedStatus = String(status).trim();
      if (!["Active", "Inactive"].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "status must be Active or Inactive"
        });
      }
      conditions.push("status = ?");
      params.push(normalizedStatus);
    }

    const sql = `
      SELECT id, hub_code, hub_name, address, city, state, pincode,
             status, created_at
      FROM dispatch_hubs
      ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
      ORDER BY city ASC, hub_name ASC
    `;

    const [hubs] = await db.query(sql, params);
    return res.json({ success: true, count: hubs.length, hubs });
  } catch (error) {
    console.error("List dispatch hubs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dispatch hubs"
    });
  }
});

// POST /api/admin/dispatch-hubs
router.post("/dispatch-hubs", async (req, res) => {
  try {
    const fields = [
      "hub_code", "hub_name", "address",
      "city", "state", "pincode"
    ];

    const values = {};
    for (const field of fields) {
      if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required and must be a non-empty string`
        });
      }
      values[field] = req.body[field].trim();
    }

    const limits = {
      hub_code: 30,
      hub_name: 150,
      address: 500,
      city: 100,
      state: 100,
      pincode: 10
    };

    for (const [field, maxLength] of Object.entries(limits)) {
      if (values[field].length > maxLength) {
        return res.status(400).json({
          success: false,
          message: `${field} must be ${maxLength} characters or fewer`
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO dispatch_hubs
       (hub_code, hub_name, address, city, state, pincode, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      fields.map(field => values[field])
    );

    const [rows] = await db.query(
      `SELECT id, hub_code, hub_name, address, city, state,
              pincode, status, created_at
       FROM dispatch_hubs WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Dispatch hub created successfully",
      hub: rows[0]
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A hub with this hub_code already exists"
      });
    }

    console.error("Create dispatch hub error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create dispatch hub"
    });
  }
});

// PUT /api/admin/dispatch-hubs/:id/status
router.put("/dispatch-hubs/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid hub ID"
      });
    }

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be Active or Inactive"
      });
    }

    const [result] = await db.query(
      "UPDATE dispatch_hubs SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.query(
        "SELECT id FROM dispatch_hubs WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Dispatch hub not found"
        });
      }
    }

    const [rows] = await db.query(
      `SELECT id, hub_code, hub_name, address, city, state,
              pincode, status, created_at
       FROM dispatch_hubs WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: `Dispatch hub ${status.toLowerCase()} successfully`,
      hub: rows[0]
    });
  } catch (error) {
    console.error("Update dispatch hub status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update dispatch hub status"
    });
  }
});



// POST /api/admin/dispatch-hubs/:hubId/shipments/:shipmentId/receive
// Receive a picked-up shipment at its designated origin hub.
router.post(
  "/dispatch-hubs/:hubId/shipments/:shipmentId/receive",
  async (req, res) => {
    let connection;

    try {
      const hubId = Number(req.params.hubId);
      const shipmentId = Number(req.params.shipmentId);

      if (
        !Number.isSafeInteger(hubId) || hubId <= 0 ||
        !Number.isSafeInteger(shipmentId) || shipmentId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid hub ID or shipment ID"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();

      const [hubs] = await connection.query(
        `SELECT id, hub_name, city, state, status
         FROM dispatch_hubs
         WHERE id = ?
         FOR UPDATE`,
        [hubId]
      );

      if (hubs.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Dispatch hub not found"
        });
      }

      const hub = hubs[0];

      if (hub.status !== "Active") {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "This dispatch hub is inactive"
        });
      }

      const [shipments] = await connection.query(
        `SELECT id, order_id, merchant_id, tracking_number,
                shipment_status, origin_hub_id, current_hub_id
         FROM merchant_shipments
         WHERE id = ?
         FOR UPDATE`,
        [shipmentId]
      );

      if (shipments.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const shipment = shipments[0];

      if (Number(shipment.origin_hub_id) !== hubId) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "This shipment is not assigned to this origin hub"
        });
      }

      if (shipment.shipment_status !== "Picked Up") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Only Picked Up shipments can be received at the origin hub",
          currentStatus: shipment.shipment_status
        });
      }

      await connection.query(
        `UPDATE merchant_shipments
         SET shipment_status = 'Received at Origin Hub',
             current_hub_id = ?
         WHERE id = ?`,
        [hubId, shipmentId]
      );

      await connection.query(
        `INSERT INTO shipment_tracking_events
          (shipment_id, event_status, location_type, hub_id,
           city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipmentId,
          "Received at Origin Hub",
          "hub",
          hubId,
          hub.city,
          hub.state,
          `Shipment received at origin hub: ${hub.hub_name}`,
          "admin",
          req.user.id
        ]
      );

      await connection.commit();

      return res.json({
        success: true,
        message: "Shipment received at origin hub successfully",
        shipment: {
          id: shipmentId,
          order_id: shipment.order_id,
          merchant_id: shipment.merchant_id,
          tracking_number: shipment.tracking_number,
          shipment_status: "Received at Origin Hub",
          current_hub_id: hubId,
          hub_name: hub.hub_name,
          city: hub.city,
          state: hub.state
        }
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Origin hub receive rollback error:", rollbackError.message);
        }
      }

      console.error("Origin hub receive error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to receive shipment at origin hub"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


// ============================================================
// INTERCITY SHIPMENT DISPATCH
// POST /api/admin/shipments/:shipmentId/dispatch
// ============================================================
router.post(
  "/shipments/:shipmentId/dispatch",
  async (req, res) => {
    let connection;

    try {
      const shipmentId = Number(req.params.shipmentId);
      const transportReference =
        typeof req.body.transport_reference === "string"
          ? req.body.transport_reference.trim().slice(0, 150)
          : null;

      if (!Number.isSafeInteger(shipmentId) || shipmentId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment ID"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();

      const [shipments] = await connection.query(
        `SELECT id, order_id, merchant_id, tracking_number,
                shipment_status, origin_hub_id,
                destination_hub_id, current_hub_id
         FROM merchant_shipments
         WHERE id = ?
         FOR UPDATE`,
        [shipmentId]
      );

      if (shipments.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const shipment = shipments[0];

      if (shipment.shipment_status !== "Received at Origin Hub") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Shipment must be received at the origin hub before dispatch",
          currentStatus: shipment.shipment_status
        });
      }

      if (
        !shipment.origin_hub_id ||
        !shipment.destination_hub_id ||
        Number(shipment.current_hub_id) !== Number(shipment.origin_hub_id)
      ) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Shipment origin, destination, or current hub is invalid"
        });
      }

      const [hubs] = await connection.query(
        `SELECT id, hub_name, city, state, status
         FROM dispatch_hubs
         WHERE id IN (?, ?)
         ORDER BY id
         FOR UPDATE`,
        [shipment.origin_hub_id, shipment.destination_hub_id]
      );

      const origin = hubs.find(
        h => Number(h.id) === Number(shipment.origin_hub_id)
      );
      const destination = hubs.find(
        h => Number(h.id) === Number(shipment.destination_hub_id)
      );

      if (!origin || !destination) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Origin or destination hub was not found"
        });
      }

      if (origin.status !== "Active" || destination.status !== "Active") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Origin and destination hubs must both be active"
        });
      }

      if (Number(origin.id) === Number(destination.id)) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Origin and destination hubs must be different"
        });
      }

      const [transferResult] = await connection.query(
        `INSERT INTO hub_transfers
          (shipment_id, origin_hub_id, destination_hub_id,
           transfer_status, transport_reference, dispatched_at)
         VALUES (?, ?, ?, 'In Transit', ?, NOW())`,
        [
          shipmentId,
          shipment.origin_hub_id,
          shipment.destination_hub_id,
          transportReference || null
        ]
      );

      await connection.query(
        `UPDATE merchant_shipments
         SET shipment_status = 'In Transit'
         WHERE id = ?`,
        [shipmentId]
      );

      await connection.query(
        `INSERT INTO shipment_tracking_events
          (shipment_id, event_status, location_type, hub_id,
           city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipmentId,
          "In Transit",
          "hub",
          origin.id,
          origin.city,
          origin.state,
          `Shipment dispatched from ${origin.hub_name} to ${destination.hub_name}` +
            (transportReference ? `. Transport reference: ${transportReference}` : ""),
          "admin",
          req.user.id
        ]
      );

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: "Shipment dispatched to destination hub",
        transfer: {
          id: transferResult.insertId,
          shipment_id: shipmentId,
          origin_hub_id: origin.id,
          origin_hub: origin.hub_name,
          destination_hub_id: destination.id,
          destination_hub: destination.hub_name,
          transfer_status: "In Transit",
          transport_reference: transportReference || null
        }
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Dispatch rollback error:", rollbackError.message);
        }
      }

      console.error("Intercity dispatch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to dispatch shipment"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


// ============================================================
// DESTINATION HUB ARRIVAL
// POST /api/admin/hub-transfers/:transferId/arrive
// ============================================================
router.post(
  "/hub-transfers/:transferId/arrive",
  async (req, res) => {
    let connection;

    try {
      const transferId = Number(req.params.transferId);

      if (!Number.isSafeInteger(transferId) || transferId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid transfer ID"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();

      const [transfers] = await connection.query(
        `SELECT id, shipment_id, origin_hub_id, destination_hub_id,
                transfer_status, transport_reference
         FROM hub_transfers
         WHERE id = ?
         FOR UPDATE`,
        [transferId]
      );

      if (transfers.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Hub transfer not found"
        });
      }

      const transfer = transfers[0];

      if (transfer.transfer_status !== "In Transit") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Only In Transit transfers can be marked as arrived",
          currentTransferStatus: transfer.transfer_status
        });
      }

      const [shipments] = await connection.query(
        `SELECT id, shipment_status, destination_hub_id
         FROM merchant_shipments
         WHERE id = ?
         FOR UPDATE`,
        [transfer.shipment_id]
      );

      if (
        shipments.length === 0 ||
        shipments[0].shipment_status !== "In Transit" ||
        Number(shipments[0].destination_hub_id) !==
          Number(transfer.destination_hub_id)
      ) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Shipment status or destination does not match this transfer"
        });
      }

      const [hubs] = await connection.query(
        `SELECT id, hub_name, city, state, status
         FROM dispatch_hubs
         WHERE id = ?`,
        [transfer.destination_hub_id]
      );

      if (hubs.length === 0 || hubs[0].status !== "Active") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Destination hub does not exist or is inactive"
        });
      }

      const destination = hubs[0];

      await connection.query(
        `UPDATE hub_transfers
         SET transfer_status = 'Arrived', arrived_at = NOW()
         WHERE id = ?`,
        [transferId]
      );

      await connection.query(
        `UPDATE merchant_shipments
         SET shipment_status = 'Arrived at Destination Hub',
             current_hub_id = ?
         WHERE id = ?`,
        [destination.id, transfer.shipment_id]
      );

      await connection.query(
        `INSERT INTO shipment_tracking_events
          (shipment_id, event_status, location_type, hub_id,
           city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transfer.shipment_id,
          "Arrived at Destination Hub",
          "hub",
          destination.id,
          destination.city,
          destination.state,
          `Shipment received at destination hub: ${destination.hub_name}`,
          "admin",
          req.user.id
        ]
      );

      await connection.commit();

      return res.json({
        success: true,
        message: "Shipment arrived at destination hub successfully",
        transfer: {
          id: transferId,
          shipment_id: transfer.shipment_id,
          transfer_status: "Arrived",
          destination_hub_id: destination.id,
          destination_hub: destination.hub_name,
          shipment_status: "Arrived at Destination Hub"
        }
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Arrival rollback error:", rollbackError.message);
        }
      }

      console.error("Destination hub arrival error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to record destination hub arrival"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


// =====================================================
// CREATE DISPATCH USER - ADMIN ONLY
// This router already requires admin authentication.
// =====================================================
router.post("/dispatch-users", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const phone = req.body.phone
 ? String(req.body.phone).trim()
      : null;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES (?, ?, ?, ?, 'dispatch')`,
      [name, email, hashedPassword, phone]
    );

    return res.status(201).json({
      success: true,
      message: "Dispatch account created successfully",
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        role: "dispatch"
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    console.error("Create dispatch user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create dispatch account"
    });
  }
});



/* ==========================================
   DISPATCH REGISTRATION APPROVALS
   Admin authentication is already enabled
========================================== */

// GET pending dispatch registration requests
router.get("/dispatch-requests", async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT id, name, email, phone, approval_status, created_at
      FROM users
      WHERE role = 'dispatch'
        AND approval_status = 'Pending'
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Fetch dispatch requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dispatch requests"
    });
  }
});

// APPROVE a dispatch registration
router.put("/dispatch-requests/:id/approved", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispatch request ID"
      });
    }

    const [result] = await db.query(`
      UPDATE users
      SET approval_status = 'Approved',
          approval_date = NOW()
      WHERE id = ?
        AND role = 'dispatch'
        AND approval_status = 'Pending'
    `, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Pending dispatch request not found"
      });
    }

    res.json({
      success: true,
      message: "Dispatch registration approved successfully"
    });
  } catch (error) {
    console.error("Approve dispatch request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve dispatch request"
    });
  }
});

// REJECT a dispatch registration
router.put("/dispatch-requests/:id/rejected", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispatch request ID"
      });
    }

    const [result] = await db.query(`
      UPDATE users
      SET approval_status = 'Rejected',
          approval_date = NOW()
      WHERE id = ?
        AND role = 'dispatch'
        AND approval_status = 'Pending'
    `, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Pending dispatch request not found"
      });
    }

    res.json({
      success: true,
      message: "Dispatch registration rejected"
    });
  } catch (error) {
    console.error("Reject dispatch request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject dispatch request"
    });
  }
});

router.get("/dispatch-partners/count", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE role = 'dispatch'
       AND approval_status = 'Approved'`
    );

    res.json({
      success: true,
      total: Number(rows[0].total || 0),
    });
  } catch (error) {
    console.error("Dispatch count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dispatch partner count",
    });
  }
});


router.get("/dispatch-partners", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, email, phone, approval_status, approval_date
      FROM users
      WHERE role = 'dispatch'
        AND approval_status = 'Approved'
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      partners: rows,
    });
  } catch (error) {
    console.error("Fetch dispatch partners error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dispatch partners",
    });
  }
});

module.exports = router;
