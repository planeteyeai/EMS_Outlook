const express = require('express');
const router  = express.Router();
const sgMail  = require('@sendgrid/mail');
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
      from: process.env.SMTP_EMAIL, // verified sender
      subject,
      text: body
    });

    return res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error('SendGrid error:', err.message);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
});

module.exports = router;
