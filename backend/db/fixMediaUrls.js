/**
 * One-off repair for messages sent BEFORE the mediaUrl bug fix in
 * controllers/sendMediaMessage.js. Those rows have an absolute
 * filesystem path stored in media_url (e.g.
 * "C:\Users\...\backend\uploads\media\images\7-169....jpg") instead of
 * a URL path, so they'll never render. This rewrites them to
 * "/uploads/media/<folder>/<filename>" by taking everything from the
 * "uploads" segment onward.
 *
 * Safe to run more than once — rows that already look like a proper
 * "/uploads/..." path are left untouched.
 *
 * Usage: node db/fixMediaUrls.js
 */
const pool = require('./db');

async function run() {
  const { rows } = await pool.query(
    `SELECT message_id, media_url FROM messages WHERE media_url IS NOT NULL`
  );

  let fixed = 0;
  for (const row of rows) {
    const original = row.media_url;
    if (!original || original.startsWith('/uploads/')) continue;

    const normalized = original.replace(/\\/g, '/');
    const marker = '/uploads/';
    const idx = normalized.toLowerCase().indexOf(marker);
    if (idx === -1) {
      console.warn(`  skipping message ${row.message_id}: couldn't locate "uploads/" in "${original}"`);
      continue;
    }

    const newUrl = normalized.slice(idx);
    await pool.query(`UPDATE messages SET media_url = $1 WHERE message_id = $2`, [
      newUrl,
      row.message_id,
    ]);
    fixed += 1;
    console.log(`  message ${row.message_id}: "${original}" -> "${newUrl}"`);
  }

  console.log(`Done. Fixed ${fixed} of ${rows.length} media row(s).`);
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
