const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

// POST /api/login
// Developer calls this to get a JWT token
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.API_USERNAME ||
    password !== process.env.API_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
  return res.json({ token });
});

module.exports = router;
