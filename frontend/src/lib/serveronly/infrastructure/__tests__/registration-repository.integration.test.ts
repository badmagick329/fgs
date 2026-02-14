import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { PoolClient } from 'pg';
import {
  acquireGlobalTestDbLock,
  closePool,
  createTestPool,
  ensureSchema,
  releaseGlobalTestDbLock,
  resetTables,
} from '@/test/db-test-utils';

mock.module('server-only', () => ({}));

describe('RegistrationRepository integration', () => {
  const pool = createTestPool();
  let repo: any;
  let lockClient: PoolClient;

  beforeAll(async () => {
    const { RegistrationRepository } = await import(
      '@/lib/serveronly/infrastructure/registration-repository'
    );
    repo = new RegistrationRepository(pool);
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

  it('creates registration and lists registrations', async () => {
    const create = await repo.createRegistration({
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
    });
    expect(create.ok).toBeTrue();

    const list = await repo.getRegistrations();
    expect(list.ok).toBeTrue();
    if (list.ok) expect(list.data.length).toBe(1);
  });

  it('returns parse errors when row shape invalid', async () => {
    await pool.query(`
      INSERT INTO registrations (
        first_name,
        last_name,
        email,
        registered_at,
        email_status,
        retry_count
      ) VALUES ('A', 'B', 'invalid-email', NOW(), 'pending', 0)
    `);

    const list = await repo.getRegistrations();
    expect(list.ok).toBeFalse();
  });
});
