/**
 * Runs the SQL files in db/migrations, in filename order, against the
 * same database the app already connects to (reuses db/db.js's pool /
 * .env credentials — nothing new to configure).
 *
 * Usage:
 *   node db/migrate.js
 *
 * Each file is wrapped in its own transaction; if one fails, the script
 * stops there and reports which file/line failed so it's easy to fix and
 * re-run (already-applied ADD COLUMN IF NOT EXISTS statements are
 * harmless to run again).
 */
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function run() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found in db/migrations.');
    process.exit(0);
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const client = await pool.connect();
    try {
      console.log(`Applying ${file}...`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`  done.`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  failed: ${err.message}`);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

run();
