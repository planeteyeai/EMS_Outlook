const express  = require('express');
const router   = express.Router();
const { pool } = require('../models/db');
const auth     = require('../middleware/auth');

// POST /api/webhook/new-email
// Called by Power Automate — secured by webhook secret in header
router.post('/webhook/new-email', async (req, res) => {
  const secret = req.query.secret || req.headers['x-secret'];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized webhook call.' });
  }

  try {
    const { subject, from, to, body, receivedAt } = req.body;
    if (!from) return res.status(400).json({ error: '"from" field is required.' });

    // Strip HTML tags from body to save plain text only
    const plainBody = body ? body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

    const result = await pool.query(
      `INSERT INTO emails (subject, "from", "to", body, received_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [subject || '(No Subject)', from, to || '', plainBody, receivedAt ? new Date(receivedAt) : new Date()]
    );

    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ error: 'Failed to save email.' });
  }
});

// GET /api/emails — inbox
router.get('/emails', auth, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [emails, count] = await Promise.all([
      pool.query(`SELECT * FROM emails ORDER BY received_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*) FROM emails`)
    ]);

    return res.json({ total: parseInt(count.rows[0].count), page, limit, emails: emails.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch emails.' });
  }
});

// GET /api/emails/unread/count — get unread count
router.get('/emails/unread/count', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM emails WHERE is_read = FALSE`);
    return res.json({ unread: parseInt(result.rows[0].count) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get unread count.' });
  }
});

// GET /api/emails/:id
router.get('/emails/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM emails WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch email.' });
  }
});

// DELETE /api/emails/:id
router.delete('/emails/:id', auth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM emails WHERE id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete email.' });
  }
});

// PATCH /api/emails/:id/read — mark email as read
router.patch('/emails/:id/read', auth, async (req, res) => {
  try {
    await pool.query(`UPDATE emails SET is_read = TRUE WHERE id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

module.exports = router;
