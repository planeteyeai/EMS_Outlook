const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Log the host portion only (never log credentials)
try {
  const { hostname, port, pathname } = new URL(dbUrl);
  console.log(`DB config → host: ${hostname}, port: ${port}, db: ${pathname}`);
} catch {
  console.error('FATAL: DATABASE_URL is not a valid URL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
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

const initDBWithRetry = async (retries = 10, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await initDB();
      return;
    } catch (err) {
      console.error(`DB init attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
};

module.exports = { pool, initDB, initDBWithRetry };
