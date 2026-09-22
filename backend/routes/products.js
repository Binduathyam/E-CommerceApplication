const express = require("express");
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
// IMAGE UPLOAD CONFIG
// =================================================

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "products"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });

  console.log(
    "Product upload directory created:",
    uploadDirectory
  );
}


// =================================================
// MULTER STORAGE
// =================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `product-${Date.now()}${extension}`;

    cb(null, filename);
  },
});


const upload = multer({
  storage,

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


// =================================================
// ADMIN GET ALL PRODUCTS
// IMPORTANT: THIS MUST COME BEFORE "/:id"
// =================================================

router.get(
  "/admin/products",
  requireAuth,
  requireRole("admin"),

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
            p.size_fit,
            p.material_care,
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


// =================================================
// CUSTOMER GET PRODUCTS
// ONLY APPROVED PRODUCTS
// =================================================

router.get(
  "/",

  async (req, res) => {

    try {

      const [products] =
        await db.query(`
          SELECT *
          FROM products
          WHERE status = 'approved'
          ORDER BY id DESC
        `);


      res.json({
        success: true,
        products,
      });

    } catch (error) {

      console.error(
        "Products error:",
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


// =================================================
// GET MERCHANT PRODUCTS
// MERCHANT CAN SEE ALL HIS PRODUCTS
// PENDING + APPROVED + REJECTED
// =================================================

router.get(
  "/merchant/:merchantId",

  requireAuth,

  requireRole("merchant"),

  async (req, res) => {

    try {

      if (
        Number(req.params.merchantId) !==
        Number(req.user.id)
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You can only access your own products",
        });

      }


      const [products] =
        await db.query(
          `
          SELECT *
          FROM products
          WHERE merchant_id = ?
          ORDER BY id DESC
          `,
          [
            req.params.merchantId,
          ]
        );


      res.json({
        success: true,
        products,
      });

    } catch (error) {

      console.error(
        "Merchant products error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch merchant products",
      });

    }

  }
);


// =================================================
// UPLOAD PRODUCT IMAGE
// =================================================

router.post(
  "/upload-image",

  requireAuth,

  requireRole("merchant"),

  upload.single("image"),

  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message:
            "Please select an image",
        });

      }


      const imageUrl =
        `${req.protocol}://${req.get("host")}` +
        `/uploads/products/${req.file.filename}`;


      res.status(200).json({

        success: true,

        message:
          "Image uploaded successfully",

        image: imageUrl,

      });

    } catch (error) {

      console.error(
        "Image upload error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to upload image",

      });

    }

  }
);


// =================================================
// ADD PRODUCT
// NEW PRODUCT = PENDING
// =================================================

router.post(
  "/",

  requireAuth,

  requireRole("merchant"),

  async (req, res) => {

    try {

      const {

        merchant_id,

        name,

        category,

        price,

        original_price,

        discount,

        stock,

        brand,

        description,

        size_fit,

        material_care,

        image,

      } = req.body;


      // VALIDATION

      if (

        !merchant_id ||

        !name ||

        !category ||

        price === undefined ||

        stock === undefined ||

        !description ||

        !size_fit ||

        !material_care

      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please provide all required product details",

        });

      }


      // SECURITY CHECK

      if (

        Number(merchant_id) !==
        Number(req.user.id)

      ) {

        return res.status(403).json({

          success: false,

          message:
            "You can only add products to your own store",

        });

      }


      // CHECK MERCHANT

      const [merchant] =
        await db.query(
          `
          SELECT id, role
          FROM users
          WHERE id = ?
          `,
          [
            merchant_id,
          ]
        );


      if (
        merchant.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Merchant not found",

        });

      }


      if (
        merchant[0].role !== "merchant"
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Only merchants can add products",

        });

      }


      // INSERT PRODUCT
      // STATUS AUTOMATICALLY = PENDING

      const [result] =
        await db.query(
          `
          INSERT INTO products
          (
            merchant_id,
            name,
            category,
            price,
            original_price,
            discount,
            stock,
            brand,
            description,
            size_fit,
            material_care,
            image,
            status
          )

          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `,

          [

            merchant_id,

            name.trim(),

            category.trim(),

            Number(price),

            original_price !==
              undefined &&
            original_price !== ""

              ? Number(original_price)

              : Number(price),

            discount !== undefined &&
            discount !== ""

              ? Number(discount)

              : 0,

            Number(stock),

            brand || "",

            description.trim(),

            size_fit.trim(),

            material_care.trim(),

            image || "",

          ]
        );


      const [products] =
        await db.query(
          `
          SELECT *
          FROM products
          WHERE id = ?
          `,
          [
            result.insertId,
          ]
        );


      res.status(201).json({

        success: true,

        message:
          "Product added successfully. Waiting for admin approval.",

        product:
          products[0],

      });

    } catch (error) {

      console.error(
        "Add product error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to add product",

      });

    }

  }
);


// =================================================
// ADMIN APPROVE PRODUCT
// =================================================

router.put(
  "/:id/approve",

  requireAuth,

  requireRole("admin"),

  async (req, res) => {

    try {

      const [result] =
        await db.query(
          `
          UPDATE products
          SET status = 'approved'
          WHERE id = ?
          `,
          [
            req.params.id,
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found",

        });

      }


      res.json({

        success: true,

        message:
          "Product approved successfully",

      });

    } catch (error) {

      console.error(
        "Approve product error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to approve product",

      });

    }

  }
);


// =================================================
// ADMIN REJECT PRODUCT
// =================================================

router.put(
  "/:id/reject",

  requireAuth,

  requireRole("admin"),

  async (req, res) => {

    try {

      const [result] =
        await db.query(
          `
          UPDATE products
          SET status = 'rejected'
          WHERE id = ?
          `,
          [
            req.params.id,
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found",

        });

      }


      res.json({

        success: true,

        message:
          "Product rejected",

      });

    } catch (error) {

      console.error(
        "Reject product error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to reject product",

      });

    }

  }
);


// =================================================
// GET SINGLE PRODUCT
// =================================================

router.get(
  "/:id",

  async (req, res) => {

    try {

      const [products] =
        await db.query(
          `
          SELECT *
          FROM products
          WHERE id = ?
          `,
          [
            req.params.id,
          ]
        );


      if (
        products.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found",

        });

      }


      res.json({

        success: true,

        product:
          products[0],

      });

    } catch (error) {

      console.error(
        "Single product error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to fetch product",

      });

    }

  }
);


// =================================================
// UPDATE PRODUCT
// WHEN MERCHANT EDITS → BACK TO PENDING
// =================================================

router.put(
  "/:id",

  requireAuth,

  requireRole("merchant"),

  async (req, res) => {

    try {

      const {

        merchant_id,

        name,

        category,

        price,

        original_price,

        discount,

        stock,

        brand,

        description,

        size_fit,

        material_care,

        image,

      } = req.body;


      if (

        !merchant_id ||

        !name ||

        !category ||

        price === undefined ||

        stock === undefined ||

        !description ||

        !size_fit ||

        !material_care

      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please provide all required product details",

        });

      }


      if (

        Number(merchant_id) !==
        Number(req.user.id)

      ) {

        return res.status(403).json({

          success: false,

          message:
            "Access denied",

        });

      }


      const [existingProducts] =
        await db.query(
          `
          SELECT id
          FROM products
          WHERE id = ?
          AND merchant_id = ?
          `,
          [
            req.params.id,
            merchant_id,
          ]
        );


      if (
        existingProducts.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found or does not belong to this merchant",

        });

      }


      await db.query(
        `
        UPDATE products

        SET
          name = ?,
          category = ?,
          price = ?,
          original_price = ?,
          discount = ?,
          stock = ?,
          brand = ?,
          description = ?,
          size_fit = ?,
          material_care = ?,
          image = ?,

          status = 'pending'

        WHERE id = ?
        AND merchant_id = ?
        `,

        [

          name.trim(),

          category.trim(),

          Number(price),

          original_price !==
            undefined &&
          original_price !== ""

            ? Number(original_price)

            : Number(price),

          discount !==
            undefined &&
          discount !== ""

            ? Number(discount)

            : 0,

          Number(stock),

          brand || "",

          description.trim(),

          size_fit.trim(),

          material_care.trim(),

          image || "",

          req.params.id,

          merchant_id,

        ]
      );


      const [updatedProducts] =
        await db.query(
          `
          SELECT *
          FROM products
          WHERE id = ?
          `,
          [
            req.params.id,
          ]
        );


      res.json({

        success: true,

        message:
          "Product updated. Waiting for admin approval.",

        product:
          updatedProducts[0],

      });

    } catch (error) {

      console.error(
        "Update product error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to update product",

      });

    }

  }
);


// =================================================
// MERCHANT DELETE OWN PRODUCT
// =================================================

router.delete(
  "/:id",

  requireAuth,

  requireRole("merchant"),

  async (req, res) => {

    try {

      const {
        merchant_id,
      } = req.body;


      if (!merchant_id) {

        return res.status(400).json({

          success: false,

          message:
            "Merchant ID is required",

        });

      }


      if (

        Number(merchant_id) !==
        Number(req.user.id)

      ) {

        return res.status(403).json({

          success: false,

          message:
            "Access denied",

        });

      }


      const [existingProducts] =
        await db.query(
          `
          SELECT id
          FROM products
          WHERE id = ?
          AND merchant_id = ?
          `,
          [
            req.params.id,
            merchant_id,
          ]
        );


      if (
        existingProducts.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found or does not belong to this merchant",

        });

      }


      await db.query(
        `
        DELETE FROM products
        WHERE id = ?
        AND merchant_id = ?
        `,
        [
          req.params.id,
          merchant_id,
        ]
      );


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

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to delete product",

      });

    }

  }
);


// =================================================
// ADMIN DELETE ANY PRODUCT
// =================================================

router.delete(
  "/admin/:id",

  requireAuth,

  requireRole("admin"),

  async (req, res) => {

    try {

      const [result] =
        await db.query(
          `
          DELETE FROM products
          WHERE id = ?
          `,
          [
            req.params.id,
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Product not found",

        });

      }


      res.json({

        success: true,

        message:
          "Product deleted by admin",

      });

    } catch (error) {

      console.error(
        "Admin delete product error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to delete product",

      });

    }

  }
);


// =================================================
// EXPORT ROUTER
// =================================================

module.exports = router;