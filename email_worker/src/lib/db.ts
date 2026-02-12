import type { EMAIL_STATUS, IdResult, Registration } from '@/types';
import type { Result } from '@/types/result';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getPendingEmailsData(): Promise<
  Result<Registration[], string>
> {
  try {
    const res = await pool.query<Registration>(`
    SELECT * FROM registrations
    WHERE email_status != 'success' AND retry_count < 3
  `);
    if (res.rowCount != null && res.rowCount > 0) {
      return { ok: true, data: res.rows };
    }
    return { ok: false, error: 'No rows returned' };
  } catch (err: any) {
    console.error('getPendingEmailsData DB Error:', err);
    return {
      ok: false,
      error: `Database error: ${err.message}`,
    };
  }
}

export async function setFailedEmailStatus(
  id: number
): Promise<
  Result<{ message: string; id: number }, { message: string; id: number }>
> {
  try {
    const res = await pool.query<IdResult>(
      `
    UPDATE registrations
    SET email_status = 'failed', retry_count = retry_count + 1
    WHERE id = $1
    RETURNING id
  `,
      [id]
    );
    const [updatedRow] = res.rows;
    if (updatedRow) {
      return {
        ok: true,
        data: { message: 'Email status set to "failed"', id: updatedRow.id },
      };
    }
    return {
      ok: false,
      error: { message: 'Email status not set to "failed"', id: id },
    };
  } catch (err: any) {
    console.error('setFailedEmailStatus DB Error:', err);
    return {
      ok: false,
      error: { message: `Database error: ${err.message}`, id: id },
    };
  }
}

export async function setSuccessEmailStatus(
  id: number
): Promise<
  Result<{ message: string; id: number }, { message: string; id: number }>
> {
  try {
    const res = await pool.query<IdResult>(
      `
    UPDATE registrations
    SET email_status = 'success'
    WHERE id = $1
    RETURNING id
  `,
      [id]
    );
    const [updatedRow] = res.rows;
    if (updatedRow) {
      return {
        ok: true,
        data: { message: 'Email status set to "success"', id: updatedRow.id },
      };
    }
    return {
      ok: false,
      error: { message: 'Email status not set to "success"', id: id },
    };
  } catch (err: any) {
    console.error('setSuccessEmailStatus DB Error:', err);
    return {
      ok: false,
      error: { message: `Database error: ${err.message}`, id: id },
    };
  }
}

export async function setEmailStatuses(
  email_data: Registration[],
  email_status: EMAIL_STATUS
): Promise<
  Result<{ message: string; ids: number[] }, { message: string; ids: number[] }>
> {
  const ids = email_data.map((data) => data.id);
  if (ids.length === 0) {
    return { ok: false, error: { message: 'Number of ids is 0', ids: [] } };
  }

  try {
    const res = await pool.query<IdResult>(
      `
    UPDATE registrations
    SET email_status = $1
    WHERE id = ANY($2::int[])
    RETURNING id
  `,
      [email_status, ids]
    );
    const returnedIds: number[] = res.rows.map((row) => row.id);
    if (res.rowCount != null && res.rowCount > 0) {
      return {
        ok: true,
        data: {
          message: `Number of rows updated to ${email_status} is ${res.rowCount}`,
          ids: returnedIds,
        },
      };
    }
    return {
      ok: false,
      error: {
        message: `${email_status} failed to apply, attempted ${ids.length} rows (Matched 0)`,
        ids: ids,
      },
    };
  } catch (err: any) {
    console.error('setEmailStatuses DB Error:', err);
    return {
      ok: false,
      error: { message: `Database error: ${err.message}`, ids: ids },
    };
  }
}

export async function setRetryCount(
  email_data: Registration[]
): Promise<
  Result<{ message: string; ids: number[] }, { message: string; ids: number[] }>
> {
  const ids = email_data.map((data) => data.id);
  if (ids.length === 0) {
    return { ok: false, error: { message: 'Number of ids is 0', ids: [] } };
  }

  try {
    const res = await pool.query<IdResult>(
      `
    UPDATE registrations 
    SET retry_count = retry_count + 1 
    WHERE id = ANY($1::int[]) 
      AND retry_count < 3
    RETURNING id
  `,
      [ids]
    );
    const returnedIds: number[] = res.rows.map((row) => row.id);
    if (res.rowCount != null && res.rowCount > 0) {
      return {
        ok: true,
        data: {
          message: `Number of rows which incremented retry_count is ${res.rowCount}`,
          ids: returnedIds,
        },
      };
    }
    return {
      ok: false,
      error: {
        message: `Incrementing retry_count failed, attempted to change ${ids.length} rows (Matched 0)`,
        ids: ids,
      },
    };
  } catch (err: any) {
    console.error('setRetryCount DB Error:', err);
    return {
      ok: false,
      error: { message: `Database error: ${err.message}`, ids: ids },
    };
  }
}

//
//
//  make helper function for getting ids (return ok: true for greater than 0 ids) and for checking for empty result
//
//

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
