const express = require("express");
const db = require("../db");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();


/* =====================================================
   CREATE ORDER
===================================================== */

router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {

    const connection = await db.getConnection();

    try {

      const {
        user_id,
        total_amount,
        payment_method,
        payment_status,
        shipping_address,
        items,
        address_id,
      } = req.body;


      /* ============================================
   VALIDATE AUTHENTICATED CUSTOMER
============================================ */

if (!req.user?.id) {
  return res.status(401).json({
    success: false,
    message: "Authenticated customer not found",
  });
}

/*
  Always use the ID from JWT.
  Do not trust user_id sent by frontend.
*/
const authenticatedUserId = req.user.id;

console.log("CREATE ORDER USER:", {
  jwtUserId: req.user.id,
  bodyUserId: user_id,
  role: req.user.role,
});
      /* ============================================
         VALIDATE ITEMS
      ============================================ */

      if (
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {

        return res.status(400).json({
          success: false,
          message: "Order items are required",
        });

      }


      await connection.beginTransaction();


      const orderTotal =
        Number(total_amount || 0);


      /* ============================================
         CREATE ORDER
      ============================================ */

      const [orderResult] =
        await connection.query(
          `
          INSERT INTO orders
          (
            user_id,
            address_id,
            total_amount,
            payment_method,
            payment_status,
            order_status,
            delivery_status,
            shipping_address
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            user_id,

            address_id || null,

            orderTotal,

            payment_method ||
              "Cash on Delivery",

            payment_status ||
              "Pending",

            "Placed",

            "Not Assigned",

            shipping_address
              ? JSON.stringify(shipping_address)
              : null,
          ]
        );


      const orderId =
        orderResult.insertId;
/* ============================================
   DELIVERY PARTNER
   Keep order unassigned until a partner accepts
============================================ */

const assignedDeliveryPartner = null;
      /* ============================================
         CREATE ORDER ITEMS
         + REDUCE STOCK
      ============================================ */

      for (
        const item of items
      ) {

        const productId =
          item.product_id ||
          item.productId ||
          item.id;


        const quantity =
          Number(item.quantity || 1);


        const price =
          Number(item.price || 0);


        if (!productId) {

          throw new Error(
            "Product ID is missing"
          );

        }


        if (
          quantity <= 0 ||
          Number.isNaN(quantity)
        ) {

          throw new Error(
            "Invalid product quantity"
          );

        }


        /* ==========================================
           CHECK PRODUCT
        ========================================== */

        const [productRows] =
          await connection.query(
            `
            SELECT
              id,
              name,
              stock
            FROM products
            WHERE id = ?
            FOR UPDATE
            `,
            [productId]
          );


        if (
          productRows.length === 0
        ) {

          throw new Error(
            `Product ${productId} not found`
          );

        }


        const currentStock =
          Number(
            productRows[0].stock || 0
          );


        if (
          currentStock < quantity
        ) {

          throw new Error(
            `${productRows[0].name} has only ${currentStock} items available`
          );

        }


        /* ==========================================
           INSERT ORDER ITEM
        ========================================== */

        await connection.query(
          `
          INSERT INTO order_items
          (
            order_id,
            product_id,
            quantity,
            price
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            orderId,
            productId,
            quantity,
            price,
          ]
        );


        /* ==========================================
           REDUCE STOCK
        ========================================== */

        await connection.query(
          `
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
          `,
          [
            quantity,
            productId,
          ]
        );

      }


      /* ============================================
         COMMIT TRANSACTION
      ============================================ */

      await connection.commit();


      /* ============================================
         SUCCESS RESPONSE
      ============================================ */

      res.status(201).json({

        success: true,

        message:
          assignedDeliveryPartner
            ? "Order placed and delivery partner assigned successfully"
            : "Order placed successfully. Waiting for an available delivery partner.",


        order: {

          id: orderId,

          user_id,

          address_id:
            address_id || null,

          total_amount:
            orderTotal,

          payment_method:
            payment_method ||
            "Cash on Delivery",

          payment_status:
            payment_status ||
            "Pending",

          order_status:
            "Placed",

          delivery_partner_id:
            assignedDeliveryPartner
              ? assignedDeliveryPartner.id
              : null,

          delivery_status:
            assignedDeliveryPartner
              ? "Assigned"
              : "Not Assigned",

          shipping_address:
            shipping_address ||
            null,

          items,

        },


        delivery_partner:

          assignedDeliveryPartner
            ? {

                id:
                  assignedDeliveryPartner.id,

                name:
                  assignedDeliveryPartner.name,

                city:
                  assignedDeliveryPartner.city,

              }
            : null,

      });


    } catch (error) {

      await connection.rollback();

      console.error(
        "Create order error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to create order",

        error:
          error.message,

      });


    } finally {

      connection.release();

    }

  }
);


/* =====================================================
   GET USER ORDERS
===================================================== */

router.get(
  "/user/:userId",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {

    try {

      const userId =
        req.params.userId;


      if (
        String(req.user.id) !==
        String(userId)
      ) {

        return res.status(403).json({
          success: false,
          message: "Access denied",
        });

      }


      const [orders] =
        await db.query(
          `
          SELECT

            o.id,

            o.user_id,

            o.address_id,

            o.total_amount,

            o.payment_method,

            o.payment_status,

            o.order_status,

            o.delivery_partner_id,

            o.delivery_status,

            o.shipping_address,

            o.created_at,

            o.assigned_at,


            GROUP_CONCAT(
              DISTINCT p.name
              ORDER BY p.name
              SEPARATOR ', '
            ) AS product_names,


            COALESCE(
              SUM(oi.quantity),
              0
            ) AS total_quantity


          FROM orders o


          LEFT JOIN order_items oi
            ON o.id = oi.order_id


          LEFT JOIN products p
            ON oi.product_id = p.id


          WHERE o.user_id = ?


          GROUP BY

            o.id,

            o.user_id,

            o.address_id,

            o.total_amount,

            o.payment_method,

            o.payment_status,

            o.order_status,

            o.delivery_partner_id,

            o.delivery_status,

            o.shipping_address,

            o.created_at,

            o.assigned_at


          ORDER BY o.id DESC
          `,
          [userId]
        );


      const formattedOrders =
        orders.map((order) => {

          let shippingAddress =
            order.shipping_address;


          if (
            typeof shippingAddress ===
            "string"
          ) {

            try {

              shippingAddress =
                JSON.parse(
                  shippingAddress
                );

            } catch {

              // Keep original value

            }

          }


          return {

            ...order,

            shipping_address:
              shippingAddress,

          };

        });


      res.json({

        success: true,

        count:
          formattedOrders.length,

        orders:
          formattedOrders,

      });


    } catch (error) {

      console.error(
        "Fetch orders error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to fetch orders",

        error:
          error.message,

      });

    }

  }
);


/* =====================================================
   UPDATE RETURN STATUS - DELIVERY PARTNER
===================================================== */

router.put(
  "/:orderId/return/status",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {

    try {

      const orderId =
        req.params.orderId;

      const {
        return_status,
      } = req.body;


      const allowedStatuses = [

        "Pickup Scheduled",

        "Picked Up",

        "Return Completed",

      ];


      if (
        !allowedStatuses.includes(
          return_status
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid return status",

        });

      }


      const [orders] =
        await db.query(
          `
          SELECT
            id
          FROM orders
          WHERE

            id = ?

            AND delivery_partner_id = ?

            AND return_status IS NOT NULL
          `,
          [
            orderId,

            req.user.id,
          ]
        );


      if (
        orders.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Return order not found",

        });

      }


     await db.query(
  `
  UPDATE orders
  SET
    return_status = ?
  WHERE
    id = ?
  `,
  [
    return_status,
    orderId,
  ]
);


/* ==========================================
   ADD ₹50 EARNING FOR RETURN COMPLETED
========================================== */

if (return_status === "Return Completed") {

  await db.query(
    `
    INSERT IGNORE INTO delivery_partner_earnings
    (
      delivery_partner_id,
      order_id,
      amount,
      earning_type
    )
    VALUES (?, ?, 50.00, 'Return')
    `,
    [
      req.user.id,
      orderId,
    ]
  );

}


      res.json({

        success: true,

        message:
          "Return status updated successfully",

        order: {

          id:
            orderId,

          return_status,

        },

      });

    } catch (error) {

      console.error(
        "Update return status error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to update return status",

      });

    }

  }
);

/* =====================================================
   GET RETURNS - DELIVERY PARTNER
===================================================== */

router.get(
  "/returns",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {

    try {

      const deliveryPartnerId =
        req.user.id;

      const [returns] =
        await db.query(
          `
          SELECT

            o.id,

            o.return_status,

            o.return_reason,

            o.return_requested_at,

            o.shipping_address,

            u.name AS customer_name,

            u.email AS customer_email,

            GROUP_CONCAT(
              DISTINCT p.name
              ORDER BY p.name
              SEPARATOR ', '
            ) AS product_names

          FROM orders o

          LEFT JOIN users u
            ON o.user_id = u.id

          LEFT JOIN order_items oi
            ON o.id = oi.order_id

          LEFT JOIN products p
            ON oi.product_id = p.id

          WHERE

            o.delivery_partner_id = ?

            AND o.return_status IS NOT NULL

          GROUP BY

            o.id,

            o.return_status,

            o.return_reason,

            o.return_requested_at,

            o.shipping_address,

            u.name,

            u.email

          ORDER BY
            o.return_requested_at DESC
          `,
          [
            deliveryPartnerId
          ]
        );


      const formattedReturns =
        returns.map((item) => {

          let address =
            item.shipping_address;

          if (
            typeof address === "string"
          ) {

            try {

              address =
                JSON.parse(address);

            } catch {

              // Keep original value

            }

          }

          return {

            ...item,

            shipping_address:
              address,

            address_line:

              address?.address_line ||

              address?.address ||

              address?.street ||

              item.shipping_address,

          };

        });


      res.json({

        success: true,

        returns:
          formattedReturns,

      });

    } catch (error) {

      console.error(
        "Fetch returns error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to fetch returns",

      });

    }

  }
);

/* =====================================================
   GET SINGLE ORDER
===================================================== */

router.get(
  "/:orderId",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {

    try {

      const orderId =
        req.params.orderId;


      const [orders] =
        await db.query(
          `
          SELECT

            o.id,

            o.user_id,

            o.address_id,

            o.total_amount,

            o.payment_method,

            o.payment_status,

            o.order_status,

            o.delivery_partner_id,

            o.delivery_status,

            o.shipping_address,

            o.created_at,

            o.assigned_at,

            o.return_status,
o.return_reason,
o.return_requested_at,


            u.name AS customer_name,

            u.email AS customer_email,


            a.full_name AS address_full_name,

            a.phone AS address_phone,

            a.address_line,

            a.city,

            a.state,

            a.pincode


          FROM orders o


          LEFT JOIN users u
            ON o.user_id = u.id


          LEFT JOIN addresses a
            ON o.address_id = a.id


          WHERE
            o.id = ?
            AND o.user_id = ?
          `,
          [
            orderId,
            req.user.id,
          ]
        );


      if (
        orders.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Order not found",

        });

      }


      const [items] =
        await db.query(
          `
          SELECT

            oi.id,

            oi.order_id,

            oi.product_id,

            oi.quantity,

            oi.price,


            p.name AS product_name,

            p.image AS product_image


          FROM order_items oi


          LEFT JOIN products p
            ON oi.product_id = p.id


          WHERE oi.order_id = ?


          ORDER BY oi.id ASC
          `,
          [orderId]
        );


      let shippingAddress =
        orders[0].shipping_address;


      if (
        typeof shippingAddress ===
        "string"
      ) {

        try {

          shippingAddress =
            JSON.parse(
              shippingAddress
            );

        } catch {

          // Keep original value

        }

      }


      res.json({

        success: true,

        order: {

          ...orders[0],

          shipping_address:
            shippingAddress,

          items,

        },

      });


    } catch (error) {

      console.error(
        "Get order error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to fetch order",

        error:
          error.message,

      });

    }

  }
);


/* =====================================================
   CANCEL ORDER
===================================================== */

router.put(
  "/:orderId/cancel",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {

    const connection =
      await db.getConnection();


    try {

      const orderId =
        req.params.orderId;

      const {
  cancellation_reason,
} = req.body;


      await connection.beginTransaction();


      /* ==========================================
         GET ORDER
      ========================================== */

      const [orders] =
        await connection.query(
          `
          SELECT
            id,
            user_id,
            order_status,
            delivery_status,
            delivery_partner_id
          FROM orders
          WHERE
            id = ?
            AND user_id = ?
          FOR UPDATE
          `,
          [
            orderId,
            req.user.id,
          ]
        );


      if (
        orders.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({

          success: false,

          message:
            "Order not found",

        });

      }


      const order =
        orders[0];
      if (
  !cancellation_reason ||
  !String(cancellation_reason).trim()
) {

  await connection.rollback();

  return res.status(400).json({

    success: false,

    message:
      "Cancellation reason is required",

  });

}


      if (
        order.order_status ===
        "Delivered"
      ) {

        await connection.rollback();

        return res.status(400).json({

          success: false,

          message:
            "Delivered order cannot be cancelled",

        });

      }


      if (
        order.order_status ===
        "Cancelled"
      ) {

        await connection.rollback();

        return res.status(400).json({

          success: false,

          message:
            "Order is already cancelled",

        });

      }


      /* ==========================================
         RESTORE PRODUCT STOCK
      ========================================== */

      const [items] =
        await connection.query(
          `
          SELECT
            product_id,
            quantity
          FROM order_items
          WHERE order_id = ?
          `,
          [orderId]
        );


      for (
        const item of items
      ) {

        await connection.query(
          `
          UPDATE products
          SET stock = stock + ?
          WHERE id = ?
          `,
          [
            item.quantity,
            item.product_id,
          ]
        );

      }


      /* ==========================================
         CANCEL ORDER
      ========================================== */

      await connection.query(
        `
        UPDATE orders
SET

  order_status =
    'Cancelled',

  cancellation_reason =
    ?,

  delivery_status =
    'Cancelled',

  delivery_partner_id =
    NULL

WHERE id = ?
        `,
        [cancellation_reason, orderId]
      );


      /* ==========================================
         MAKE DELIVERY PARTNER ONLINE AGAIN
      ========================================== */

      if (
        order.delivery_partner_id
      ) {

        await connection.query(
          `
          UPDATE delivery_partners
          SET
            availability_status =
              'Online'
          WHERE id = ?
          `,
          [
            order.delivery_partner_id,
          ]
        );


        /* CREATE CANCEL NOTIFICATION */

        await connection.query(
          `
          INSERT INTO delivery_notifications
          (
            delivery_partner_id,
            order_id,
            title,
            message,
            is_read
          )
          VALUES (?, ?, ?, ?, FALSE)
          `,
          [
            order.delivery_partner_id,

            orderId,

            "Order Cancelled",

            `Order #${orderId} has been cancelled`,

          ]
        );

      }


      await connection.commit();


      res.json({

        success: true,

        message:
          "Order cancelled successfully",

      });


    } catch (error) {

      await connection.rollback();


      console.error(
        "Cancel order error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to cancel order",

        error:
          error.message,

      });


    } finally {

      connection.release();

    }

  }
);

/* =====================================================
   REQUEST RETURN
===================================================== */

router.put(
  "/:orderId/return",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {

    const connection =
      await db.getConnection();


    try {

      const orderId =
        req.params.orderId;


      const {
        return_reason,
      } = req.body;


      /* ==========================================
         VALIDATE RETURN REASON
      ========================================== */

      if (
        !return_reason ||
        !String(return_reason).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Return reason is required",

        });

      }


      await connection.beginTransaction();


      /* ==========================================
         GET ORDER
      ========================================== */

      const [orders] =
        await connection.query(
          `
          SELECT
            id,
            user_id,
            order_status,
            return_status,
            delivery_partner_id
          FROM orders
          WHERE
            id = ?
            AND user_id = ?
          FOR UPDATE
          `,
          [
            orderId,
            req.user.id,
          ]
        );


      /* ==========================================
         ORDER NOT FOUND
      ========================================== */

      if (
        orders.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({

          success: false,

          message:
            "Order not found",

        });

      }


      const order =
        orders[0];


      /* ==========================================
         ONLY DELIVERED ORDERS CAN BE RETURNED
      ========================================== */

      if (
        String(
          order.order_status
        ).toLowerCase()
        !==
        "delivered"
      ) {

        await connection.rollback();

        return res.status(400).json({

          success: false,

          message:
            "Only delivered orders can be returned",

        });

      }


      /* ==========================================
         PREVENT DUPLICATE RETURN REQUEST
      ========================================== */

      if (
        order.return_status
      ) {

        await connection.rollback();

        return res.status(400).json({

          success: false,

          message:
            "Return request already exists for this order",

        });

      }


      /* ==========================================
         UPDATE RETURN DETAILS
      ========================================== */

      await connection.query(
        `
        UPDATE orders
        SET

          return_status =
            'Requested',

          return_reason =
            ?,

          return_requested_at =
            NOW()

        WHERE id = ?
        `,
        [
          String(
            return_reason
          ).trim(),

          orderId,
        ]
      );


      /* ==========================================
         NOTIFY DELIVERY PARTNER
      ========================================== */

      if (
        order.delivery_partner_id
      ) {

        await connection.query(
          `
          INSERT INTO delivery_notifications
          (
            delivery_partner_id,
            order_id,
            title,
            message,
            is_read
          )
          VALUES (?, ?, ?, ?, FALSE)
          `,
          [
            order.delivery_partner_id,

            orderId,

            "Return Request",

            `Return requested for order #${orderId}`,

          ]
        );

      }


      /* ==========================================
         COMMIT
      ========================================== */

      await connection.commit();


      /* ==========================================
         SUCCESS RESPONSE
      ========================================== */

      res.json({

        success: true,

        message:
          "Return request submitted successfully",

        order: {

          id:
            orderId,

          return_status:
            "Requested",

          return_reason:
            String(
              return_reason
            ).trim(),

        },

      });


    } catch (error) {

      await connection.rollback();


      console.error(
        "Return request error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to request return",

        error:
          error.message,

      });


    } finally {

      connection.release();

    }

  }
);
/* =====================================================
   MERCHANT ORDERS
===================================================== */

router.get(
  "/merchant/:merchantId",
  requireAuth,
  requireRole("merchant"),
  async (req, res) => {

    try {

      const merchantId = req.params.merchantId;

      /* ==========================================
         VERIFY MERCHANT
      ========================================== */

      if (
        String(req.user.id) !==
        String(merchantId)
      ) {

        return res.status(403).json({

          success: false,

          message: "Access denied",

        });

      }


      /* ==========================================
         GET MERCHANT ORDERS
      ========================================== */

      const [orders] = await db.query(
        `
        SELECT DISTINCT

          o.id,

          o.user_id,

          o.address_id,

          o.total_amount,

          o.payment_method,

          o.payment_status,

          o.order_status,

          o.delivery_partner_id,

          o.delivery_status,

          o.shipping_address,

          o.created_at,

          o.assigned_at,

          o.delivered_at,

          o.cancellation_reason,

          o.return_requested_at,

          o.return_reason,

          o.return_status,


          /* CUSTOMER */

          u.name AS customer_name,

          u.email AS customer_email,


          /* ADDRESS */

          a.full_name AS address_name,

          a.phone AS address_phone,

          a.address_line,

          a.city,

          a.state,

          a.pincode


        FROM orders o


        /* ORDER ITEMS */

        INNER JOIN order_items oi
          ON o.id = oi.order_id


        /* PRODUCTS */

        INNER JOIN products p
          ON oi.product_id = p.id


        /* CUSTOMER */

        LEFT JOIN users u
          ON o.user_id = u.id


        /* ADDRESS */

        LEFT JOIN addresses a
          ON o.address_id = a.id


        WHERE
          p.merchant_id = ?


        ORDER BY
          o.id DESC
        `,
        [merchantId]
      );


      /* ==========================================
         GET PRODUCT DETAILS FOR EACH ORDER
      ========================================== */

      const formattedOrders = await Promise.all(

        orders.map(async (order) => {

          const [items] = await db.query(
            `
            SELECT

              oi.id,

              oi.order_id,

              oi.product_id,

              oi.quantity,

              oi.price,

              p.name AS product_name,

              p.image AS product_image,

              p.brand,

              p.category


            FROM order_items oi


            INNER JOIN products p
              ON oi.product_id = p.id


            WHERE
              oi.order_id = ?

              AND p.merchant_id = ?


            ORDER BY
              oi.id ASC
            `,
            [
              order.id,
              merchantId,
            ]
          );


          /* ========================================
             SHIPPING ADDRESS FALLBACK
          ======================================== */

          let shippingAddress =
            order.shipping_address;


          if (
            typeof shippingAddress ===
            "string"
          ) {

            try {

              shippingAddress =
                JSON.parse(
                  shippingAddress
                );

            } catch {

              // Keep original value

            }

          }


          return {

            ...order,

            shipping_address:
              shippingAddress,

            items,

          };

        })

      );


      /* ==========================================
         RESPONSE
      ========================================== */

      res.json({

        success: true,

        count:
          formattedOrders.length,

        orders:
          formattedOrders,

      });


    } catch (error) {

      console.error(
        "Merchant orders error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch merchant orders",

        error:
          error.message,

      });

    }

  }
);
/* =====================================================
   UPDATE ORDER STATUS - MERCHANT
===================================================== */

router.put(
  "/:orderId/status",
  requireAuth,
  requireRole("merchant"),
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const { order_status } = req.body;
      const merchantId = req.user.id;

      /* ==========================================
         CHECK MERCHANT OWNS PRODUCT
      ========================================== */

      const [merchantOrder] = await db.query(
        `
        SELECT
          oi.order_id
        FROM order_items oi
        JOIN products p
          ON oi.product_id = p.id
        WHERE
          oi.order_id = ?
          AND p.merchant_id = ?
        LIMIT 1
        `,
        [orderId, merchantId]
      );

      if (merchantOrder.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      /* ==========================================
         ALLOWED STATUSES
      ========================================== */

      const allowedStatuses = [
        "Placed",
        "Confirmed",
        "Shipped",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(order_status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      /* ==========================================
         GET ORDER + ADDRESS
      ========================================== */

      const [existingOrders] = await db.query(
        `
        SELECT
          o.id,
          o.order_status,
          o.delivery_partner_id,
          o.delivery_status,
          o.address_id,

          a.city AS delivery_city

        FROM orders o

        LEFT JOIN addresses a
          ON o.address_id = a.id

        WHERE o.id = ?
        `,
        [orderId]
      );

      if (existingOrders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const existingOrder =
        existingOrders[0];

      console.log(
        "ORDER DELIVERY CITY:",
        existingOrder.delivery_city
      );

      /* ==========================================
         UPDATE MERCHANT ORDER STATUS
      ========================================== */

      await db.query(
        `
        UPDATE orders
        SET order_status = ?
        WHERE id = ?
        `,
        [order_status, orderId]
      );


      /* ==========================================
         RESPONSE
      ========================================== */

      const [updatedOrders] = await db.query(
        `
        SELECT
          o.id,
          o.order_status,
          o.delivery_partner_id,
          o.delivery_status,
          o.assigned_at,
          a.city AS delivery_city

        FROM orders o

        LEFT JOIN addresses a
          ON o.address_id = a.id

        WHERE o.id = ?
        `,
        [orderId]
      );

      res.json({
        success: true,
        message:
          "Order status updated successfully",
        order: updatedOrders[0],
      });

    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update order status",
        error: error.message,
      });
    }
  }
);

module.exports = router;