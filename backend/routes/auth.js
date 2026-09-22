const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db");

const router = express.Router();

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
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
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
          role
        )
        VALUES (?, ?, ?, ?, 'customer')`,
        [
          name,
          email,
          hashedPassword,
          phone || null,
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
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        businessName,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !businessName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Business name, name, email and password are required",
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
            business_name
          )
          VALUES (?, ?, ?, ?, 'merchant', ?)`,
          [
            name,
            email,
            hashedPassword,
            phone || null,
            businessName,
          ]
        );

      res.status(201).json({
        success: true,
        message:
          "Merchant registration successful",

        user: {
          id: result.insertId,
          name,
          email,
          phone: phone || null,
          role: "merchant",

          business_name:
            businessName,

          businessName:
            businessName,
        },
      });

    } catch (error) {
      console.error(
        "Merchant registration error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


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

      const [users] =
        await db.query(
          `SELECT
            id,
            name,
            email,
            phone,
            business_name,
            role
           FROM users
           WHERE id = ?
           AND role = 'merchant'`,
          [merchantId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Merchant not found",
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

          business_name:
            user.business_name || "",

          businessName:
            user.business_name || "",
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
      const merchantId =
        req.params.merchantId;

      const {
        name,
        business_name,
        phone,
      } = req.body;

      console.log(
        "UPDATE MERCHANT PROFILE:",
        merchantId
      );

      if (
        !name ||
        !business_name
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name and business name are required",
        });
      }

      /* ---------------------------------------------
         CHECK MERCHANT
      --------------------------------------------- */

      const [existing] =
        await db.query(
          `SELECT id
           FROM users
           WHERE id = ?
           AND role = 'merchant'`,
          [merchantId]
        );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Merchant not found",
        });
      }

      /* ---------------------------------------------
         UPDATE
      --------------------------------------------- */

      await db.query(
        `UPDATE users
         SET
           name = ?,
           business_name = ?,
           phone = ?
         WHERE id = ?
         AND role = 'merchant'`,
        [
          name.trim(),
          business_name.trim(),
          phone
            ? phone.trim()
            : null,
          merchantId,
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
            business_name,
            role
           FROM users
           WHERE id = ?`,
          [merchantId]
        );

      const user = users[0];

      res.json({
        success: true,

        message:
          "Merchant profile updated successfully",

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,

          business_name:
            user.business_name || "",

          businessName:
            user.business_name || "",
        },
      });

    } catch (error) {
      console.error(
        "Update merchant profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update merchant profile",
      });
    }
  }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;