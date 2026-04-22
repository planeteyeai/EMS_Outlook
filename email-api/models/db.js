const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  // Inbox emails table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id          SERIAL PRIMARY KEY,
      subject     TEXT DEFAULT '(No Subject)',
      "from"      TEXT NOT NULL,
      "to"        TEXT DEFAULT '',
      body        TEXT DEFAULT '',
      is_read     BOOLEAN DEFAULT FALSE,
      received_at TIMESTAMPTZ DEFAULT NOW(),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Sent emails table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id         SERIAL PRIMARY KEY,
      "to"       TEXT NOT NULL,
      subject    TEXT DEFAULT '(No Subject)',
      body       TEXT DEFAULT '',
      sent_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Add is_read column if it doesn't exist (migration)
  await pool.query(`ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);

  console.log('Database ready.');
};

module.exports = { pool, initDB };
