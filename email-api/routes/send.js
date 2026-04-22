const express = require('express');
const router  = express.Router();
const sgMail  = require('@sendgrid/mail');
const { pool } = require('../models/db');
const auth    = require('../middleware/auth');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /api/send-email
router.post('/send-email', auth, async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject and body are required.' });
  }

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      text: body
    });

    // Save to sent_emails table
    await pool.query(
      `INSERT INTO sent_emails ("to", subject, body) VALUES ($1, $2, $3)`,
      [to, subject, body]
    );

    return res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error('Send email error:', err.message);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
});

// GET /api/sent-emails — sent box
router.get('/sent-emails', auth, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [emails, count] = await Promise.all([
      pool.query(`SELECT * FROM sent_emails ORDER BY sent_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*) FROM sent_emails`)
    ]);

    return res.json({ total: parseInt(count.rows[0].count), page, limit, emails: emails.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch sent emails.' });
  }
});

// GET /api/sent-emails/:id — single sent email
router.get('/sent-emails/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sent_emails WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sent email not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch sent email.' });
  }
});

module.exports = router;
