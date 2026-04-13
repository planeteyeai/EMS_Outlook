const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Railway PostgreSQL
});

// Create emails table if it doesn't exist
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
  console.log('Database ready.');
};

module.exports = { pool, initDB };
