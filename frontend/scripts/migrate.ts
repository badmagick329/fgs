import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

const MIGRATIONS_TABLE = 'schema_migrations';

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  return databaseUrl;
}

async function ensureMigrationsTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getMigrationFiles(migrationsDir: string) {
  const entries = await readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function getAppliedMigrations(pool: Pool) {
  const res = await pool.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY filename ASC`
  );

  return new Set(res.rows.map((row) => row.filename));
}

async function applyMigration(
  pool: Pool,
  migrationPath: string,
  filename: string
) {
  const sql = await Bun.file(migrationPath).text();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
      [filename]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  try {
    const migrationsDir = path.resolve(process.cwd(), 'migrations');

    await ensureMigrationsTable(pool);

    const [files, applied] = await Promise.all([
      getMigrationFiles(migrationsDir),
      getAppliedMigrations(pool),
    ]);

    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const filename of pending) {
      const migrationPath = path.join(migrationsDir, filename);
      console.log(`Applying ${filename}...`);
      await applyMigration(pool, migrationPath, filename);
      console.log(`Applied ${filename}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
