const express = require('express');
const db = require('../db');

const router = express.Router();

// GET all addresses for a user
router.get('/:userId', async (req, res) => {
  try {
    const [addresses] = await db.query(
      `SELECT *
       FROM addresses
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error('Get addresses error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
    });
  }
});

// ADD address
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode,
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
        message: 'All address fields are required',
      });
    }

    const [result] = await db.query(
      `INSERT INTO addresses
       (user_id, full_name, phone, address_line, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        full_name,
        phone,
        address_line,
        city,
        state,
        pincode,
      ]
    );

    const [newAddress] = await db.query(
      `SELECT *
       FROM addresses
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: newAddress[0],
    });
  } catch (error) {
    console.error('Add address error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add address',
    });
  }
});

// UPDATE address
router.put('/:id', async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode,
    } = req.body;

    await db.query(
      `UPDATE addresses
       SET full_name = ?,
           phone = ?,
           address_line = ?,
           city = ?,
           state = ?,
           pincode = ?
       WHERE id = ? AND user_id = ?`,
      [
        full_name,
        phone,
        address_line,
        city,
        state,
        pincode,
        req.params.id,
        user_id,
      ]
    );

    res.json({
      success: true,
      message: 'Address updated successfully',
    });
  } catch (error) {
    console.error('Update address error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update address',
    });
  }
});

// DELETE address
router.delete('/:id', async (req, res) => {
  try {
    const { user_id } = req.body;

    await db.query(
      `DELETE FROM addresses
       WHERE id = ? AND user_id = ?`,
      [req.params.id, user_id]
    );

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
    });
  }
});

module.exports = router;