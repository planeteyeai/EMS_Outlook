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

  console.log('Database ready.');
};

module.exports = { pool, initDB };
