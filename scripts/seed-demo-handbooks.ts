import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  // Check if demo collection already exists
  const existing = await pool.query(
    `SELECT id FROM collections WHERE is_demo = true LIMIT 1`,
  );

  if (existing.rows[0]) {
    console.log(`Demo collection already exists: ${existing.rows[0].id}`);
    await pool.end();
    return;
  }

  // Create demo collection
  const result = await pool.query(
    `INSERT INTO collections (name, description, is_demo, user_id)
     VALUES ($1, $2, true, NULL)
     RETURNING id`,
    [
      'Sample Company Handbooks',
      'Pre-loaded public company handbooks for demo purposes. Try asking questions about remote work policies, employee benefits, or company culture!',
    ],
  );

  const collectionId = result.rows[0].id;
  console.log(`Created demo collection: ${collectionId}`);
  console.log('Upload handbook PDFs via the app to populate this collection.');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
