import { Pool } from 'pg';

const TEST_DATABASE_URL =
  'postgresql://testuser:testpassword@localhost:5433/testdb';

export function createTestPool() {
  return new Pool({
    connectionString: TEST_DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
}

export async function ensureSchema(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
      id SERIAL PRIMARY KEY,
      admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NULL,
      replaced_by_token_id INTEGER NULL REFERENCES admin_refresh_tokens(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY,
      notification_email TEXT NOT NULL,
      updated_by_admin_user_id INTEGER NOT NULL REFERENCES admin_users(id),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      registration_message TEXT NULL,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NULL,
      email_status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export async function resetTables(pool: Pool) {
  await pool.query(`
    TRUNCATE TABLE
      admin_config,
      admin_refresh_tokens,
      admin_users,
      registrations
    RESTART IDENTITY CASCADE;
  `);
}

export async function dropSchema(pool: Pool) {
  await pool.query(`
    DROP TABLE IF EXISTS admin_config;
    DROP TABLE IF EXISTS admin_refresh_tokens;
    DROP TABLE IF EXISTS registrations;
    DROP TABLE IF EXISTS admin_users;
  `);
}

export async function closePool(pool: Pool) {
  await pool.end();
}

export async function acquireGlobalTestDbLock(pool: Pool) {
  const client = await pool.connect();
  await client.query('SELECT pg_advisory_lock(987654321);');
  return client;
}

export async function releaseGlobalTestDbLock(client: {
  query: (sql: string) => Promise<unknown>;
  release: () => void;
}) {
  await client.query('SELECT pg_advisory_unlock(987654321);');
  client.release();
}
