const express = require("express");
const db = require("../db");

const router = express.Router();


// =========================================
// GET ALL ADDRESSES FOR USER
// =========================================

router.get("/:userId", async (req, res) => {
  try {
    const [addresses] = await db.query(
      `SELECT *
       FROM addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, id DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      addresses,
    });

  } catch (error) {
    console.error("Get addresses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
});


// =========================================
// ADD ADDRESS
// =========================================

router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode,
      is_default,
    } = req.body;


    if (
      !user_id ||
      !full_name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }


    /*
      Check whether user already has
      any saved address.
    */

    const [existingAddresses] =
      await db.query(
        `SELECT id
         FROM addresses
         WHERE user_id = ?
         LIMIT 1`,
        [user_id]
      );


    /*
      First address automatically becomes
      the default address.
    */

    const shouldBeDefault =
      existingAddresses.length === 0 ||
      is_default === true;


    /*
      If this address is default,
      remove default status from
      all other addresses of this user.
    */

    if (shouldBeDefault) {
      await db.query(
        `UPDATE addresses
         SET is_default = FALSE
         WHERE user_id = ?`,
        [user_id]
      );
    }


    /*
      Insert new address
    */

    const [result] = await db.query(
      `INSERT INTO addresses
       (
         user_id,
         full_name,
         phone,
         address_line,
         city,
         state,
         pincode,
         is_default
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        full_name,
        phone,
        address_line,
        city,
        state,
        pincode,
        shouldBeDefault,
      ]
    );


    /*
      Get newly created address
    */

    const [newAddress] =
      await db.query(
        `SELECT *
         FROM addresses
         WHERE id = ?`,
        [result.insertId]
      );


    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress[0],
    });

  } catch (error) {
    console.error("Add address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  }
});


// =========================================
// SET DEFAULT ADDRESS
// =========================================

router.put("/:id/default", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }


    /*
      Check whether address belongs
      to this user.
    */

    const [address] = await db.query(
      `SELECT id
       FROM addresses
       WHERE id = ?
       AND user_id = ?`,
      [
        req.params.id,
        user_id,
      ]
    );


    if (address.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }


    /*
      Remove default from all
      addresses of this user.
    */

    await db.query(
      `UPDATE addresses
       SET is_default = FALSE
       WHERE user_id = ?`,
      [user_id]
    );


    /*
      Make selected address default.
    */

    await db.query(
      `UPDATE addresses
       SET is_default = TRUE
       WHERE id = ?
       AND user_id = ?`,
      [
        req.params.id,
        user_id,
      ]
    );


    res.json({
      success: true,
      message: "Default address updated successfully",
    });

  } catch (error) {
    console.error(
      "Set default address error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to set default address",
    });
  }
});


// =========================================
// GET DEFAULT ADDRESS
// =========================================

router.get("/:userId/default", async (req, res) => {
  try {
    const [addresses] =
      await db.query(
        `SELECT *
         FROM addresses
         WHERE user_id = ?
         AND is_default = TRUE
         LIMIT 1`,
        [req.params.userId]
      );


    if (addresses.length === 0) {
      return res.json({
        success: true,
        address: null,
      });
    }


    res.json({
      success: true,
      address: addresses[0],
    });

  } catch (error) {
    console.error(
      "Get default address error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch default address",
    });
  }
});


// =========================================
// UPDATE ADDRESS
// =========================================

router.put("/:id", async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode,
      is_default,
    } = req.body;


    if (
      !user_id ||
      !full_name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }


    /*
      If updating to default,
      remove default from others.
    */

    if (is_default === true) {
      await db.query(
        `UPDATE addresses
         SET is_default = FALSE
         WHERE user_id = ?
         AND id != ?`,
        [
          user_id,
          req.params.id,
        ]
      );
    }


    await db.query(
      `UPDATE addresses
       SET
         full_name = ?,
         phone = ?,
         address_line = ?,
         city = ?,
         state = ?,
         pincode = ?,
         is_default = ?
       WHERE id = ?
       AND user_id = ?`,
      [
        full_name,
        phone,
        address_line,
        city,
        state,
        pincode,
        is_default === true,
        req.params.id,
        user_id,
      ]
    );


    res.json({
      success: true,
      message: "Address updated successfully",
    });

  } catch (error) {
    console.error(
      "Update address error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
});


// =========================================
// DELETE ADDRESS
// =========================================

router.delete("/:id", async (req, res) => {
  try {
    const { user_id } = req.body;


    /*
      Get address before deleting it.
    */

    const [addressRows] =
      await db.query(
        `SELECT is_default
         FROM addresses
         WHERE id = ?
         AND user_id = ?`,
        [
          req.params.id,
          user_id,
        ]
      );


    if (addressRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }


    const wasDefault =
      Boolean(
        addressRows[0].is_default
      );


    /*
      Delete address.
    */

    await db.query(
      `DELETE FROM addresses
       WHERE id = ?
       AND user_id = ?`,
      [
        req.params.id,
        user_id,
      ]
    );


    /*
      If deleted address was default,
      automatically make the newest
      remaining address default.
    */

    if (wasDefault) {
      const [remaining] =
        await db.query(
          `SELECT id
           FROM addresses
           WHERE user_id = ?
           ORDER BY id DESC
           LIMIT 1`,
          [user_id]
        );


      if (remaining.length > 0) {
        await db.query(
          `UPDATE addresses
           SET is_default = TRUE
           WHERE id = ?
           AND user_id = ?`,
          [
            remaining[0].id,
            user_id,
          ]
        );
      }
    }


    res.json({
      success: true,
      message: "Address deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete address error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
});


module.exports = router;