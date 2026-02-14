import {
  Registration,
  registrationListSchema,
  registrationSchema,
} from '@/types';
import { AdminUser } from '@/types/auth';
import { AdminAuthUser } from '@/types/auth';
import { AdminUserListRow } from '@/types/auth';
import { AdminConfigRow } from '@/types/auth';
import { RefreshTokenRow } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { Pool, PoolClient } from 'pg';
import 'server-only';
import { Result, errorsFromZod } from '@/lib/result';

const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS ?? 20);

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

export async function revokeRefreshToken(id: number) {
  await pool.query(
    `UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function revokeAllRefreshTokensForUser(
  adminUserId: number,
  client?: PoolClient
) {
  const db = client ?? pool;
  await db.query(
    `UPDATE admin_refresh_tokens
     SET revoked_at = NOW()
     WHERE admin_user_id = $1 AND revoked_at IS NULL`,
    [adminUserId]
  );
}

export async function rotateRefreshToken(
  oldTokenId: number,
  adminUserId: number,
  newTokenHash: string,
  expiresAt: Date
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newToken = await createRefreshToken(
      adminUserId,
      newTokenHash,
      expiresAt,
      client
    );
    await client.query(
      `UPDATE admin_refresh_tokens
       SET revoked_at = NOW(), replaced_by_token_id = $1
       WHERE id = $2`,
      [newToken.id, oldTokenId]
    );
    await client.query('COMMIT');
    return newToken;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAdminConfig() {
  const res = await pool.query<AdminConfigRow>(
    `SELECT admin_config.id,
            admin_config.notification_email,
            admin_config.updated_by_admin_user_id,
            admin_config.updated_at,
            admin_users.email as updated_by_email
     FROM admin_config
     JOIN admin_users ON admin_users.id = admin_config.updated_by_admin_user_id
     WHERE admin_config.id = 1`
  );
  return res.rows[0] ?? null;
}

export async function upsertAdminConfig(
  notificationEmail: string,
  updatedByAdminUserId: number
) {
  const res = await pool.query<AdminConfigRow>(
    `INSERT INTO admin_config (id, notification_email, updated_by_admin_user_id)
     VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE
       SET notification_email = EXCLUDED.notification_email,
           updated_by_admin_user_id = EXCLUDED.updated_by_admin_user_id
     RETURNING id, notification_email, updated_by_admin_user_id, updated_at`,
    [notificationEmail.toLowerCase(), updatedByAdminUserId]
  );
  return res.rows[0];
}

export async function reassignAdminConfigUpdater(
  fromAdminId: number,
  toAdminId: number,
  client: PoolClient
) {
  await client.query(
    `UPDATE admin_config
     SET updated_by_admin_user_id = $1
     WHERE updated_by_admin_user_id = $2`,
    [toAdminId, fromAdminId]
  );
}

export async function deleteAdminUserById(
  adminId: number,
  client?: PoolClient
) {
  const db = client ?? pool;
  const res = await db.query(`DELETE FROM admin_users WHERE id = $1`, [
    adminId,
  ]);
  return (res.rowCount ?? 0) > 0;
}
export async function countSuperAdmins(client?: PoolClient) {
  const db = client ?? pool;
  const res = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text as count
     FROM admin_users
     WHERE is_super_admin = TRUE`
  );
  return Number(res.rows[0]?.count ?? 0);
}

export async function setAdminSuperStatus(
  adminId: number,
  isSuperAdmin: boolean,
  client?: PoolClient
) {
  const db = client ?? pool;
  const res = await db.query(
    `UPDATE admin_users
     SET is_super_admin = $1
     WHERE id = $2`,
    [isSuperAdmin, adminId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function listAdminUsers(client?: PoolClient) {
  const db = client ?? pool;
  const res = await db.query<AdminUserListRow>(
    `SELECT id, email, created_at, is_super_admin
     FROM admin_users
     ORDER BY created_at ASC, id ASC`
  );
  return res.rows;
}
export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getRefreshTokenByHash(tokenHash: string) {
  const res = await pool.query<RefreshTokenRow>(
    `SELECT id, admin_user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id
     FROM admin_refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  return res.rows[0] ?? null;
}

export async function createRefreshToken(
  adminUserId: number,
  tokenHash: string,
  expiresAt: Date,
  client?: PoolClient
) {
  const db = client ?? pool;
  const res = await db.query<RefreshTokenRow>(
    `INSERT INTO admin_refresh_tokens
      (admin_user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, admin_user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id`,
    [adminUserId, tokenHash, expiresAt]
  );
  return res.rows[0];
}

export async function createAdminUser(
  email: string,
  password: string,
  isSuperAdmin = false
) {
  const passwordHash = await hashPassword(password);
  const res = await pool.query<AdminUser>(
    `INSERT INTO admin_users (email, password_hash, is_super_admin)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash`,
    [email.toLowerCase(), passwordHash, isSuperAdmin]
  );
  return res.rows[0];
}

export async function getAdminAuthById(id: number, client?: PoolClient) {
  const db = client ?? pool;
  const res = await db.query<AdminAuthUser>(
    `SELECT id, email, is_super_admin FROM admin_users WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function updateAdminPassword(id: number, password: string) {
  const passwordHash = await hashPassword(password);
  await pool.query(`UPDATE admin_users SET password_hash = $1 WHERE id = $2`, [
    passwordHash,
    id,
  ]);
}

export async function getAdminById(id: number) {
  const res = await pool.query<AdminUser>(
    `SELECT id, email, password_hash FROM admin_users WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function countAdmins() {
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM admin_users`
  );
  return Number(res.rows[0]?.count ?? 0);
}

export async function getAdminByEmail(email: string) {
  const res = await pool.query<AdminUser>(
    `SELECT id, email, password_hash FROM admin_users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return res.rows[0] ?? null;
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}
