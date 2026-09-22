const express = require("express");
const db = require("../db");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =================================================
// CUSTOMER SUBMIT PRODUCT REVIEW
// =================================================

router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {
    try {

      const {
        product_id,
        order_id,
        rating,
        feedback,
      } = req.body;


      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (
        !product_id ||
        !order_id ||
        !rating ||
        !feedback ||
        Number(rating) < 1 ||
        Number(rating) > 5
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Please provide product, order, rating and feedback",
        });

      }


      // ---------------------------------------------
      // CHECK ORDER BELONGS TO CUSTOMER
      // AND PRODUCT WAS ACTUALLY ORDERED
      // ---------------------------------------------

      const [orders] =
        await db.query(
          `
          SELECT
            o.id,
            o.order_status,
            oi.product_id
          FROM orders o
          INNER JOIN order_items oi
            ON o.id = oi.order_id
          WHERE
            o.id = ?
            AND o.user_id = ?
            AND oi.product_id = ?
          `,
          [
            order_id,
            req.user.id,
            product_id,
          ]
        );


      if (orders.length === 0) {

        return res.status(403).json({
          success: false,
          message:
            "You can only review a product that you ordered",
        });

      }


      // ---------------------------------------------
      // ONLY DELIVERED ORDERS CAN BE REVIEWED
      // ---------------------------------------------

      if (
        String(
          orders[0].order_status
        ).toLowerCase() !== "delivered"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "You can give feedback only after delivery",
        });

      }


      // ---------------------------------------------
      // CHECK ALREADY REVIEWED
      // ---------------------------------------------

      const [existingReview] =
        await db.query(
          `
          SELECT id
          FROM product_reviews
          WHERE
            product_id = ?
            AND customer_id = ?
            AND order_id = ?
          `,
          [
            product_id,
            req.user.id,
            order_id,
          ]
        );


      if (
        existingReview.length > 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "You have already submitted feedback for this product",
        });

      }


      // ---------------------------------------------
      // SAVE CUSTOMER REVIEW
      // ---------------------------------------------

      const [result] =
        await db.query(
          `
          INSERT INTO product_reviews
          (
            product_id,
            customer_id,
            order_id,
            rating,
            feedback
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            product_id,
            req.user.id,
            order_id,
            Number(rating),
            feedback.trim(),
          ]
        );


      res.status(201).json({

        success: true,

        message:
          "Feedback submitted successfully",

        review_id:
          result.insertId,

      });


    } catch (error) {

      console.error(
        "Submit review error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to submit feedback",

      });

    }
  }
);


// =================================================
// GET PRODUCT REVIEWS + ADMIN RATING
// EVERYONE CAN VIEW
// =================================================

router.get(
  "/product/:productId",
  async (req, res) => {

    try {

      const productId =
        req.params.productId;


      // ---------------------------------------------
      // GET CUSTOMER REVIEWS
      // ---------------------------------------------

      const [reviews] =
        await db.query(
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
          WHERE
            pr.product_id = ?
          ORDER BY
            pr.created_at DESC
          `,
          [productId]
        );


      // ---------------------------------------------
      // CUSTOMER AVERAGE RATING
      // ---------------------------------------------

      let averageRating = 0;


      if (
        reviews.length > 0
      ) {

        const totalRating =
          reviews.reduce(
            (sum, review) =>
              sum +
              Number(
                review.rating || 0
              ),
            0
          );


        averageRating =
          totalRating /
          reviews.length;

      }


      // ---------------------------------------------
      // GET ADMIN RATING
      // ---------------------------------------------

      const [adminRatings] =
        await db.query(
          `
          SELECT
            rating,
            created_at
          FROM admin_product_ratings
          WHERE
            product_id = ?
          ORDER BY
            created_at DESC
          LIMIT 1
          `,
          [productId]
        );


      let adminRating = null;


      if (
        adminRatings.length > 0
      ) {

        adminRating =
          Number(
            adminRatings[0].rating
          );

      }


      // ---------------------------------------------
      // SEND RESPONSE
      // ---------------------------------------------

      res.json({

        success: true,

        reviews,

        totalReviews:
          reviews.length,

        averageRating:
          Number(
            averageRating.toFixed(1)
          ),

        adminRating,

      });


    } catch (error) {

      console.error(
        "Get product reviews error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to fetch product reviews",

      });

    }

  }
);


// =================================================
// CHECK WHETHER CUSTOMER ALREADY REVIEWED
// =================================================

router.get(
  "/check/:orderId/:productId",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {

    try {

      const [reviews] =
        await db.query(
          `
          SELECT
            id,
            rating,
            feedback
          FROM product_reviews
          WHERE
            order_id = ?
            AND product_id = ?
            AND customer_id = ?
          `,
          [
            req.params.orderId,
            req.params.productId,
            req.user.id,
          ]
        );


      res.json({

        success: true,

        reviewed:
          reviews.length > 0,

        review:
          reviews.length > 0
            ? reviews[0]
            : null,

      });


    } catch (error) {

      console.error(
        "Check review error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to check review",

      });

    }

  }
);


module.exports = router;