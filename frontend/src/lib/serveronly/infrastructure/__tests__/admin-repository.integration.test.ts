import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { PoolClient } from 'pg';
import { IAdminRepositoryTransaction } from '@/lib/serveronly/domain/interfaces';
import {
  acquireGlobalTestDbLock,
  closePool,
  createTestPool,
  ensureSchema,
  releaseGlobalTestDbLock,
  resetTables,
} from '@/test/db-test-utils';

mock.module('server-only', () => ({}));

describe('AdminRepository integration', () => {
  const pool = createTestPool();
  let repo: any;
  let lockClient: PoolClient;

  beforeAll(async () => {
    const { AdminRepository } = await import(
      '@/lib/serveronly/infrastructure/admin-repository'
    );
    repo = new AdminRepository(pool);
    lockClient = await acquireGlobalTestDbLock(pool) as PoolClient;
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
    const created = await repo.createAdminUser('Admin@Example.com', 'hash', true);

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
    expect(config?.updated_by_email).toBe('admin@example.com');
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

    await repo.revokeRefreshToken(rotated.id);
    const revoked = await repo.getRefreshTokenByHash('hash-2');
    expect(revoked?.revoked_at).toBeDefined();

    await repo.revokeAllRefreshTokensForUser(admin.id);
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
