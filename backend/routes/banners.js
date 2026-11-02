const express = require("express");
const db = require("../db");

const router = express.Router();


// =================================================
// GET ACTIVE BANNER
// PUBLIC API
// =================================================

router.get("/active", async (req, res) => {
  try {

    const [banners] = await db.query(`
      SELECT
        id,
        title,
        description,
        discount,
        button_text,
        image,
        is_active
      FROM banners
      WHERE is_active = TRUE
      ORDER BY id DESC
      LIMIT 1
    `);

    if (banners.length === 0) {
      return res.json({
        success: true,
        banner: null,
      });
    }

    res.json({
      success: true,
      banner: banners[0],
    });

  } catch (error) {

    console.error(
      "Get active banner error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch active banner",
    });

  }
});


module.exports = router;