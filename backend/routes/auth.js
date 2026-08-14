const express = require('express');
const bcrypt = require('bcryptjs');

const db = require('../db');

const router = express.Router();

console.log('AUTH ROUTES LOADED');

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    // Check whether email already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users
      (name, email, password, phone)
      VALUES (?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        phone || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.insertId,
        name,
        email,
        phone: phone || null,
      },
    });
  } catch (error) {
    console.error(
      'Registration error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;