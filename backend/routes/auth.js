const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const db = require("../db");

const router = express.Router();

const merchantStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/merchant-documents");
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

const uploadMerchantDocument = multer({
  storage: merchantStorage,
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

console.log("AUTH ROUTES LOADED");

/* =====================================================
   CUSTOMER REGISTER
===================================================== */

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
security_question,
  security_answer,
    } = req.body;

    if (
  !name ||
  !email ||
  !password ||
  !security_question ||
  !security_answer
) {
      return res.status(400).json({
        success: false,
        message:
  "Name, email, password, security question and security answer are required",
      });
    }

    const [existingUsers] =
      await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const [result] =
      await db.query(
        `INSERT INTO users
(
  name,
  email,
  password,
  phone,
  role,
  security_question,
  security_answer
)
VALUES (?, ?, ?, ?, 'customer', ?, ?)`,
[
  name,
  email,
  hashedPassword,
  phone || null,
  security_question,
  security_answer,
]
      );

    res.status(201).json({
      success: true,
      message:
        "Registration successful",

     user: {
  id: result.insertId,
  name,
  email,
  phone: phone || null,
  role: "customer",
  security_question,
},
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});



/* =====================================================
   MERCHANT REGISTER
===================================================== */

router.post(
  "/merchant/register",
  uploadMerchantDocument.single("aadhaar"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        businessName,
        businessAddress,
        city,
        state,
        pincode,
        security_question,
        security_answer,
      } = req.body;

      // Required field validation
      if (
        !name?.trim() ||
        !email?.trim() ||
        !password ||
        !businessName?.trim() ||
        !businessAddress?.trim() ||
        !city?.trim() ||
        !state?.trim() ||
        !pincode?.trim() ||
        !security_question ||
        !security_answer?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill in all required fields, including your complete business address.",
        });
      }

      if (!/^\d{6}$/.test(pincode.trim())) {
        return res.status(400).json({
          success: false,
          message: "Pincode must contain exactly 6 digits.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const [existingUsers] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [normalizedEmail]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      const [result] = await db.query(
        `INSERT INTO users (
          name,
          email,
          password,
          phone,
          role,
          business_name,
          business_address,
          business_city,
          business_state,
          business_pincode,
          security_question,
          security_answer,
          aadhaar_image,
          approval_status
        )
        VALUES (?, ?, ?, ?, 'merchant', ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
        [
          name.trim(),
          normalizedEmail,
          hashedPassword,
          phone?.trim() || null,
          businessName.trim(),
          businessAddress.trim(),
          city.trim(),
          state.trim(),
          pincode.trim(),
          security_question,
          security_answer.trim(),
          req.file
            ? `/uploads/merchant-documents/${req.file.filename}`
            : null,
        ]
      );

      return res.status(201).json({
        success: true,
        message:
          "Merchant registration successful. Awaiting admin approval.",
        user: {
          id: result.insertId,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          role: "merchant",
          business_name: businessName.trim(),
          businessName: businessName.trim(),
          business_address: businessAddress.trim(),
          business_city: city.trim(),
          business_state: state.trim(),
          business_pincode: pincode.trim(),
          approval_status: "Pending",
        },
      });
    } catch (error) {
      console.error(
        "Merchant registration error:",
        error
      );

      if (error.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({
          success: false,
          message:
            "Merchant address columns are missing from the users table. Check the database migration.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


/* =====================================================
   DISPATCH REGISTER
===================================================== */

router.post("/dispatch/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (
        name,
        email,
        phone,
        password,
        role,
        approval_status
      ) VALUES (?, ?, ?, ?, 'dispatch', 'Pending')`,
      [
        name.trim(),
        normalizedEmail,
        phone?.trim() || null,
        hashedPassword,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Registration submitted. Please wait for admin approval.",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: "dispatch",
        approval_status: "Pending",
      },
    });
  } catch (error) {
    console.error("Dispatch registration error:", error);

    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        success: false,
        message: "Required database column is missing. Check the users table schema.",
      });
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Dispatch registration failed.",
    });
  }
});


/* =====================================================
   LOGIN
===================================================== */

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const [users] =
      await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const user = users[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

if (
  user.role === "merchant" &&
  user.approval_status !== "Approved"
) {
  return res.status(403).json({
    success: false,
    message:
      user.approval_status === "Rejected"
        ? "Your merchant account has been rejected by the admin."
        : "Your merchant account is pending admin approval.",
  });
}


if (
  user.role === "dispatch" &&
  user.approval_status !== "Approved"
) {
  return res.status(403).json({
    success: false,
    message:
      user.approval_status === "Rejected"
        ? "Your dispatch account was rejected by admin."
        : "Your dispatch account is pending admin approval.",
  });
} 

    /*
      Verify selected role
    */

    if (
      role &&
      user.role !== role
    ) {
      return res.status(403).json({
        success: false,
        message:
          `This account is registered as ${user.role}`,
      });
    }
    const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
  }
);

    res.json({
      success: true,
      message:
        "Login successful",
      token: token,
 user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,

        business_name:
          user.business_name || null,

        businessName:
          user.business_name || null,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


/* =====================================================
   GET MERCHANT PROFILE
===================================================== */

router.get(
  "/merchant/:merchantId",
  async (req, res) => {
    try {
      const merchantId =
        req.params.merchantId;

      console.log(
        "GET MERCHANT PROFILE:",
        merchantId
      );

      
const [users] = await db.query(
  `SELECT
    id,
    name,
    email,
    phone,
    business_name,
    business_address,
    business_city,
    business_state,
    business_pincode,
    role
   FROM users
   WHERE id = ?
   AND role = 'merchant'`,
  [merchantId]
);

if (users.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Merchant not found",
  });
}

const user = users[0];

return res.json({
  success: true,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    business_name: user.business_name || "",
    businessName: user.business_name || "",
    business_address: user.business_address || "",
    business_city: user.business_city || "",
    business_state: user.business_state || "",
    business_pincode: user.business_pincode || "",
  },
});


    } catch (error) {
      console.error(
        "Get merchant profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch merchant profile",
      });
    }
  }
);

/* =====================================================
   GET CUSTOMER PROFILE
===================================================== */

router.get(
  "/user/:userId",
  async (req, res) => {
    try {
      const userId =
        req.params.userId;

      console.log(
        "GET CUSTOMER PROFILE:",
        userId
      );

      const [users] =
        await db.query(
          `SELECT
            id,
            name,
            email,
            phone,
            role
           FROM users
           WHERE id = ?
           AND role = 'customer'`,
          [userId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found",
        });
      }

      const user = users[0];

      res.json({
        success: true,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });

    } catch (error) {
      console.error(
        "Get customer profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch customer profile",
      });
    }
  }
);


/* =====================================================
   UPDATE CUSTOMER PROFILE
===================================================== */

router.put(
  "/user/:userId",
  async (req, res) => {
    try {
      const userId =
        req.params.userId;

      const {
        name,
        phone,
      } = req.body;

      console.log(
        "UPDATE CUSTOMER PROFILE:",
        userId
      );

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "Name is required",
        });
      }


      /* ---------------------------------------------
         CHECK CUSTOMER
      --------------------------------------------- */

      const [existing] =
        await db.query(
          `SELECT
             id
           FROM users
           WHERE id = ?
           AND role = 'customer'`,
          [userId]
        );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found",
        });
      }


      /* ---------------------------------------------
         UPDATE CUSTOMER
      --------------------------------------------- */

      await db.query(
        `UPDATE users
         SET
           name = ?,
           phone = ?
         WHERE id = ?
         AND role = 'customer'`,
        [
          name.trim(),

          phone
            ? phone.trim()
            : null,

          userId,
        ]
      );


      /* ---------------------------------------------
         GET UPDATED USER
      --------------------------------------------- */

      const [users] =
        await db.query(
          `SELECT
             id,
             name,
             email,
             phone,
             role
           FROM users
           WHERE id = ?`,
          [userId]
        );

      const user = users[0];


      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      res.json({
        success: true,

        message:
          "Customer profile updated successfully",

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });

    } catch (error) {
      console.error(
        "Update customer profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update customer profile",
      });
    }
  }
);





/* =====================================================
   UPDATE MERCHANT PROFILE
===================================================== */

router.put(
  "/merchant/:merchantId",
  async (req, res) => {
    try {
      const merchantId = req.params.merchantId;

      const {
        name,
        business_name,
        businessAddress,
        city,
        state,
        pincode,
        phone,
      } = req.body;

      const finalBusinessName =
        business_name ?? req.body.businessName;

      // Accept either frontend camelCase or database-style names.
      const finalAddress =
        businessAddress ?? req.body.business_address;

      const finalCity =
        city ?? req.body.business_city;

      const finalState =
        state ?? req.body.business_state;

      const finalPincode =
        pincode ?? req.body.business_pincode;

      if (
        !name?.trim() ||
        !finalBusinessName?.trim() ||
        !finalAddress?.trim() ||
        !finalCity?.trim() ||
        !finalState?.trim() ||
        !finalPincode?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, business name, address, city, state and pincode are required.",
        });
      }

      if (!/^\d{6}$/.test(finalPincode.trim())) {
        return res.status(400).json({
          success: false,
          message: "Pincode must contain exactly 6 digits.",
        });
      }

      const [existing] = await db.query(
        `SELECT id
         FROM users
         WHERE id = ? AND role = 'merchant'`,
        [merchantId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Merchant not found",
        });
      }

      const [updateResult] = await db.query(
        `UPDATE users
         SET
           name = ?,
           business_name = ?,
           phone = ?,
           business_address = ?,
           business_city = ?,
           business_state = ?,
           business_pincode = ?
         WHERE id = ? AND role = 'merchant'`,
        [
          name.trim(),
          finalBusinessName.trim(),
          phone?.trim() || null,
          finalAddress.trim(),
          finalCity.trim(),
          finalState.trim(),
          finalPincode.trim(),
          merchantId,
        ]
      );

      console.log("Merchant profile update:", {
        merchantId,
        affectedRows: updateResult.affectedRows,
      });

      const [users] = await db.query(
        `SELECT
           id,
           name,
           email,
           phone,
           business_name,
           business_address,
           business_city,
           business_state,
           business_pincode,
           role
         FROM users
         WHERE id = ? AND role = 'merchant'`,
        [merchantId]
      );

      const user = users[0];

      return res.json({
        success: true,
        message: "Merchant profile updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          business_name: user.business_name || "",
          businessName: user.business_name || "",
          business_address: user.business_address || "",
          business_city: user.business_city || "",
          business_state: user.business_state || "",
          business_pincode: user.business_pincode || "",
        },
      });
    } catch (error) {
      console.error(
        "Update merchant profile error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update merchant profile",
      });
    }
  }
);


      

/* =====================================================
   FORGOT PASSWORD - VERIFY SECURITY ANSWER
===================================================== */

router.post(
  "/forgot-password/verify",
  async (req, res) => {
    try {
      const {
        email,
        question,
        answer,
        role,
      } = req.body;

      if (
        !email ||
        !question ||
        !answer
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email, security question and answer are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      let user = null;
      let userType = null;

      /*
        Customer / Merchant
      */
      if (
        role === "customer" ||
        role === "merchant"
      ) {
        const [users] =
          await db.query(
            `
            SELECT
              id,
              email,
              security_question,
              security_answer,
              role
            FROM users
            WHERE email = ?
              AND role = ?
            LIMIT 1
            `,
            [
              normalizedEmail,
              role,
            ]
          );

        if (users.length > 0) {
          user = users[0];
          userType = "user";
        }
      }

      /*
        Delivery Partner
      */
      if (role === "delivery") {
        const [partners] =
          await db.query(
            `
            SELECT
              id,
              email,
              security_question,
              security_answer
            FROM delivery_partners
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
          );

        if (partners.length > 0) {
          user = partners[0];
          userType = "delivery";
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Account not found",
        });
      }

      if (
        user.security_question !==
        question
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Incorrect security question",
        });
      }

      if (
        user.security_answer
          ?.trim()
          .toLowerCase() !==
        answer.trim().toLowerCase()
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Incorrect security answer",
        });
      }

      res.json({
        success: true,
        message:
          "Security verification successful",
        user_id: user.id,
        user_type: userType,
      });

    } catch (error) {
      console.error(
        "Forgot password verification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to verify security details",
      });
    }
  }
);


/* =====================================================
   FORGOT PASSWORD - RESET PASSWORD
===================================================== */

router.post(
  "/forgot-password/reset",
  async (req, res) => {
    try {
      const {
        user_id,
        user_type,
        new_password,
      } = req.body;

      if (
        !user_id ||
        !user_type ||
        !new_password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User ID, user type and new password are required",
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          new_password,
          10
        );

      if (user_type === "user") {

        await db.query(
          `
          UPDATE users
          SET password = ?
          WHERE id = ?
          `,
          [
            hashedPassword,
            user_id,
          ]
        );

      } else if (
        user_type === "delivery"
      ) {

        await db.query(
          `
          UPDATE delivery_partners
          SET password = ?
          WHERE id = ?
          `,
          [
            hashedPassword,
            user_id,
          ]
        );

      } else {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user type",
        });
      }

      res.json({
        success: true,
        message:
          "Password reset successfully",
      });

    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      res.status(500).json({
        success: false,
 message:
          "Failed to reset password",
      });
    }
  }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;
