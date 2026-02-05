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
