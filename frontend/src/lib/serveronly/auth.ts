import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { PoolClient } from 'pg';
import 'server-only';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 60);
const REFRESH_TOKEN_BYTES = Number(process.env.REFRESH_TOKEN_BYTES ?? 32);
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS ?? 20);

export const refreshTokenTtlDays = REFRESH_TOKEN_TTL_DAYS;

export type AdminUser = {
  id: number;
  email: string;
  password_hash: string;
};

export type AdminAuthUser = {
  id: number;
  email: string;
  is_super_admin: boolean;
};

export type AdminUserListRow = {
  id: number;
  email: string;
  created_at: Date;
  is_super_admin: boolean;
};

export type AdminConfigRow = {
  id: number;
  notification_email: string;
  updated_by_admin_user_id: number;
  updated_at: Date;
  updated_by_email: string;
};

export type RefreshTokenRow = {
  id: number;
  admin_user_id: number;
  token_hash: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_token_id: number | null;
};

export class AdminActionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminActionError';
    this.status = status;
  }
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

export async function getAdminById(id: number) {
  const res = await pool.query<AdminUser>(
    `SELECT id, email, password_hash FROM admin_users WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function getAdminAuthById(id: number, client?: PoolClient) {
  const db = client ?? pool;
  const res = await db.query<AdminAuthUser>(
    `SELECT id, email, is_super_admin FROM admin_users WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
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

export async function updateAdminPassword(id: number, password: string) {
  const passwordHash = await hashPassword(password);
  await pool.query(`UPDATE admin_users SET password_hash = $1 WHERE id = $2`, [
    passwordHash,
    id,
  ]);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateRefreshToken() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiresAt() {
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expires;
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

export async function getRefreshTokenByHash(tokenHash: string) {
  const res = await pool.query<RefreshTokenRow>(
    `SELECT id, admin_user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id
     FROM admin_refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  return res.rows[0] ?? null;
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

export async function deleteAdminUserById(adminId: number, client?: PoolClient) {
  const db = client ?? pool;
  const res = await db.query(`DELETE FROM admin_users WHERE id = $1`, [adminId]);
  return (res.rowCount ?? 0) > 0;
}

async function reassignAdminConfigUpdater(
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

async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
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

export async function updateAdminSuperStatusWithGuards({
  actingAdminId,
  targetAdminId,
  isSuperAdmin,
}: {
  actingAdminId: number;
  targetAdminId: number;
  isSuperAdmin: boolean;
}) {
  return withTransaction(async (client) => {
    const actingAdmin = await getAdminAuthById(actingAdminId, client);
    if (!actingAdmin) {
      throw new AdminActionError('Unauthorized.', 401);
    }
    if (!actingAdmin.is_super_admin) {
      throw new AdminActionError('Only super admins can change admin roles.', 403);
    }

    const targetAdmin = await getAdminAuthById(targetAdminId, client);
    if (!targetAdmin) {
      throw new AdminActionError('Admin not found.', 404);
    }

    if (targetAdmin.is_super_admin === isSuperAdmin) {
      return targetAdmin;
    }

    if (targetAdmin.is_super_admin && !isSuperAdmin) {
      const superAdminCount = await countSuperAdmins(client);
      if (superAdminCount <= 1) {
        throw new AdminActionError(
          'At least one super admin must remain.',
          409
        );
      }
    }

    await setAdminSuperStatus(targetAdminId, isSuperAdmin, client);
    const updatedTargetAdmin = await getAdminAuthById(targetAdminId, client);
    if (!updatedTargetAdmin) {
      throw new AdminActionError('Admin not found.', 404);
    }
    return updatedTargetAdmin;
  });
}

export async function removeAdminUserWithGuards({
  actingAdminId,
  targetAdminId,
}: {
  actingAdminId: number;
  targetAdminId: number;
}) {
  return withTransaction(async (client) => {
    const actingAdmin = await getAdminAuthById(actingAdminId, client);
    if (!actingAdmin) {
      throw new AdminActionError('Unauthorized.', 401);
    }
    if (!actingAdmin.is_super_admin) {
      throw new AdminActionError('Only super admins can remove admins.', 403);
    }
    if (actingAdmin.id === targetAdminId) {
      throw new AdminActionError('You cannot remove your own account.', 400);
    }

    const targetAdmin = await getAdminAuthById(targetAdminId, client);
    if (!targetAdmin) {
      throw new AdminActionError('Admin not found.', 404);
    }
    if (targetAdmin.is_super_admin) {
      const superAdminCount = await countSuperAdmins(client);
      if (superAdminCount <= 1) {
        throw new AdminActionError(
          'At least one super admin must remain.',
          409
        );
      }
    }

    await reassignAdminConfigUpdater(targetAdminId, actingAdminId, client);
    await deleteAdminUserById(targetAdminId, client);
  });
}

export async function revokeRefreshToken(id: number, client?: PoolClient) {
  const db = client ?? pool;
  await db.query(
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
