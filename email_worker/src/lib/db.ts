import type { Registration } from '@/types';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getPendingEmailsData() {
  const res = await pool.query(`
    SELECT * FROM registrations
    WHERE email_status = 'pending' AND retry_count < 3
  `);
  return res.rows as Registration[];
}

export async function setFailedEmailStatus(id: number) {
  await pool.query(
    `
    UPDATE registrations
    SET email_status = 'failed', retry_count = retry_count + 1
    WHERE id = $1
  `,
    [id]
  );
}

export async function setSuccessEmailStatus(id: number) {
  await pool.query(
    `
    UPDATE registrations
    SET email_status = 'success'
    WHERE id = $1
  `,
    [id]
  );
}

export async function ensureSchema() {
  const schemaUrl = new URL('../db/schema.sql', import.meta.url);
  const sql = await Bun.file(schemaUrl).text();

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1, $2);', [42069, 1]);

    try {
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query('COMMIT;');
    } catch (e) {
      await client.query('ROLLBACK;');
      throw e;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1, $2);', [42069, 1]);
    }
  } finally {
    client.release();
  }
}

const ensureSchemaOnce = (() => {
  let p: Promise<void> | null = null;
  return () => (p ??= ensureSchema());
})();

await ensureSchemaOnce();
