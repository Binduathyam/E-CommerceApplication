const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");


const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();


const deliveryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/delivery-documents");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const uploadDeliveryDocument = multer({
  storage: deliveryStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG and PNG images are allowed."
        )
      );
    }
  },
});

/* =================================
   DELIVERY PARTNER LOGIN
================================= */
router.post(
  "/login",
  async (req, res) => {

    let connection;

    try {

      const {
        email,
        password
      } = req.body;

      /* =========================
         VALIDATE INPUT
      ========================= */

      if (!email || !password) {

        return res.status(400).json({
          success: false,
          message:
            "Email and password are required"
        });

      }

      /* =========================
         NORMALIZE EMAIL
      ========================= */

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /* =========================
         FIND DELIVERY PARTNER
      ========================= */

      const [partners] =
        await db.query(
          `
          SELECT *
          FROM delivery_partners
          WHERE email = ?
          `,
          [normalizedEmail]
        );

      if (partners.length === 0) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password"
        });

      }

      /* =========================
         GET PARTNER
      ========================= */

      const deliveryPartner =
        partners[0];

      /* =========================
         CHECK PASSWORD
      ========================= */

      const isPasswordCorrect =
        await bcrypt.compare(
          password,
          deliveryPartner.password
        );

      if (!isPasswordCorrect) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password"
        });

      }

      /* =========================
         CHECK ACCOUNT STATUS
      ========================= */

      if (
        deliveryPartner.status !==
        "active"
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Your delivery partner account is not active"
        });

      }


     /* =========================
   CHECK ADMIN APPROVAL
========================= */

if (
  deliveryPartner.approval_status !==
  "Approved"
) {

  return res.status(403).json({
    success: false,
    message:
      deliveryPartner.approval_status === "Rejected"
        ? "Your delivery partner account has been rejected by the admin."
        : "Your delivery partner account is pending admin approval."
  });

}

      /* =================================
         MAKE PARTNER ONLINE
      ================================= */

      

      /* =========================
         CREATE JWT TOKEN
      ========================= */

      const token =
        jwt.sign(
          {
            id:
              deliveryPartner.id,

            role:
              "delivery"
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "7d"
          }
        );

      /* =========================
         LOGIN SUCCESS
      ========================= */

      res.json({

        success: true,

        message:
          "Delivery partner login successful",

        token: token,

        user: {

          id:
            deliveryPartner.id,

          name:
            deliveryPartner.name,

          email:
            deliveryPartner.email,

          phone:
            deliveryPartner.phone,

          role:
            "delivery",

          availability_status:
  deliveryPartner.availability_status
        }

      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(
            "Rollback error:",
            rollbackError
          );
        }

      }

      console.error(
        "Delivery login error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to login delivery partner",

        error:
          error.message

      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);

/* =================================
   HELPER: GET ORDER CUSTOMER CITY
================================= */

const getOrderCustomerCity = async (
  connection,
  order
) => {

  let shippingAddress =
    order.shipping_address;

  /*
    First try shipping_address
  */

  if (shippingAddress) {

    try {

      if (
        typeof shippingAddress ===
        "string"
      ) {

        shippingAddress =
          JSON.parse(
            shippingAddress
          );

      }

      if (
        shippingAddress?.city
      ) {

        return shippingAddress.city
          .trim()
          .toLowerCase();

      }

    } catch (error) {

      console.log(
        "Shipping address parse failed"
      );

    }

  }


  /*
    If shipping_address is NULL,
    get city from addresses table
  */

  if (order.address_id) {

    const [addresses] =
      await connection.query(
        `
        SELECT city
        FROM addresses
        WHERE id = ?
        `,
        [order.address_id]
      );

    if (
      addresses.length > 0 &&
      addresses[0].city
    ) {

      return addresses[0].city
        .trim()
        .toLowerCase();

    }

  }

  return null;

};


/* =================================
   AUTO ASSIGN WAITING ORDER
================================= */
const assignWaitingOrder = async (
  connection,
  deliveryPartnerId
) => {

  // Get delivery partner
  const [partners] = await connection.query(
    `
    SELECT
      id,
      city,
      status,
      availability_status
    FROM delivery_partners
    WHERE id = ?
    FOR UPDATE
    `,
    [deliveryPartnerId]
  );

  if (partners.length === 0) {
    return null;
  }

  const partner = partners[0];

  // Partner must be active and Online
  if (
    partner.status !== "active" ||
    partner.availability_status !== "Online" ||
    !partner.city
  ) {
    return null;
  }

  const partnerCity = partner.city
    .trim()
    .toLowerCase();

  // Get waiting shipped orders
  const [orders] = await connection.query(
    `
    SELECT
      id,
      address_id,
      shipping_address,
      created_at
    FROM orders
    WHERE
      delivery_partner_id IS NULL
      AND delivery_status = 'Not Assigned'
      AND order_status = 'Shipped'
    ORDER BY created_at ASC
    FOR UPDATE
    `
  );

  // Find ONE same-city order
  for (const order of orders) {

    const customerCity =
      await getOrderCustomerCity(
        connection,
        order
      );

    if (
      customerCity &&
      customerCity.trim().toLowerCase() ===
        partnerCity
    ) {

      const [result] = await connection.query(
        `
        UPDATE orders
        SET
          delivery_partner_id = ?,
          delivery_status = 'Assigned',
          assigned_at = NOW()
        WHERE
          id = ?
          AND delivery_partner_id IS NULL
        `,
        [
          deliveryPartnerId,
          order.id
        ]
      );

      if (result.affectedRows === 0) {
        continue;
      }

      // Mark delivery partner as Busy
      await connection.query(
  `
  UPDATE delivery_partners
  SET availability_status = 'Busy'
  WHERE id = ?
  `,
  [deliveryPartnerId]
);

      // Create notification
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
        VALUES
        (?, ?, ?, ?, FALSE)
        `,
        [
          deliveryPartnerId,
          order.id,
          "New Order Assigned",
          `A new order #${order.id} has been assigned to you`
        ]
 );

      console.log(
        `Order #${order.id} assigned to delivery partner #${deliveryPartnerId}`
      );

      return order;
    }
  }

  return null;
};
/* =================================
   TEST ROUTE
================================= */

router.get(
  "/test",
  (req, res) => {

    res.json({
      success: true,
      message:
        "Delivery routes are working"
    });

  }
);


/* =================================
   DELIVERY PARTNER REGISTRATION
================================= */

router.post(
  "/register",
uploadDeliveryDocument.single("license"),
  async (req, res) => {

    try {

     const {
  name,
  email,
  phone,
  password,
  address,
  city,
  state,
  vehicle_type,
  vehicle_number,
  license_number,
  security_question,
  security_answer
} = req.body;

      if (
  !name ||
  !email ||
  !phone ||
  !password ||
  !security_question ||
  !security_answer ||
  !req.file
) {
  return res.status(400).json({
    success: false,
    message:
      "Name, email, phone, password, security question, security answer and Driving Licence are required"
  });
}
      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      const [existingPartner] =
        await db.query(
          `
          SELECT id
          FROM delivery_partners
          WHERE email = ?
          `,
          [normalizedEmail]
        );


      if (
        existingPartner.length > 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Delivery partner already exists with this email"
        });

      }


      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      const [result] =
        await db.query(
          `
          INSERT INTO delivery_partners
          (
            name,
            email,
            phone,
            password,
            address,
            city,
            state,
            vehicle_type,
            vehicle_number,
            license_number,
            license_image,
           security_question,
            security_answer,
            status,
            approval_status,
            availability_status
          )
          VALUES
(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'Pending', 'Offline')
          `,
          [
            name.trim(),
            normalizedEmail,
            phone.trim(),
            hashedPassword,
            address?.trim() || null,
            city?.trim() || null,
            state?.trim() || null,
            vehicle_type?.trim() || null,
            vehicle_number?.trim() || null,
            license_number?.trim() || null,
req.file
  ? `/uploads/delivery-documents/${req.file.filename}`
  : null,
security_question,
            security_answer.trim()
          ]
        );


      res.status(201).json({

        success: true,

        message:
          "Delivery partner registered successfully",

        delivery_partner: {

          id:
            result.insertId,

          name:
            name.trim(),

          email:
            normalizedEmail,

          phone:
            phone.trim(),

          role:
            "delivery",

          availability_status:
            "Offline"

        }

      });

    } catch (error) {

      console.error(
        "Delivery registration error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to register delivery partner"
      });

    }

  }
);



/* =================================
   GET AVAILABLE DELIVERY PARTNERS
================================= */

router.get(
  "/partners",
  async (req, res) => {

    try {

      const [partners] =
        await db.query(
          `
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
            latitude,
            longitude
          FROM delivery_partners
          WHERE
            status = 'active'
            AND availability_status = 'Online'
          ORDER BY name ASC
          `
        );


      res.json({
        success: true,
        count:
          partners.length,
        partners
      });

    } catch (error) {

      console.error(
        "Get available partners error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch available delivery partners"
      });

    }

  }
);


/* =================================
   GET UNASSIGNED ORDERS
================================= */

router.get(
  "/orders",
  async (req, res) => {

    try {

      const [orders] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            address_id,
            total_amount,
            payment_method,
            payment_status,
            order_status,
            delivery_status,
            shipping_address,
            created_at
          FROM orders
          WHERE
            delivery_partner_id IS NULL
            AND order_status != 'Cancelled'
          ORDER BY created_at DESC
          `
        );


      res.json({
        success: true,
        count:
          orders.length,
        orders
      });

    } catch (error) {

      console.error(
        "Get unassigned orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch orders"
      });

    }

  }
);


/* =================================
   ASSIGN DELIVERY PARTNER TO ORDER
================================= */

router.put(
  "/assign-order",
  async (req, res) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        order_id,
        delivery_partner_id
      } = req.body;


      if (
        !order_id ||
        !delivery_partner_id
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Order ID and Delivery Partner ID are required"
        });

      }


      await connection.beginTransaction();


      const [orders] =
        await connection.query(
          `
          SELECT *
          FROM orders
          WHERE id = ?
          FOR UPDATE
          `,
          [order_id]
        );


      if (
        orders.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Order not found"
        });

      }


      const order =
        orders[0];


      if (
        order.order_status ===
        "Cancelled"
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Cancelled order cannot be assigned"
        });

      }


      if (
        order.delivery_partner_id !==
        null
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Order is already assigned"
        });

      }


      const [partners] =
        await connection.query(
          `
          SELECT *
          FROM delivery_partners
          WHERE id = ?
          AND status = 'active'
          AND availability_status = 'Online'
          FOR UPDATE
          `,
          [delivery_partner_id]
        );


      if (
        partners.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner is not available"
        });

      }


      await connection.query(
        `
        UPDATE orders
        SET
          delivery_partner_id = ?,
          delivery_status = 'Assigned',
          assigned_at = NOW()
        WHERE id = ?
        `,
        [
          delivery_partner_id,
          order_id
        ]
      );


      await connection.query(
        `
        UPDATE delivery_partners
        SET
          availability_status = 'Busy'
        WHERE id = ?
        `,
        [delivery_partner_id]
      );


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
          delivery_partner_id,
          order_id,
          "New Order Assigned",
          `A new order #${order_id} has been assigned to you`
        ]
      );


      await connection.commit();


      res.json({

        success: true,

        message:
          "Order assigned successfully",

        order: {

          id:
            Number(order_id),

          delivery_partner_id:
            Number(
              delivery_partner_id
            ),

          delivery_status:
            "Assigned"

        }

      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(rollbackError);
        }

      }

      console.error(
        "Assign order error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to assign order",
        error:
          error.message
      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);


/* =================================
   GET DELIVERY PARTNER ORDERS
================================= */
router.get(
  "/my-orders/:delivery_partner_id",
  async (req, res) => {
    try {
      const { delivery_partner_id } = req.params;

      // =====================================
      // GET DELIVERY PARTNER CITY
      // =====================================

      const [partners] = await db.query(
        `
        SELECT
          id,
          city,
          status,
          availability_status
        FROM delivery_partners
        WHERE id = ?
        LIMIT 1
        `,
        [delivery_partner_id]
      );

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found"
        });
      }

      const deliveryPartner = partners[0];

      // =====================================
      // GET ORDERS
      // =====================================

      const [orders] = await db.query(
        `
        SELECT
          o.id,
          o.user_id,
          o.address_id,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.order_status,
          o.delivery_status,
          o.return_status,
          o.return_reason,
          o.return_requested_at,
          o.shipping_address,
          o.created_at,
          o.assigned_at,
          o.delivered_at,

          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone,

          a.full_name AS address_name,
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
          (
            o.delivery_partner_id = ?
          )
          OR
          (
            o.delivery_partner_id IS NULL
            AND o.delivery_status = 'Not Assigned'
            AND o.order_status = 'Shipped'
            AND LOWER(TRIM(a.city)) =
                LOWER(TRIM(?))
          )

        ORDER BY
          CASE
            WHEN o.delivery_partner_id IS NULL
                 AND o.delivery_status = 'Not Assigned'
            THEN 0
            ELSE 1
          END,
          o.created_at DESC
        `,
        [
          delivery_partner_id,
          deliveryPartner.city
        ]
      );

      res.json({
        success: true,
        count: orders.length,
        delivery_partner_city:
          deliveryPartner.city,
        orders
      });

    } catch (error) {

      console.error(
        "My delivery orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch delivery orders",
        error: error.message
      });
    }
  }
);
    
/* =================================
   GET ACTIVE ORDERS
================================= */

router.get(
 "/active-orders/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [orders] =
        await db.query(
          `
          SELECT *
          FROM orders
          WHERE delivery_partner_id = ?
          AND delivery_status IN
          (
            'Assigned',
            'Accepted',
            'Picked Up',
            'Out for Delivery'
          )
          ORDER BY assigned_at DESC
          `,
          [delivery_partner_id]
        );


      res.json({
        success: true,
        count:
          orders.length,
        orders
      });

    } catch (error) {

      console.error(
        "Get active orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch active orders"
      });

    }

  }
);


/* =================================
   UPDATE DELIVERY STATUS
================================= */

router.put(
  "/update-status",
  async (req, res) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        order_id,
        delivery_partner_id,
        delivery_status
      } = req.body;


      if (
        !order_id ||
        !delivery_partner_id ||
        !delivery_status
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Order ID, Delivery Partner ID and Delivery Status are required"
        });

      }


      const status =
        delivery_status.trim();


      const allowedStatuses = [
        "Accepted",
        "Picked Up",
        "Out for Delivery",
        "Delivered"
      ];


      if (
        !allowedStatuses.includes(
          status
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery status"
        });

      }


      await connection.beginTransaction();


     const [orders] =
  await connection.query(
    `
    SELECT *
    FROM orders
    WHERE id = ?
    FOR UPDATE
    `,
    [
      order_id
    ]
  );


      if (
        orders.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Order not found or not assigned to this partner"
        });

      }


      const order =
        orders[0];


      const validTransitions = {
  "Not Assigned": "Accepted",
  Accepted: "Picked Up",
  "Picked Up": "Out for Delivery",
  "Out for Delivery": "Delivered"
};


      if (
        validTransitions[
          order.delivery_status
        ] !== status
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            `Cannot change status from '${order.delivery_status}' to '${status}'`
        });

      }
/* ==========================================
   FIRST ACCEPT WINS
========================================== */

if (
  status === "Accepted" &&
  order.delivery_status === "Not Assigned"
) {
  const [claimResult] =
    await connection.query(
      `
      UPDATE orders
      SET
        delivery_partner_id = ?,
        delivery_status = 'Accepted',
        assigned_at = NOW()
      WHERE
        id = ?
        AND delivery_partner_id IS NULL
        AND delivery_status = 'Not Assigned'
      `,
      [
        delivery_partner_id,
        order_id
      ]
    );

  if (claimResult.affectedRows === 0) {
    await connection.rollback();

    return res.status(409).json({
      success: false,
      message:
        "This order has already been accepted by another delivery partner"
    });
  }

  await connection.query(
    `
    UPDATE delivery_partners
    SET availability_status = 'Busy'
    WHERE id = ?
    `,
    [delivery_partner_id]
  );
}

     let newOrderStatus =
  order.order_status;

if (
  status === "Out for Delivery"
) {
  newOrderStatus =
    "Out for Delivery";
}

if (
  status === "Delivered"
) {
  newOrderStatus =
    "Delivered";
}


   if (status !== "Accepted") {
  await connection.query(
    `
    UPDATE orders
    SET
      delivery_status = ?,
      order_status = ?,
      payment_status = CASE
        WHEN ? = 'Delivered' THEN 'Paid'
        ELSE payment_status
      END,
      delivered_at = CASE
        WHEN ? = 'Delivered' THEN NOW()
        ELSE delivered_at
      END
    WHERE
      id = ?
      AND delivery_partner_id = ?
    `,
    [
      status,
      newOrderStatus,
      status,
      status,
      order_id,
      delivery_partner_id
    ]
  );
}

      /*
        When Delivered,
        partner becomes Online
      */
if (
  status === "Delivered"
) {

  /* ==========================================
     ADD ₹50 DELIVERY EARNING
  ========================================== */

  await connection.query(
    `
    INSERT IGNORE INTO delivery_partner_earnings
    (
      delivery_partner_id,
      order_id,
      amount,
      earning_type
    )
    VALUES (?, ?, 50.00, 'Delivery')
    `,
    [
      delivery_partner_id,
      order_id
    ]
  );


  /* ==========================================
     PARTNER BECOMES ONLINE
  ========================================== */

  await connection.query(
    `
    UPDATE delivery_partners
    SET
      availability_status = 'Online'
    WHERE id = ?
    `,
    [delivery_partner_id]
  );


  /* ==========================================
     AUTO ASSIGN NEXT WAITING ORDER
  ========================================== */

  

}


      await connection.commit();


      res.json({

        success: true,

        message:
          "Delivery status updated successfully",

        order: {

          id:
            Number(order_id),

          delivery_status:
            status,

          order_status:
            newOrderStatus

        }

      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(rollbackError);
        }

      }

      console.error(
        "Update delivery status error:",
        error
      );

     res.status(500).json({
  success: false,
  message:
    "Failed to update delivery status",
  error: error.message
});
    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);


/* =================================
   REJECT ASSIGNED ORDER
================================= */

router.put(
  "/reject-order",
  async (req, res) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        order_id,
        delivery_partner_id
      } = req.body;


      if (
        !order_id ||
        !delivery_partner_id
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Order ID and Delivery Partner ID are required"
        });

      }


      await connection.beginTransaction();


      const [orders] =
        await connection.query(
          `
          SELECT *
          FROM orders
          WHERE
            id = ?
            AND delivery_partner_id = ?
          FOR UPDATE
          `,
          [
            order_id,
            delivery_partner_id
          ]
        );


      if (
        orders.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Order not found or not assigned to this partner"
        });

      }


      if (
        orders[0].delivery_status !==
        "Assigned"
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Only newly assigned orders can be rejected"
        });

      }


      await connection.query(
        `
        UPDATE orders
        SET
          delivery_partner_id = NULL,
          delivery_status = 'Not Assigned',
          assigned_at = NULL
        WHERE id = ?
        `,
        [order_id]
      );


      await connection.query(
        `
        UPDATE delivery_partners
        SET
          availability_status = 'Online'
        WHERE id = ?
        `,
        [delivery_partner_id]
      );


      await connection.query(
        `
        UPDATE delivery_notifications
        SET
          is_read = TRUE
        WHERE
          delivery_partner_id = ?
          AND order_id = ?
        `,
        [
          delivery_partner_id,
          order_id
        ]
      );


      

      await connection.commit();


      res.json({
        success: true,
        message:
          "Order rejected and returned for reassignment"
      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(rollbackError);
        }

      }

      console.error(
        "Reject order error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to reject order"
      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);


/* =================================
   GET NOTIFICATIONS
================================= */

router.get(
  "/notifications/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [notifications] =
        await db.query(
          `
          SELECT
            id,
            delivery_partner_id,
            order_id,
            title,
            message,
            is_read,
            created_at
          FROM delivery_notifications
          WHERE delivery_partner_id = ?
          ORDER BY created_at DESC
          `,
          [delivery_partner_id]
        );


      const unreadCount =
        notifications.filter(
          notification =>
            !notification.is_read
        ).length;


      res.json({

        success: true,

        notification_count:
          notifications.length,

        unread_count:
          unreadCount,

        notifications

      });

    } catch (error) {

      console.error(
        "Get notifications error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch notifications"
      });

    }

  }
);


/* =================================
   MARK NOTIFICATION AS READ
================================= */

router.put(
  "/notifications/read/:notification_id",
  async (req, res) => {

    try {

      const {
        notification_id
      } = req.params;


      const [result] =
        await db.query(
          `
          UPDATE delivery_notifications
          SET is_read = TRUE
          WHERE id = ?
          `,
          [notification_id]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Notification not found"
        });

      }


      res.json({
        success: true,
        message:
          "Notification marked as read"
      });

    } catch (error) {

      console.error(
        "Mark notification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark notification as read"
      });

    }

  }
);


/* =================================
   DELETE NOTIFICATION
================================= */

router.delete(
  "/notifications/:notification_id",
  async (req, res) => {

    try {

      const {
        notification_id
      } = req.params;


      const [result] =
        await db.query(
          `
          DELETE FROM delivery_notifications
          WHERE id = ?
          `,
          [notification_id]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Notification not found"
        });

      }


      res.json({
        success: true,
        message:
          "Notification deleted successfully"
      });

    } catch (error) {

      console.error(
        "Delete notification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete notification"
      });

    }

  }
);


/* =================================
   COLLECT COD PAYMENT
================================= */

router.put(
  "/collect-cod",
  async (req, res) => {

    try {

      const {
        order_id,
        delivery_partner_id
      } = req.body;


      if (
        !order_id ||
        !delivery_partner_id
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Order ID and Delivery Partner ID are required"
        });

      }


      const [orders] =
        await db.query(
          `
          SELECT *
          FROM orders
          WHERE
            id = ?
            AND delivery_partner_id = ?
          `,
          [
 order_id,
            delivery_partner_id
          ]
        );


      if (
        orders.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Order not found"
        });

      }


      const order =
        orders[0];


      if (
        order.payment_method !==
        "Cash on Delivery"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "This is not a Cash on Delivery order"
        });

      }


      if (
        order.delivery_status !==
        "Delivered"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "COD can only be collected after delivery"
        });

      }


      if (
        order.payment_status ===
        "Paid"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "COD payment has already been collected"
        });

      }


      await db.query(
        `
        UPDATE orders
        SET payment_status = 'Paid'
        WHERE id = ?
        `,
        [order_id]
      );


      res.json({
        success: true,
        message:
          "COD payment collected successfully"
      });

    } catch (error) {

      console.error(
        "Collect COD error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to collect COD payment"
      });

    }

  }
);


/* =================================
   DELIVERY DASHBOARD
================================= */

router.get(
  "/dashboard/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [partners] =
        await db.query(
          `
          SELECT
            id,
            name,
            email,
            phone,
            availability_status
          FROM delivery_partners
          WHERE id = ?
          `,
          [delivery_partner_id]
        );


      if (
        partners.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      const [stats] =
        await db.query(
          `
          SELECT

            COUNT(*) AS total_orders,

            SUM(
              CASE
                WHEN delivery_status = 'Assigned'
                THEN 1
                ELSE 0
              END
            ) AS assigned,

            SUM(
              CASE
                WHEN delivery_status = 'Accepted'
                THEN 1
                ELSE 0
              END
            ) AS accepted,

            SUM(
              CASE
                WHEN delivery_status = 'Picked Up'
                THEN 1
                ELSE 0
              END
            ) AS picked_up,

            SUM(
              CASE
                WHEN delivery_status = 'Out for Delivery'
                THEN 1
                ELSE 0
              END
            ) AS out_for_delivery,

            SUM(
              CASE
                WHEN delivery_status = 'Delivered'
                THEN 1
                ELSE 0
              END
            ) AS delivered

          FROM orders
          WHERE delivery_partner_id = ?
          `,
          [delivery_partner_id]
        );


      res.json({

        success: true,

        delivery_partner:
          partners[0],

        dashboard: {

          total_orders:
            Number(
              stats[0].total_orders || 0
            ),

          assigned:
            Number(
              stats[0].assigned || 0
            ),

          accepted:
            Number(
              stats[0].accepted || 0
            ),

          picked_up:
            Number(
              stats[0].picked_up || 0
            ),

          out_for_delivery:
            Number(
              stats[0].out_for_delivery || 0
            ),

          delivered:
            Number(
              stats[0].delivered || 0
            )

        }

      });

    } catch (error) {

      console.error(
        "Dashboard error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch dashboard"
      });

    }

  }
);


/* =================================
   DELIVERY PARTNER EARNINGS
================================= */

router.get(
  "/earnings/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [summary] =
        await db.query(
          `
          SELECT

            COUNT(*) AS total_delivered_orders,

            COALESCE(
              SUM(total_amount),
              0
            ) AS total_delivery_amount,

            COALESCE(
              SUM(
                CASE
                  WHEN payment_method =
                    'Cash on Delivery'
                  AND payment_status =
                    'Paid'
                  THEN total_amount
                  ELSE 0
                END
              ),
              0
            ) AS cod_collected,

            COALESCE(
              SUM(
                CASE
                  WHEN payment_method !=
                    'Cash on Delivery'
                  AND payment_status =
                    'Paid'
                  THEN total_amount
                  ELSE 0
                END
              ),
              0
            ) AS online_paid_amount

          FROM orders
          WHERE
            delivery_partner_id = ?
            AND delivery_status =
              'Delivered'
          `,
          [delivery_partner_id]
        );


      res.json({
        success: true,
        earnings:
          summary[0]
      });

    } catch (error) {

      console.error(
        "Earnings error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch earnings"
      });

    }

  }
);


/* =================================
   GET DELIVERY PARTNER PROFILE
================================= */

router.get(
  "/profile/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [partners] =
        await db.query(
          `
          SELECT
            id,
            name,
            email,
            phone,
            address,
            city,
            state,
            vehicle_type,
            vehicle_number,
            license_number,
            status,
            availability_status,
            latitude,
            longitude,
            created_at
          FROM delivery_partners
          WHERE id = ?
          `,
          [delivery_partner_id]
        );


      if (
        partners.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      res.json({
        success: true,
        delivery_partner:
          partners[0]
      });

    } catch (error) {

      console.error(
        "Get profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch profile"
      });

    }

  }
);


/* =================================
   UPDATE DELIVERY PARTNER PROFILE
================================= */

router.put(
  "/profile/:delivery_partner_id",
  async (req, res) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        delivery_partner_id
      } = req.params;


      const {
        phone,
        address,
        city,
       state,
         vehicle_type,
        vehicle_number,
        license_number
      } = req.body;


      await connection.beginTransaction();


      const [result] =
        await connection.query(
          `
          UPDATE delivery_partners
          SET
            phone = ?,
            address = ?,
            city = ?,
            state = ?,
            vehicle_type = ?,
            vehicle_number = ?,
            license_number = ?
          WHERE id = ?
          `,
          [
            phone?.trim() || null,
            address?.trim() || null,
            city?.trim() || null,
             state?.trim() || null,
            vehicle_type?.trim() || null,
            vehicle_number?.trim() || null,
            license_number?.trim() || null,
            delivery_partner_id
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      const [partners] =
        await connection.query(
          `
          SELECT
            availability_status
          FROM delivery_partners
          WHERE id = ?
          `,
          [delivery_partner_id]
        );


      if (
        partners.length > 0 &&
        partners[0]
          .availability_status ===
          "Online"
      ) {

        await assignWaitingOrder(
          connection,
          delivery_partner_id
        );

      }


      await connection.commit();


      res.json({
        success: true,
        message:
          "Profile updated successfully"
      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(rollbackError);
        }

      }

      console.error(
        "Update profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update profile"
      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);


/* =================================
   AUTO ASSIGN ORDER TO NEAREST
   AVAILABLE DELIVERY PARTNER
================================= */

router.post(
  "/auto-assign/:orderId",
  async (req, res) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const orderId =
        req.params.orderId;


      await connection.beginTransaction();


      const [orders] =
        await connection.query(
          `
          SELECT
            id,
            address_id,
            shipping_address,
            delivery_partner_id,
            delivery_status,
            order_status
          FROM orders
          WHERE id = ?
          FOR UPDATE
          `,
          [orderId]
        );


      if (
        orders.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Order not found"
        });

      }


      const order =
        orders[0];


      if (
        order.order_status ===
        "Cancelled"
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Cancelled order cannot be assigned"
        });

      }


      if (
        order.delivery_partner_id !==
        null
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Order already assigned to a delivery partner"
        });

      }


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

        } catch (error) {

          shippingAddress =
            null;

        }

      }


      /*
        Important:
        Do not use Number(null),
        because Number(null) = 0
      */
 if (
        shippingAddress?.latitude ===
          undefined ||
        shippingAddress?.latitude ===
          null ||
        shippingAddress?.longitude ===
          undefined ||
        shippingAddress?.longitude ===
          null
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Customer location coordinates are not available"
        });

      }


      const customerLatitude =
        Number(
          shippingAddress.latitude
        );

      const customerLongitude =
        Number(
          shippingAddress.longitude
        );

    let customerCity =
  shippingAddress?.city
    ?.trim()
    ?.toLowerCase();


// If city is not available in shipping_address,
// get it from addresses table
if (!customerCity && order.address_id) {

  const [addresses] =
    await connection.query(
      `
      SELECT city
      FROM addresses
      WHERE id = ?
      `,
      [order.address_id]
    );

  if (
    addresses.length > 0 &&
    addresses[0].city
  ) {

    customerCity =
      addresses[0].city
        .trim()
        .toLowerCase();

  }

}


// City is required for city-based assignment
if (!customerCity) {

  await connection.rollback();

  return res.status(400).json({
    success: false,
    message:
      "Customer city is not available"
  });

}


      if (
        Number.isNaN(
          customerLatitude
        ) ||
        Number.isNaN(
          customerLongitude
        )
      ) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Invalid customer location coordinates"
        });

      }


      const [partners] =
        await connection.query(
          `
          SELECT

            id,

            name,

            latitude,

            longitude,

            (
              6371 *
              ACOS(
                LEAST(
                  1.0,
                  GREATEST(
                    -1.0,

                    COS(
                      RADIANS(?)
                    ) *

                    COS(
                      RADIANS(latitude)
                    ) *

                    COS(
                      RADIANS(longitude) -
                      RADIANS(?)
                    )

                    +

                    SIN(
                      RADIANS(?)
                    ) *

                    SIN(
                      RADIANS(latitude)
                    )
                  )
                )
              )
            ) AS distance

          FROM delivery_partners

          WHERE
  status = 'active'

  AND availability_status =
    'Online'

  AND latitude IS NOT NULL

  AND longitude IS NOT NULL

  AND LOWER(TRIM(city)) = ?

          ORDER BY distance ASC

          LIMIT 1

          FOR UPDATE
          `,
         [
  customerLatitude,
  customerLongitude,
  customerLatitude,
  customerCity
]
        );


      if (
        partners.length === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "No online delivery partner available"
        });

      }


      const deliveryPartner =
        partners[0];


      await connection.query(
        `
        UPDATE orders
        SET
          delivery_partner_id = ?,
          delivery_status = 'Assigned',
          assigned_at = NOW()
        WHERE
          id = ?
          AND delivery_partner_id IS NULL
        `,
        [
          deliveryPartner.id,
          orderId
        ]
      );


      await connection.query(
        `
        UPDATE delivery_partners
        SET
          availability_status = 'Busy'
        WHERE id = ?
        `,
        [
          deliveryPartner.id
        ]
      );


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
        VALUES
        (?, ?, ?, ?, FALSE)
        `,
        [
          deliveryPartner.id,
          orderId,
          "New Order Assigned",
          `A new order #${orderId} has been assigned to you`
        ]
      );


      await connection.commit();


      res.json({

        success: true,

        message:
          "Order automatically assigned successfully",

        delivery_partner: {

          id:
            deliveryPartner.id,

          name:
            deliveryPartner.name,

          distance:
            Number(
              deliveryPartner.distance
            ).toFixed(2)

        }

      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {

          console.error(
            "Rollback error:",
            rollbackError
          );

        }

      }

      console.error(
        "Auto assign error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to automatically assign order",
        error:
          error.message
      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);


/* =================================
   UPDATE AVAILABILITY
================================= */

router.put(
  "/availability/:delivery_partner_id",
  async (req, res) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        delivery_partner_id
      } = req.params;

      const {
        availability_status
      } = req.body;


      const allowedStatuses = [
        "Online",
        "Offline",
        "Busy"
      ];


      if (
        !availability_status ||
        !allowedStatuses.includes(
          availability_status.trim()
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid availability status"
        });

      }


      const newStatus =
        availability_status.trim();


      await connection.beginTransaction();


      const [result] =
        await connection.query(
          `
          UPDATE delivery_partners
          SET availability_status = ?
          WHERE id = ?
          `,
          [
            newStatus,
            delivery_partner_id
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      let assignedOrder = null;


      

      await connection.commit();


      res.json({

        success: true,

        message: "Availability updated successfully",

availability_status: newStatus,

assigned_order: null

      });

    } catch (error) {

      if (connection) {

        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(rollbackError);
        }

      }

      console.error(
        "Update availability error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update availability",
        error:
          error.message
      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  }
);


/* =================================
   UPDATE DELIVERY PARTNER LOCATION
================================= */

router.put(
  "/update-location",
  async (req, res) => {

    try {

      const {
        delivery_partner_id,
        latitude,
        longitude
      } = req.body;


      if (
        !delivery_partner_id ||
        latitude === undefined ||
        longitude === undefined
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Delivery Partner ID, latitude and longitude are required"
        });

      }


      const lat =
        Number(latitude);

      const lng =
        Number(longitude);


      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid latitude or longitude"
        });

      }


      const [result] =
        await db.query(
          `
          UPDATE delivery_partners
          SET
            latitude = ?,
            longitude = ?,
            location_updated_at = NOW()
          WHERE id = ?
          `,
          [
            lat,
            lng,
            delivery_partner_id
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      res.json({

        success: true,

        message:
          "Location updated successfully",

        location: {

          latitude:
            lat,

          longitude:
            lng

        }

      });

    } catch (error) {

      console.error(
        "Update location error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update location"
      });

    }

  }
);


/* =================================
   GET DELIVERY PARTNER LOCATION
================================= */

router.get(
  "/location/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [partners] =
        await db.query(
          `
          SELECT
            id,
            name,
            latitude,
            longitude,
            location_updated_at
          FROM delivery_partners
          WHERE id = ?
          `,
          [delivery_partner_id]
        );


      if (
        partners.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      res.json({
        success: true,
        delivery_partner:
          partners[0]
      });

    } catch (error) {

      console.error(
        "Get location error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch location"
      });

    }

  }
);


/* =================================
   DELIVERY HISTORY
================================= */

router.get(
  "/delivery-history/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [orders] =
        await db.query(
          `
          SELECT *
          FROM orders
          WHERE
            delivery_partner_id = ?
            AND delivery_status =
              'Delivered'
          ORDER BY assigned_at DESC
          `,
          [delivery_partner_id]
        );


      res.json({
        success: true,
        count:
          orders.length,
        orders
      });

    } catch (error) {

      console.error(
        "Delivery history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch delivery history"
      });

    }

  }
);


/* =================================
   TODAY SUMMARY
================================= */

router.get(
  "/today-summary/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [stats] =
        await db.query(
          `
          SELECT

            COUNT(*) AS orders_assigned_today,

            SUM(
              CASE
                WHEN delivery_status =
                  'Delivered'
                THEN 1
                ELSE 0
              END
            ) AS delivered_today,

            SUM(
              CASE
                WHEN delivery_status IN
                (
                  'Assigned',
                  'Accepted',
                  'Picked Up',
                  'Out for Delivery'
                )
                THEN 1
                ELSE 0
              END
            ) AS active_orders_today

          FROM orders
          WHERE
            delivery_partner_id = ?
            AND DATE(assigned_at) =
              CURDATE()
          `,
          [delivery_partner_id]
        );


      res.json({

        success: true,

        today_summary: {

          orders_assigned_today:
            Number(
              stats[0]
                .orders_assigned_today ||
                0
            ),

          delivered_today:
            Number(
              stats[0]
                .delivered_today ||
                0
            ),

          active_orders_today:
            Number(
              stats[0]
                .active_orders_today ||
                0
            )

        }

      });

    } catch (error) {

      console.error(
        "Today summary error:",
 error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch today's summary"
      });

    }

  }
);


/* =================================
   CURRENT DELIVERY STATUS
================================= */

router.get(
  "/current-status/:delivery_partner_id",
  async (req, res) => {

    try {

      const {
        delivery_partner_id
      } = req.params;


      const [partners] =
        await db.query(
          `
          SELECT
            id,
            name,
            availability_status,
            latitude,
            longitude,
            location_updated_at
          FROM delivery_partners
          WHERE id = ?
          `,
          [delivery_partner_id]
        );


      if (
        partners.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found"
        });

      }


      const [activeOrders] =
        await db.query(
          `
          SELECT
            id,
            total_amount,
            payment_method,
            payment_status,
            order_status,
            delivery_status,
            assigned_at
          FROM orders
          WHERE
            delivery_partner_id = ?
            AND delivery_status IN
            (
              'Assigned',
              'Accepted',
              'Picked Up',
              'Out for Delivery'
            )
          ORDER BY assigned_at DESC
          `,
          [delivery_partner_id]
        );


      res.json({

        success: true,

        delivery_partner:
          partners[0],

        active_order_count:
          activeOrders.length,

        active_orders:
          activeOrders

      });

    } catch (error) {

      console.error(
        "Current status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch current status"
      });

    }

  }
);

/* =================================
   GET DELIVERY HISTORY
================================= */
router.get('/history/:id', async (req, res) => {
  try {
    const deliveryPartnerId = req.params.id;

    console.log(
      "Getting delivery history for partner:",
      deliveryPartnerId
    );

    const [orders] = await db.query(`
      SELECT *
      FROM orders
      WHERE delivery_partner_id = ?
      AND delivery_status = 'Delivered'
      ORDER BY assigned_at DESC
    `, [deliveryPartnerId]);

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error("Get delivery history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery history"
    });
  }
});
router.get(
  "/history/:deliveryPersonId",
  async (req, res) => {
    try {
      const { deliveryPersonId } = req.params;

      console.log(
        "Loading delivery history for:",
        deliveryPersonId
      );

      const [orders] = await db.query(
        `
        SELECT
          o.id,
          o.user_id,
          o.address_id,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.order_status,
          o.delivery_status,
          o.return_status,
          o.return_reason,
          o.return_requested_at,
          o.shipping_address,
          o.created_at,
          o.assigned_at,
          o.delivered_at,

          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone,

          a.full_name AS address_name,
          a.phone AS address_phone,
          a.address_line,
          a.city,
          a.state,
          a.pincode,

          CONCAT_WS(
            ', ',
            a.address_line,
            a.city,
            a.state,
            a.pincode
          ) AS delivery_address

        FROM orders o

        LEFT JOIN users u
          ON o.user_id = u.id

        LEFT JOIN addresses a
          ON o.address_id = a.id

        WHERE o.delivery_partner_id = ?

        AND (
          LOWER(COALESCE(o.delivery_status, '')) = 'delivered'
          OR LOWER(COALESCE(o.return_status, '')) = 'return completed'
        )

        ORDER BY
          COALESCE(
            o.delivered_at,
            o.created_at
          ) DESC
        `,
        [deliveryPersonId]
      );

      console.log(
        "HISTORY RESULT:",
        orders
      );

      res.status(200).json({
        success: true,
        count: orders.length,
        orders
      });

    } catch (error) {
      console.error(
        "DELIVERY HISTORY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch delivery history",
        error: error.message
      });
    }
  }
);

/* =================================
   UPDATE RETURN STATUS
================================= */

router.put(
  "/:orderId/return/status",
  async (req, res) => {

    try {

      const orderId =
        req.params.orderId;

      const {
        return_status
      } = req.body;


      const allowedStatuses = [
        "Pickup Scheduled",
        "Picked Up",
        "Return Completed"
      ];


      if (
        !return_status ||
        !allowedStatuses.includes(
          return_status
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid return status"
        });

      }


      /* =========================
         CHECK ORDER
      ========================= */

      const [orders] =
        await db.query(
          `
          SELECT
            id,
            delivery_partner_id,
            return_status
          FROM orders
          WHERE
            id = ?
            AND delivery_partner_id IS NOT NULL
            AND return_status IS NOT NULL
          `,
          [orderId]
        );


      if (orders.length === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Return order not found"
        });

      }


      const order =
        orders[0];


      /* =========================
         UPDATE RETURN STATUS
      ========================= */

      await db.query(
        `
        UPDATE orders
        SET return_status = ?
        WHERE id = ?
        `,
        [
          return_status,
          orderId
        ]
      );


      /* =========================
         ADD ₹50 RETURN EARNING
      ========================= */

      if (
        return_status ===
        "Return Completed"
      ) {

        await db.query(
          `
          INSERT IGNORE INTO
          delivery_partner_earnings
          (
            delivery_partner_id,
            order_id,
            amount,
            earning_type
          )
          VALUES
          (?, ?, 50.00, 'Return')
          `,
          [
            order.delivery_partner_id,
            orderId
          ]
        );

      }


      res.json({

        success: true,

        message:
          "Return status updated successfully",

        return_status:
          return_status

      });

    } catch (error) {

      console.error(
        "Update return status error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to update return status"

      });

    }

  }
);


/* =====================================================
   SHIPMENT PICKUP APIs
   These routes are separate from legacy order delivery.
===================================================== */

// GET /api/delivery/shipments/available-pickups
router.get(
  "/shipments/available-pickups",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    try {
      const partnerId = Number(req.user.id);

      const [partners] = await db.query(
        `SELECT id, city, state, status, approval_status,
                availability_status
         FROM delivery_partners
         WHERE id = ?
         LIMIT 1`,
        [partnerId]
      );

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found"
        });
      }

      const partner = partners[0];

      if (
        partner.status !== "active" ||
        partner.approval_status !== "Approved"
      ) {
        return res.status(403).json({
          success: false,
          message: "Your delivery partner account is not active and approved"
        });
      }

      if (partner.availability_status !== "Online") {
        return res.status(409).json({
          success: false,
          message: "Set your availability to Online to view pickup assignments"
        });
      }

      if (!partner.city || !partner.state) {
        return res.status(400).json({
          success: false,
          message: "Your delivery partner city and state must be configured"
        });
      }

      const [shipments] = await db.query(
        `SELECT
           ms.id AS shipment_id,
           ms.order_id,
           ms.merchant_id,
           ms.tracking_number,
           ms.pickup_address,
           ms.pickup_city,
           ms.pickup_state,
           ms.pickup_pincode,
           ms.shipment_status,
           ms.ready_at,
           h.hub_name AS origin_hub_name
         FROM merchant_shipments ms
         LEFT JOIN dispatch_hubs h ON h.id = ms.origin_hub_id
         WHERE ms.shipment_status = 'Ready for Pickup'
           AND ms.pickup_partner_id IS NULL
           AND LOWER(TRIM(ms.pickup_city)) = LOWER(TRIM(?))
           AND LOWER(TRIM(ms.pickup_state)) = LOWER(TRIM(?))
         ORDER BY ms.ready_at ASC, ms.id ASC`,
        [partner.city, partner.state]
      );

      return res.json({
        success: true,
        count: shipments.length,
        shipments
      });
    } catch (error) {
      console.error("Available shipment pickups error:", error);
 return res.status(500).json({
        success: false,
        message: "Failed to retrieve available pickup shipments"
      });
    }
  }
);


// POST /api/delivery/shipments/:shipmentId/accept-pickup
router.post(
  "/shipments/:shipmentId/accept-pickup",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
      const shipmentId = Number(req.params.shipmentId);
      const partnerId = Number(req.user.id);

      if (
        !Number.isSafeInteger(shipmentId) || shipmentId <= 0 ||
        !Number.isSafeInteger(partnerId) || partnerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment or delivery partner ID"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [partners] = await connection.query(
        `SELECT id, city, state, status, approval_status,
                availability_status
         FROM delivery_partners
         WHERE id = ?
         FOR UPDATE`,
        [partnerId]
      );

      if (partners.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found"
        });
      }

      const partner = partners[0];

      if (
        partner.status !== "active" ||
        partner.approval_status !== "Approved"
      ) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({
          success: false,
          message: "Your delivery partner account is not active and approved"
        });
      }

      if (partner.availability_status !== "Online") {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: "You must be Online and available to accept a pickup"
        });
      }

      const [shipments] = await connection.query(
        `SELECT id, order_id, merchant_id, tracking_number,
                pickup_city, pickup_state, shipment_status,
                pickup_partner_id
         FROM merchant_shipments
         WHERE id = ?
         FOR UPDATE`,
        [shipmentId]
      );

      if (shipments.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const shipment = shipments[0];

      if (
        shipment.shipment_status !== "Ready for Pickup" ||
        shipment.pickup_partner_id !== null
      ) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: "This shipment is no longer available for pickup"
        });
      }

      const sameCity =
        String(partner.city || "").trim().toLowerCase() ===
        String(shipment.pickup_city || "").trim().toLowerCase();

      const sameState =
        String(partner.state || "").trim().toLowerCase() ===
        String(shipment.pickup_state || "").trim().toLowerCase();

      if (!sameCity || !sameState) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({
          success: false,
          message: "This pickup is outside your registered city and state"
        });
      }

      await connection.query(
        `UPDATE merchant_shipments
         SET pickup_partner_id = ?,
             delivery_partner_id = ?,
             shipment_status = 'Pickup Assigned',
             assigned_at = NOW()
         WHERE id = ?
           AND shipment_status = 'Ready for Pickup'
           AND pickup_partner_id IS NULL`,
        [partnerId, partnerId, shipmentId]
      );

      const [updated] = await connection.query(
        `SELECT pickup_partner_id, shipment_status
         FROM merchant_shipments
         WHERE id = ?`,
        [shipmentId]
      );

      if (
        updated.length === 0 ||
        Number(updated[0].pickup_partner_id) !== partnerId ||
        updated[0].shipment_status !== "Pickup Assigned"
      ) {
        throw new Error("Shipment assignment could not be verified");
      }

      await connection.query(
        `UPDATE delivery_partners
         SET availability_status = 'Busy'
         WHERE id = ?`,
        [partnerId]
      );

      await connection.query(
        `INSERT INTO shipment_tracking_events
         (shipment_id, event_status, location_type, hub_id,
          city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, 'Pickup Assigned', 'merchant', NULL,
                 ?, ?, ?, 'delivery', ?)`,
        [
          shipmentId,
          shipment.pickup_city,
          shipment.pickup_state,
          "Pickup accepted by delivery partner.",
          partnerId
        ]
      );

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: "Pickup assigned successfully",
        shipment: {
          id: shipmentId,
          order_id: shipment.order_id,
          tracking_number: shipment.tracking_number,
          shipment_status: "Pickup Assigned",
          pickup_partner_id: partnerId
        }
      });
    } catch (error) {
      if (connection && transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Pickup assignment rollback error:", rollbackError);
        }
      }

      console.error("Accept shipment pickup error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to accept shipment pickup"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


// PUT /api/delivery/shipments/:shipmentId/confirm-pickup
router.put(
  "/shipments/:shipmentId/confirm-pickup",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
      const shipmentId = Number(req.params.shipmentId);
      const partnerId = Number(req.user.id);

      if (
        !Number.isSafeInteger(shipmentId) || shipmentId <= 0 ||
        !Number.isSafeInteger(partnerId) || partnerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment or delivery partner ID"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [shipments] = await connection.query(
        `SELECT id, order_id, tracking_number, pickup_city,
                pickup_state, shipment_status, pickup_partner_id
         FROM merchant_shipments
         WHERE id = ?
         FOR UPDATE`,
        [shipmentId]
      );

      if (shipments.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const shipment = shipments[0];

      if (Number(shipment.pickup_partner_id) !== partnerId) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({
          success: false,
          message: "Only the assigned pickup partner can confirm collection"
        });
      }

      if (shipment.shipment_status !== "Pickup Assigned") {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: "Shipment must be Pickup Assigned before collection can be confirmed"
        });
      }

      await connection.query(
        `UPDATE merchant_shipments
         SET shipment_status = 'Picked Up',
             picked_up_at = NOW()
         WHERE id = ? AND pickup_partner_id = ?
           AND shipment_status = 'Pickup Assigned'`,
        [shipmentId, partnerId]
      );

      await connection.query(
        `INSERT INTO shipment_tracking_events
         (shipment_id, event_status, location_type, hub_id,
          city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, 'Picked Up', 'merchant', NULL,
                 ?, ?, ?, 'delivery', ?)`,
        [
          shipmentId,
          shipment.pickup_city,
          shipment.pickup_state,
          "Delivery partner confirmed collection from merchant.",
          partnerId
        ]
      );

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: "Pickup confirmed successfully",
        shipment: {
          id: shipmentId,
          order_id: shipment.order_id,
          tracking_number: shipment.tracking_number,
          shipment_status: "Picked Up"
        }
      });
    } catch (error) {
      if (connection && transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Confirm pickup rollback error:", rollbackError);
        }
      }

      console.error("Confirm shipment pickup error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to confirm shipment pickup"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);



// ============================================================
// LAST-MILE DELIVERY APIs
// ============================================================

// GET /api/delivery/shipments/available-last-mile
router.get(
  "/shipments/available-last-mile",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    try {
      const partnerId = Number(req.user.id);

      const [partners] = await db.query(
        `SELECT id, city, state, status, availability_status,
                approval_status
         FROM delivery_partners
         WHERE id = ?`,
        [partnerId]
      );

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found"
        });
      }

      const partner = partners[0];

      if (
        String(partner.status).toLowerCase() !== "active" ||
        String(partner.approval_status).toLowerCase() !== "approved"
      ) {
        return res.status(403).json({
          success: false,
          message: "Your delivery partner account is not active and approved"
        });
      }

      if (
        String(partner.availability_status).toLowerCase() !== "online"
      ) {
        return res.status(409).json({
          success: false,
          message: "You must be Online to view available shipments"
        });
      }

      if (!partner.city || !partner.state) {
        return res.status(400).json({
          success: false,
          message: "Set your delivery partner city and state first"
        });
      }

      const [shipments] = await db.query(
        `SELECT
           s.id AS shipment_id,
           s.order_id,
           s.merchant_id,
           s.tracking_number,
           s.shipment_status,
           s.ready_at,
           h.id AS destination_hub_id,
           h.hub_name AS destination_hub_name,
           h.city AS destination_city,
           h.state AS destination_state
         FROM merchant_shipments s
         JOIN dispatch_hubs h
           ON h.id = s.destination_hub_id
         WHERE s.shipment_status = 'Arrived at Destination Hub'
           AND s.last_mile_partner_id IS NULL
           AND h.status = 'Active'
           AND LOWER(TRIM(h.city)) = LOWER(TRIM(?))
           AND LOWER(TRIM(h.state)) = LOWER(TRIM(?))
         ORDER BY s.id ASC`,
        [partner.city, partner.state]
      );

      return res.json({
        success: true,
        count: shipments.length,
        shipments
      });
    } catch (error) {
      console.error("Available last-mile shipments error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load available last-mile shipments"
      });
    }
  }
);


// POST /api/delivery/shipments/:shipmentId/accept-last-mile
router.post(
  "/shipments/:shipmentId/accept-last-mile",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
      const shipmentId = Number(req.params.shipmentId);
      const partnerId = Number(req.user.id);

      if (
        !Number.isSafeInteger(shipmentId) || shipmentId <= 0 ||
        !Number.isSafeInteger(partnerId) || partnerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment or delivery partner ID"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [partners] = await connection.query(
        `SELECT id, city, state, status, availability_status,
                approval_status
         FROM delivery_partners
         WHERE id = ?
         FOR UPDATE`,
        [partnerId]
      );

      if (partners.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found"
        });
      }

      const partner = partners[0];

      if (
        String(partner.status).toLowerCase() !== "active" ||
        String(partner.approval_status).toLowerCase() !== "approved"
      ) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({
          success: false,
          message: "Your delivery partner account is not active and approved"
        });
      }

      if (
        String(partner.availability_status).toLowerCase() !== "online"
      ) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: "You must be Online to accept a shipment"
        });
      }

      const [shipments] = await connection.query(
        `SELECT s.id, s.order_id, s.merchant_id, s.tracking_number,
                s.shipment_status, s.destination_hub_id,
                h.hub_name, h.city AS destination_city,
                h.state AS destination_state, h.status AS hub_status
         FROM merchant_shipments s
         JOIN dispatch_hubs h ON h.id = s.destination_hub_id
         WHERE s.id = ?
         FOR UPDATE`,
        [shipmentId]
      );

      if (shipments.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const shipment = shipments[0];

      if (
        shipment.shipment_status !== "Arrived at Destination Hub" ||
        shipment.last_mile_partner_id
      ) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: "Shipment is no longer available for last-mile assignment",
          currentStatus: shipment.shipment_status
        });
      }

      if (shipment.hub_status !== "Active") {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: "Destination hub is inactive"
        });
      }

      const sameCity =
        String(partner.city || "").trim().toLowerCase() ===
        String(shipment.destination_city || "").trim().toLowerCase();

      const sameState =
        String(partner.state || "").trim().toLowerCase() ===
        String(shipment.destination_state || "").trim().toLowerCase();

      if (!sameCity || !sameState) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({
          success: false,
          message: "This shipment belongs to a different delivery city or state"
        });
      }

      await connection.query(
        `UPDATE merchant_shipments
         SET last_mile_partner_id = ?,
             delivery_partner_id = ?,
             shipment_status = 'Assigned for Last Mile',
             assigned_at = NOW()
         WHERE id = ?
           AND last_mile_partner_id IS NULL
           AND shipment_status = 'Arrived at Destination Hub'`,
        [partnerId, partnerId, shipmentId]
      );

      const [updated] = await connection.query(
        `SELECT last_mile_partner_id, shipment_status
         FROM merchant_shipments
         WHERE id = ?`,
        [shipmentId]
      );

      if (
        updated.length === 0 ||
        Number(updated[0].last_mile_partner_id) !== partnerId ||
        updated[0].shipment_status !== "Assigned for Last Mile"
      ) {
        throw new Error("Shipment assignment verification failed");
      }

      await connection.query(
        `UPDATE delivery_partners
         SET availability_status = 'Busy'
         WHERE id = ?`,
        [partnerId]
      );

      await connection.query(
        `INSERT INTO shipment_tracking_events
          (shipment_id, event_status, location_type, hub_id,
           city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipmentId,
          "Assigned for Last Mile",
          "hub",
          shipment.destination_hub_id,
          shipment.destination_city,
          shipment.destination_state,
          `Last-mile delivery accepted by partner ${partnerId}`,
          "delivery",
          partnerId
        ]
      );

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: "Last-mile shipment accepted successfully",
        shipment: {
          id: shipment.id,
          order_id: shipment.order_id,
          tracking_number: shipment.tracking_number,
          last_mile_partner_id: partnerId,
          shipment_status: "Assigned for Last Mile",
          destination_hub: shipment.hub_name
        }
      });
    } catch (error) {
      if (connection && transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Last-mile assignment rollback error:", rollbackError.message);
        }
      }

      console.error("Accept last-mile shipment error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to accept last-mile shipment"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


// PUT /api/delivery/shipments/:shipmentId/last-mile-status
// Allowed transitions: Assigned for Last Mile -> Out for Delivery -> Delivered
router.put(
  "/shipments/:shipmentId/last-mile-status",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
      const shipmentId = Number(req.params.shipmentId);
      const partnerId = Number(req.user.id);
      const requestedStatus = req.body.status;

      if (
        !Number.isSafeInteger(shipmentId) || shipmentId <= 0 ||
        !Number.isSafeInteger(partnerId) || partnerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment or delivery partner ID"
        });
      }

      if (!["Out for Delivery", "Delivered"].includes(requestedStatus)) {
        return res.status(400).json({
          success: false,
          message: "status must be Out for Delivery or Delivered"
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [shipments] = await connection.query(
        `SELECT s.id, s.order_id, s.tracking_number,
                s.shipment_status, s.last_mile_partner_id,
                s.destination_hub_id,
                h.city AS destination_city, h.state AS destination_state
         FROM merchant_shipments s
         JOIN dispatch_hubs h ON h.id = s.destination_hub_id
         WHERE s.id = ?
         FOR UPDATE`,
        [shipmentId]
      );

      if (shipments.length === 0) {
await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const shipment = shipments[0];

      if (Number(shipment.last_mile_partner_id) !== partnerId) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({
          success: false,
          message: "Only the assigned last-mile partner can update this shipment"
        });
      }

      const expectedCurrentStatus =
        requestedStatus === "Out for Delivery"
          ? "Assigned for Last Mile"
          : "Out for Delivery";

      if (shipment.shipment_status !== expectedCurrentStatus) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          success: false,
          message: `Shipment must be ${expectedCurrentStatus} before changing to ${requestedStatus}`,
          currentStatus: shipment.shipment_status
        });
      }

      if (requestedStatus === "Delivered") {
        await connection.query(
          `UPDATE merchant_shipments
           SET shipment_status = 'Delivered',
               delivered_at = NOW()
           WHERE id = ? AND last_mile_partner_id = ?
             AND shipment_status = 'Out for Delivery'`,
          [shipmentId, partnerId]
        );
      } else {
        await connection.query(
          `UPDATE merchant_shipments
           SET shipment_status = 'Out for Delivery'
           WHERE id = ? AND last_mile_partner_id = ?
             AND shipment_status = 'Assigned for Last Mile'`,
          [shipmentId, partnerId]
        );
      }

      let eventCity = shipment.destination_city;
      let eventState = shipment.destination_state;
      let locationType = "hub";
      let eventNotes = `Last-mile shipment status changed to ${requestedStatus}`;

      if (requestedStatus === "Delivered") {
        const [addresses] = await connection.query(
          `SELECT a.city, a.state
           FROM orders o
           LEFT JOIN addresses a ON a.id = o.address_id
           WHERE o.id = ?
           LIMIT 1`,
          [shipment.order_id]
        );

        if (addresses.length && addresses[0].city) {
          eventCity = addresses[0].city;
        }
        if (addresses.length && addresses[0].state) {
          eventState = addresses[0].state;
        }

        locationType = "customer";
        eventNotes = "Shipment delivered to the customer";
      }

      await connection.query(
        `INSERT INTO shipment_tracking_events
          (shipment_id, event_status, location_type, hub_id,
           city, state, notes, updated_by_role, updated_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipmentId,
          requestedStatus,
          locationType,
          requestedStatus === "Delivered" ? null : shipment.destination_hub_id,
          eventCity,
          eventState,
          eventNotes,
          "delivery",
          partnerId
        ]
      );

      if (requestedStatus === "Delivered") {
        const [activeAssignments] = await connection.query(
          `SELECT COUNT(*) AS active_count
           FROM merchant_shipments
           WHERE (
             pickup_partner_id = ?
             AND shipment_status IN ('Pickup Assigned', 'Picked Up')
           ) OR (
             last_mile_partner_id = ?
             AND shipment_status IN ('Assigned for Last Mile', 'Out for Delivery')
           )`,
          [partnerId, partnerId]
        );

        if (Number(activeAssignments[0].active_count) === 0) {
          await connection.query(
            `UPDATE delivery_partners
             SET availability_status = 'Online'
             WHERE id = ?`,
            [partnerId]
          );
        }
      }

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: `Shipment status updated to ${requestedStatus}`,
        shipment: {
          id: shipmentId,
          order_id: shipment.order_id,
          tracking_number: shipment.tracking_number,
          shipment_status: requestedStatus
        }
      });
    } catch (error) {
      if (connection && transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Last-mile status rollback error:", rollbackError.message);
        }
      }

      console.error("Last-mile status update error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update last-mile shipment status"
      });
    } finally {
      if (connection) connection.release();
    }
  }
);



// GET /api/delivery/shipments/my-assignments
// Returns shipments assigned to the logged-in delivery partner.
router.get(
  "/shipments/my-assignments",
  requireAuth,
  requireRole("delivery"),
  async (req, res) => {
    try {
      const partnerId = Number(req.user.id);

      if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery partner ID"
        });
      }

      // First-mile shipments assigned to this partner
      const [pickupShipments] = await db.query(
        `SELECT
           ms.id AS shipment_id,
           ms.order_id,
           ms.merchant_id,
           ms.tracking_number,
           ms.pickup_address,
           ms.pickup_city,
           ms.pickup_state,
           ms.pickup_pincode,
           ms.shipment_status,
           ms.ready_at,
           ms.assigned_at,
           ms.picked_up_at,
           ms.origin_hub_id,
           h.hub_name AS origin_hub_name,
           h.city AS origin_hub_city,
           h.state AS origin_hub_state
         FROM merchant_shipments ms
         LEFT JOIN dispatch_hubs h
           ON h.id = ms.origin_hub_id
         WHERE ms.pickup_partner_id = ?
           AND ms.shipment_status IN ('Pickup Assigned', 'Picked Up')
         ORDER BY ms.assigned_at DESC`,
        [partnerId]
      );

      // Last-mile shipments assigned to this partner
      const [lastMileShipments] = await db.query(
        `SELECT
           ms.id AS shipment_id,
           ms.order_id,
           ms.merchant_id,
           ms.tracking_number,
           ms.shipment_status,
           ms.assigned_at,
           ms.destination_hub_id,
           h.hub_name AS destination_hub_name,
           h.city AS destination_hub_city,
           h.state AS destination_hub_state
         FROM merchant_shipments ms
         LEFT JOIN dispatch_hubs h
           ON h.id = ms.destination_hub_id
         WHERE ms.last_mile_partner_id = ?
           AND ms.shipment_status IN (
             'Assigned for Last Mile',
             'Out for Delivery'
           )
         ORDER BY ms.assigned_at DESC`,
        [partnerId]
      );

      return res.json({
        success: true,
        pickupShipments,
        lastMileShipments,
        total:
          pickupShipments.length + lastMileShipments.length
      });

    } catch (error) {
      console.error("My assigned shipments error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve assigned shipments"
      });
    }
  }
);



module.exports = router;


console.log(
  "DELIVERY.JS ROUTES LOADED"
);