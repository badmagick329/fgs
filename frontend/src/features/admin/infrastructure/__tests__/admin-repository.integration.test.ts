import { IAdminRepositoryTransaction } from '@/features/admin/domain/interfaces';
import {
  acquireGlobalTestDbLock,
  closePool,
  createTestPool,
  ensureSchema,
  releaseGlobalTestDbLock,
  resetTables,
} from '@/test/db-test-utils';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';
import { PoolClient } from 'pg';

mock.module('server-only', () => ({}));

describe('AdminRepository integration', () => {
  const pool = createTestPool();
  let repo: any;
  let lockClient: PoolClient;
  const isLive = async (adminId: number, sessionId: number) =>
    (await repo.getLiveSessionTip(sessionId))?.admin_user_id === adminId;

  beforeAll(async () => {
    const { AdminRepository } =
      await import('@/features/admin/infrastructure/admin-repository');
    repo = new AdminRepository(pool);
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  it('creates and fetches admins', async () => {
    const created = await repo.createAdminUser(
      'Admin@Example.com',
      'hash',
      true
    );

    const byEmail = await repo.getAdminByEmail('admin@example.com');
    const count = await repo.countAdmins();

    expect(created.email).toBe('admin@example.com');
    expect(byEmail?.id).toBe(created.id);
    expect(count).toBe(1);
  });

  it('upserts and reads admin config', async () => {
    const admin = await repo.createAdminUser('admin@example.com', 'hash', true);

    await repo.upsertAdminConfig('Notify@Example.com', admin.id);
    const config = await repo.getAdminConfig();

    expect(config?.notification_email).toBe('notify@example.com');
    expect(config?.registration_discord_notifications_enabled).toBeFalse();
    expect(config?.updated_by_email).toBe('admin@example.com');

    await repo.setRegistrationDiscordNotificationsEnabled(true, admin.id);
    const updatedConfig = await repo.getAdminConfig();
    expect(
      updatedConfig?.registration_discord_notifications_enabled
    ).toBeTrue();
  });

  it('creates, rotates and revokes refresh tokens', async () => {
    const admin = await repo.createAdminUser('admin@example.com', 'hash', true);

    const token = await repo.createRefreshToken(
      admin.id,
      'hash-1',
      new Date(Date.now() + 1000 * 60)
    );
    const found = await repo.getRefreshTokenByHash('hash-1');

    expect(found?.id).toBe(token.id);

    const rotated = await repo.rotateRefreshToken(
      token.id,
      admin.id,
      'hash-2',
      new Date(Date.now() + 1000 * 60)
    );

    expect(rotated.token_hash).toBe('hash-2');
    // Rotating an already-rotated token is refused.
    expect(
      await repo.rotateRefreshToken(
        token.id,
        admin.id,
        'hash-3',
        new Date(Date.now() + 1000 * 60)
      )
    ).toBeNull();

    await repo.revokeRefreshToken(rotated.id);
    const revoked = await repo.getRefreshTokenByHash('hash-2');
    expect(revoked?.revoked_at).toBeDefined();

    await repo.revokeAllRefreshTokensForUser(admin.id);
  });

  it('creates exactly one first admin under concurrent setup', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        repo.createFirstAdminUser(`admin${i}@example.com`, 'hash')
      )
    );

    expect(results.filter((admin) => admin !== null)).toHaveLength(1);
    expect(await repo.countAdmins()).toBe(1);
    expect(await repo.countSuperAdmins()).toBe(1);
    expect(
      await repo.createFirstAdminUser('late@example.com', 'hash')
    ).toBeNull();
  });

  it('lets only one of two concurrent rotations of a token win', async () => {
    const admin = await repo.createAdminUser('admin@example.com', 'hash', true);
    const parent = await repo.createRefreshToken(
      admin.id,
      'parent-hash',
      new Date(Date.now() + 1000 * 60)
    );

    const results = await Promise.all([
      repo.rotateRefreshToken(
        parent.id,
        admin.id,
        'child-a',
        new Date(Date.now() + 1000 * 60)
      ),
      repo.rotateRefreshToken(
        parent.id,
        admin.id,
        'child-b',
        new Date(Date.now() + 1000 * 60)
      ),
    ]);

    const winners = results.filter((row) => row !== null);
    expect(winners).toHaveLength(1);
    const rows = await pool.query(
      `SELECT id FROM admin_refresh_tokens WHERE admin_user_id = $1`,
      [admin.id]
    );
    // The loser's child insert was rolled back.
    expect(rows.rowCount).toBe(2);
    const reloadedParent = await repo.getRefreshTokenByHash('parent-hash');
    expect(reloadedParent?.replaced_by_token_id).toBe(winners[0].id);
  });

  it('tracks session liveness across rotation, logout and admin removal', async () => {
    const admin = await repo.createAdminUser('admin@example.com', 'hash', true);
    const first = await repo.createRefreshToken(
      admin.id,
      'hash-1',
      new Date(Date.now() + 1000 * 60)
    );
    expect(await isLive(admin.id, first.id)).toBeTrue();
    // A session id is only valid for its own admin.
    expect(await isLive(admin.id + 1, first.id)).toBeFalse();

    const second = await repo.rotateRefreshToken(
      first.id,
      admin.id,
      'hash-2',
      new Date(Date.now() + 1000 * 60)
    );
    // An access token signed before the rotation still belongs to a live session.
    expect(await isLive(admin.id, first.id)).toBeTrue();

    // Logout revokes the newest token; every access token of the session dies.
    await repo.revokeRefreshToken(second.id);
    expect(await isLive(admin.id, first.id)).toBeFalse();
    expect(await isLive(admin.id, second.id)).toBeFalse();

    // Password change revokes every token.
    const other = await repo.createRefreshToken(
      admin.id,
      'hash-3',
      new Date(Date.now() + 1000 * 60)
    );
    await repo.revokeAllRefreshTokensForUser(admin.id);
    expect(await isLive(admin.id, other.id)).toBeFalse();

    const expired = await repo.createRefreshToken(
      admin.id,
      'hash-4',
      new Date(Date.now() - 1000)
    );
    expect(await isLive(admin.id, expired.id)).toBeFalse();

    const live = await repo.createRefreshToken(
      admin.id,
      'hash-5',
      new Date(Date.now() + 1000 * 60)
    );
    await repo.deleteAdminUserById(admin.id);
    expect(await isLive(admin.id, live.id)).toBeFalse();
  });

  it('commits and rolls back withTransaction', async () => {
    const admin = await repo.createAdminUser('admin@example.com', 'hash', true);

    await repo.withTransaction(async (tx: IAdminRepositoryTransaction) => {
      await tx.setAdminSuperStatus(admin.id, false);
      return null;
    });

    const updated = await repo.getAdminAuthById(admin.id);
    expect(updated?.is_super_admin).toBeFalse();

    let rolledBackByError = false;
    try {
      await repo.withTransaction(async (tx: IAdminRepositoryTransaction) => {
        await tx.setAdminSuperStatus(admin.id, true);
        throw new Error('force rollback');
      });
    } catch {
      rolledBackByError = true;
    }
    expect(rolledBackByError).toBeTrue();

    const rolledBack = await repo.getAdminAuthById(admin.id);
    expect(rolledBack?.is_super_admin).toBeFalse();
  });
});
