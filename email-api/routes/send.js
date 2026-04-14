const express = require('express');
const router  = express.Router();
const sgMail  = require('@sendgrid/mail');
const auth    = require('../middleware/auth');
const { pool } = require('../models/db');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /api/send-email
// Supports attachments: [{ filename, content (base64), type }]
router.post('/send-email', auth, async (req, res) => {
  const { to, subject, body, attachments } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject and body are required.' });
  }

  try {
    const msg = {
      to,
      from: process.env.SMTP_EMAIL,
      subject,
      text: body
    };

    // attach files if provided
    if (attachments && attachments.length > 0) {
      msg.attachments = attachments.map(a => ({
        filename:    a.filename,
        content:     a.content,  // base64 string
        type:        a.type,
        disposition: 'attachment'
      }));
    }

    await sgMail.send(msg);

    // save to sent_emails table
    await pool.query(
      `INSERT INTO sent_emails ("to", subject, body) VALUES ($1, $2, $3)`,
      [to, subject, body]
    );

    return res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error('SendGrid error:', err.message);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
});

// GET /api/sent-emails
// Fetch all sent emails with pagination
router.get('/sent-emails', auth, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [emails, count] = await Promise.all([
      pool.query(`SELECT * FROM sent_emails ORDER BY sent_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*) FROM sent_emails`)
    ]);

    return res.json({
      total: parseInt(count.rows[0].count),
      page,
      limit,
      emails: emails.rows
    });
  } catch (err) {
    console.error('Fetch sent error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch sent emails.' });
  }
});

module.exports = router;
