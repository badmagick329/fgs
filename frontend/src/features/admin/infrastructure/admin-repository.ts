import {
  AdminAuthUser,
  AdminConfigRow,
  AdminUser,
  AdminUserListRow,
  RefreshTokenRow,
} from '@/features/admin/domain/auth';
import {
  IAdminRepository,
  IAdminRepositoryTransaction,
} from '@/features/admin/domain/interfaces';
import { Pool, PoolClient } from 'pg';
import 'server-only';

type Queryable = Pool | PoolClient;

/** Advisory lock id that serialises first-admin setup. Arbitrary but fixed. */
const FIRST_ADMIN_LOCK_KEY = 727_001;

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

  async createFirstAdminUser(
    email: string,
    passwordHash: string
  ): Promise<AdminUser | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // NOT EXISTS alone races under READ COMMITTED: two callers can both see
      // an empty table. The lock serialises them, and the second caller's
      // INSERT then takes a fresh snapshot that sees the first admin.
      await client.query('SELECT pg_advisory_xact_lock($1)', [
        FIRST_ADMIN_LOCK_KEY,
      ]);
      const res = await client.query<AdminUser>(
        `INSERT INTO admin_users (email, password_hash, is_super_admin)
         SELECT $1, $2, TRUE
         WHERE NOT EXISTS (SELECT 1 FROM admin_users)
         RETURNING id, email, password_hash`,
        [email.toLowerCase(), passwordHash]
      );
      await client.query('COMMIT');
      return res.rows[0] ?? null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
              admin_config.registration_discord_notifications_enabled,
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
       RETURNING id, notification_email, registration_discord_notifications_enabled,
                 updated_by_admin_user_id, updated_at`,
      [notificationEmail.toLowerCase(), updatedByAdminUserId]
    );
    return res.rows[0];
  }

  async setRegistrationDiscordNotificationsEnabled(
    enabled: boolean,
    updatedByAdminUserId: number
  ): Promise<AdminConfigRow | null> {
    const res = await this.pool.query<AdminConfigRow>(
      `UPDATE admin_config
       SET registration_discord_notifications_enabled = $1,
           updated_by_admin_user_id = $2
       WHERE id = 1
       RETURNING id, notification_email, registration_discord_notifications_enabled,
                 updated_by_admin_user_id, updated_at`,
      [enabled, updatedByAdminUserId]
    );
    return res.rows[0] ?? null;
  }

  async getRefreshTokenByHash(
    tokenHash: string
  ): Promise<RefreshTokenRow | null> {
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
  ): Promise<RefreshTokenRow | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const newToken = await this.createRefreshTokenWithDb(
        client,
        adminUserId,
        newTokenHash,
        expiresAt
      );

      // The caller checked the old token before this transaction, so a
      // concurrent rotation may have revoked it since. The row lock makes the
      // loser wait for the winner's commit, then match nothing.
      const revoked = await client.query(
        `UPDATE admin_refresh_tokens
         SET revoked_at = NOW(), replaced_by_token_id = $1
         WHERE id = $2 AND revoked_at IS NULL
         RETURNING id`,
        [newToken.id, oldTokenId]
      );
      if ((revoked.rowCount ?? 0) === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('COMMIT');
      return newToken;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getLiveSessionTip(
    refreshTokenId: number
  ): Promise<RefreshTokenRow | null> {
    // Rotation is normal between when a token id was handed out and now, so
    // follow replaced_by to the newest token and judge the session by it.
    const res = await this.pool.query<RefreshTokenRow>(
      `WITH RECURSIVE chain AS (
         SELECT id, admin_user_id, token_hash, created_at, expires_at,
                revoked_at, replaced_by_token_id
         FROM admin_refresh_tokens
         WHERE id = $1
         UNION
         SELECT next.id, next.admin_user_id, next.token_hash, next.created_at,
                next.expires_at, next.revoked_at, next.replaced_by_token_id
         FROM admin_refresh_tokens next
         JOIN chain ON next.id = chain.replaced_by_token_id
       )
       SELECT chain.id, chain.admin_user_id, chain.token_hash, chain.created_at,
              chain.expires_at, chain.revoked_at, chain.replaced_by_token_id
       FROM chain
       JOIN admin_users ON admin_users.id = chain.admin_user_id
       WHERE chain.replaced_by_token_id IS NULL
         AND chain.revoked_at IS NULL
         AND chain.expires_at > NOW()`,
      [refreshTokenId]
    );
    return res.rows[0] ?? null;
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
