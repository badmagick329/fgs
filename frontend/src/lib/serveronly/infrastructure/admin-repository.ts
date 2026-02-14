import { Pool, PoolClient } from 'pg';
import 'server-only';
import {
  AdminAuthUser,
  AdminConfigRow,
  AdminUser,
  AdminUserListRow,
  RefreshTokenRow,
} from '@/types/auth';
import {
  IAdminRepository,
  IAdminRepositoryTransaction,
} from '@/lib/serveronly/domain/interfaces';

type Queryable = Pool | PoolClient;

class PgAdminTransactionRepository implements IAdminRepositoryTransaction {
  constructor(private readonly client: PoolClient) {}

  async getAdminAuthById(id: number): Promise<AdminAuthUser | null> {
    const res = await this.client.query<AdminAuthUser>(
      `SELECT id, email, is_super_admin FROM admin_users WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  }

  async countSuperAdmins(): Promise<number> {
    const res = await this.client.query<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM admin_users
       WHERE is_super_admin = TRUE`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  async setAdminSuperStatus(
    adminId: number,
    isSuperAdmin: boolean
  ): Promise<boolean> {
    const res = await this.client.query(
      `UPDATE admin_users
       SET is_super_admin = $1
       WHERE id = $2`,
      [isSuperAdmin, adminId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async reassignAdminConfigUpdater(
    fromAdminId: number,
    toAdminId: number
  ): Promise<void> {
    await this.client.query(
      `UPDATE admin_config
       SET updated_by_admin_user_id = $1
       WHERE updated_by_admin_user_id = $2`,
      [toAdminId, fromAdminId]
    );
  }

  async deleteAdminUserById(adminId: number): Promise<boolean> {
    const res = await this.client.query(
      `DELETE FROM admin_users WHERE id = $1`,
      [adminId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export class AdminRepository implements IAdminRepository {
  constructor(private readonly pool: Pool) {}

  async countAdmins(): Promise<number> {
    const res = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM admin_users`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  async createAdminUser(
    email: string,
    passwordHash: string,
    isSuperAdmin = false
  ): Promise<AdminUser> {
    const res = await this.pool.query<AdminUser>(
      `INSERT INTO admin_users (email, password_hash, is_super_admin)
       VALUES ($1, $2, $3)
       RETURNING id, email, password_hash`,
      [email.toLowerCase(), passwordHash, isSuperAdmin]
    );
    return res.rows[0];
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const res = await this.pool.query<AdminUser>(
      `SELECT id, email, password_hash FROM admin_users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return res.rows[0] ?? null;
  }

  async getAdminById(id: number): Promise<AdminUser | null> {
    const res = await this.pool.query<AdminUser>(
      `SELECT id, email, password_hash FROM admin_users WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  }

  async getAdminAuthById(id: number): Promise<AdminAuthUser | null> {
    const res = await this.pool.query<AdminAuthUser>(
      `SELECT id, email, is_super_admin FROM admin_users WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE admin_users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, id]
    );
  }

  async listAdminUsers(): Promise<AdminUserListRow[]> {
    const res = await this.pool.query<AdminUserListRow>(
      `SELECT id, email, created_at, is_super_admin
       FROM admin_users
       ORDER BY created_at ASC, id ASC`
    );
    return res.rows;
  }

  async countSuperAdmins(): Promise<number> {
    const res = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM admin_users
       WHERE is_super_admin = TRUE`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  async setAdminSuperStatus(
    adminId: number,
    isSuperAdmin: boolean
  ): Promise<boolean> {
    const res = await this.pool.query(
      `UPDATE admin_users
       SET is_super_admin = $1
       WHERE id = $2`,
      [isSuperAdmin, adminId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async deleteAdminUserById(adminId: number): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM admin_users WHERE id = $1`, [
      adminId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }

  async reassignAdminConfigUpdater(
    fromAdminId: number,
    toAdminId: number
  ): Promise<void> {
    await this.pool.query(
      `UPDATE admin_config
       SET updated_by_admin_user_id = $1
       WHERE updated_by_admin_user_id = $2`,
      [toAdminId, fromAdminId]
    );
  }

  async getAdminConfig(): Promise<AdminConfigRow | null> {
    const res = await this.pool.query<AdminConfigRow>(
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

  async upsertAdminConfig(
    notificationEmail: string,
    updatedByAdminUserId: number
  ): Promise<AdminConfigRow> {
    const res = await this.pool.query<AdminConfigRow>(
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

  async getRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const res = await this.pool.query<RefreshTokenRow>(
      `SELECT id, admin_user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id
       FROM admin_refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );
    return res.rows[0] ?? null;
  }

  async createRefreshToken(
    adminUserId: number,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow> {
    const res = await this.pool.query<RefreshTokenRow>(
      `INSERT INTO admin_refresh_tokens
        (admin_user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, admin_user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id`,
      [adminUserId, tokenHash, expiresAt]
    );
    return res.rows[0];
  }

  async rotateRefreshToken(
    oldTokenId: number,
    adminUserId: number,
    newTokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const newToken = await this.createRefreshTokenWithDb(
        client,
        adminUserId,
        newTokenHash,
        expiresAt
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

  async revokeRefreshToken(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async revokeAllRefreshTokensForUser(adminUserId: number): Promise<void> {
    await this.pool.query(
      `UPDATE admin_refresh_tokens
       SET revoked_at = NOW()
       WHERE admin_user_id = $1 AND revoked_at IS NULL`,
      [adminUserId]
    );
  }

  async withTransaction<T>(
    work: (tx: IAdminRepositoryTransaction) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txRepo = new PgAdminTransactionRepository(client);
      const result = await work(txRepo);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async createRefreshTokenWithDb(
    db: Queryable,
    adminUserId: number,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow> {
    const res = await db.query<RefreshTokenRow>(
      `INSERT INTO admin_refresh_tokens
        (admin_user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, admin_user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id`,
      [adminUserId, tokenHash, expiresAt]
    );
    return res.rows[0];
  }
}

