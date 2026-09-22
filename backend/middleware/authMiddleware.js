const jwt = require("jsonwebtoken");
const db = require("../db");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    /* ============================================
       CHECK AUTHORIZATION HEADER
    ============================================ */

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Token is missing",
      });
    }

    /* ============================================
       CHECK BEARER FORMAT
    ============================================ */

    const parts = authHeader.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format. Use Bearer token",
      });
    }

    const token = parts[1];

    /* ============================================
       CHECK TOKEN
    ============================================ */

    if (
      !token ||
      token === "undefined" ||
      token === "null"
    ) {
      return res.status(401).json({
        success: false,
        message: "Valid authentication token is required",
      });
    }

    if (token.split(".").length !== 3) {
      return res.status(401).json({
        success: false,
        message: "Malformed authentication token",
      });
    }

    /* ============================================
       CHECK JWT SECRET
    ============================================ */

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    /* ============================================
       VERIFY JWT
    ============================================ */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* ============================================
       CHECK TOKEN PAYLOAD
    ============================================ */

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    console.log("AUTH TOKEN DECODED:", {
      id: decoded.id,
      role: decoded.role,
    });

    /* =====================================================
       DELIVERY PARTNER
       Delivery partners are stored in delivery_partners
       table, not users table.
    ===================================================== */

    if (decoded.role === "delivery") {
      const [deliveryPartners] = await db.query(
        `
        SELECT
          id,
          name,
          email,
          phone,
          availability_status,
          status
        FROM delivery_partners
        WHERE id = ?
        LIMIT 1
        `,
        [decoded.id]
      );

      if (deliveryPartners.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      const deliveryPartner =
        deliveryPartners[0];

      /* ==========================================
         CHECK DELIVERY PARTNER STATUS
      ========================================== */

      if (
        deliveryPartner.status &&
        deliveryPartner.status !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message: "Delivery partner account is not active",
        });
      }

      /* ==========================================
         SET DELIVERY USER
      ========================================== */

      req.user = {
        id: deliveryPartner.id,
        name: deliveryPartner.name,
        email: deliveryPartner.email,
        phone: deliveryPartner.phone,

        role: "delivery",

        availability_status:
          deliveryPartner.availability_status,

        status:
          deliveryPartner.status,
      };

      console.log(
        "AUTH USER: Delivery Partner",
        {
          id: req.user.id,
          role: req.user.role,
        }
      );

      return next();
    }

    /* =====================================================
       NORMAL USERS
       Customer / Merchant / Admin
    ===================================================== */

    const [users] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        business_name
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    /* ============================================
       SET NORMAL USER
    ============================================ */

    req.user = users[0];

    console.log(
      "AUTH USER: Normal User",
      {
        id: req.user.id,
        role: req.user.role,
      }
    );

    next();

  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error.name,
      "-",
      error.message
    );

    /* ============================================
       TOKEN EXPIRED
    ============================================ */

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    /* ============================================
       INVALID JWT
    ============================================ */

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    /* ============================================
       OTHER ERROR
    ============================================ */

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}


/* =====================================================
   REQUIRE ROLE
===================================================== */

function requireRole(...allowedRoles) {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = String(
      req.user.role || ""
    )
      .trim()
      .toLowerCase();

    const normalizedAllowedRoles =
      allowedRoles.map((role) =>
        String(role)
          .trim()
          .toLowerCase()
      );

    console.log(
      "ROLE CHECK:",
      {
        currentRole: userRole,
        requiredRoles: normalizedAllowedRoles,
        userId: req.user.id,
      }
    );

    if (
      !normalizedAllowedRoles.includes(userRole)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        required_roles:
          normalizedAllowedRoles,
        current_role:
          userRole,
      });
    }

    next();
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {
  requireAuth,
  requireRole,
};