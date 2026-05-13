const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Quick Testing Login (Bypasses password)
router.post('/test-login', async (req, res) => {
  const { role } = req.body; // 'chef' or 'supervisor'

  try {
    const userRoleText = role === 'chef' ? 'test_chef' : 'test_super';
    const user = await db.query('SELECT * FROM users WHERE username = $1', [userRoleText]);

    if (user.rows.length === 0) {
      return res.status(400).json({ msg: 'Database not initialized with test users yet. Please run schema.sql' });
    }

    const payload = {
      user: {
        id: user.rows[0].id,
        role: user.rows[0].role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
