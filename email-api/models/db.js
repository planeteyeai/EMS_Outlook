const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Railway PostgreSQL
});

// Create emails table and sent_emails table if they don't exist
const initDB = async () => {
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
