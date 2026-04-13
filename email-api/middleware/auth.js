// Simple API key auth for the GET /emails endpoint
// Developer must pass: Authorization: Bearer YOUR_SECRET_KEY
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
  }

  next();
};
