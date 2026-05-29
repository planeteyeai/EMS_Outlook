require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const { initDBWithRetry }  = require('./models/db');
const authRoutes  = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const sendRoutes  = require('./routes/send');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Outlook Email API is running.' });
});

app.use('/api', authRoutes);
app.use('/api', emailRoutes);
app.use('/api', sendRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

initDBWithRetry()
  .then(() => console.log('DB ready.'))
  .catch(err => { console.error('DB init failed after retries:', err.message); process.exit(1); });
