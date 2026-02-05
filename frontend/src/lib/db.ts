import {
  Registration,
  registrationListSchema,
  registrationSchema,
} from '@/types';
import { Pool } from 'pg';
import { Result, errorsFromZod } from '@/lib/result';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getRegistrations(): Promise<Result<Registration[]>> {
  const res = await pool.query(`SELECT * from registrations`);
  const parsed = registrationListSchema.safeParse(res.rows);
  if (!parsed.success) {
    console.error('getRegistrations validation error', parsed.error);
    return {
      ok: false,
      message: 'There was an error fetching the data.',
      errors: errorsFromZod(parsed.error),
    };
  }

  return { ok: true, data: parsed.data };
}

export async function createRegistration({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<Result<Registration>> {
  const res = await pool.query(
    `
    INSERT INTO registrations (first_name, last_name, email)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [firstName, lastName, email]
  );
  const parsed = registrationSchema.safeParse(res.rows[0]);
  if (!parsed.success) {
    console.error('createRegistration validation error', parsed.error);
    return {
      ok: false,
      message: `There was an error creating registration with data: ${JSON.stringify({ firstName, lastName, email })}`,
      errors: errorsFromZod(parsed.error),
    };
  }
  return { ok: true, data: parsed.data };
}
