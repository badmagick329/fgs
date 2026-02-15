import type { IdResult, Registration, Result } from '@/domain';
import type {
  IUserRepository,
  Logger,
  LoggerFactory,
} from '@/domain/interfaces';
import { Pool } from 'pg';

export class DB implements IUserRepository {
  private static schemaInitByConnection = new Map<string, Promise<void>>();
  private readonly pool: Pool;
  private readonly connectionString: string;
  private readonly log: Logger;

  static async initializeSchema(
    connectionString: string,
    log: Logger
  ): Promise<void> {
    log.info('Initializing database schema...');
    const init =
      this.schemaInitByConnection.get(connectionString) ??
      ensureSchema(connectionString);
    this.schemaInitByConnection.set(connectionString, init);
    await init;
    log.info('Database schema initialization complete.');
  }

  static async create(
    connectionString: string,
    loggerFactory: LoggerFactory
  ): Promise<DB> {
    const log = loggerFactory('DB');
    await this.initializeSchema(connectionString, log);
    return new DB(connectionString, log);
  }

  constructor(connectionString: string, log: Logger) {
    this.log = log;
    this.connectionString = connectionString;
    this.pool = new Pool({
      connectionString: this.connectionString,
    });
  }

  async query(queryString: string, params?: any[]) {
    return this.pool.query(queryString, params);
  }

  async close() {
    await this.pool.end();
  }

  async getPending(): Promise<Result<Registration[], string>> {
    try {
      const res = await this.pool.query<Registration>(`
    SELECT * FROM registrations
    WHERE email_status != 'success' AND retry_count < 3
    ORDER BY registered_at ASC, id ASC
  `);
      if (res.rowCount != null) {
        return { ok: true, data: res.rows };
      }
      return { ok: false, error: 'No rows returned' };
    } catch (err: any) {
      this.log.error('getPendingNotificationData DB Error:', err);
      return {
        ok: false,
        error: `Database error: ${err.message}`,
      };
    }
  }

  async setFailedStatus(
    ids: number[]
  ): Promise<
    Result<
      { message: string; ids: number[] },
      { message: string; ids: number[] }
    >
  > {
    try {
      const res = await this.pool.query<IdResult>(
        `
    UPDATE registrations
    SET email_status = 'failed', retry_count = retry_count + 1
    WHERE id = ANY($1::int[]) 
      AND retry_count < 3
    RETURNING id
  `,
        [ids]
      );

      if (res.rowCount != null && res.rowCount > 0) {
        return {
          ok: true,
          data: {
            message: 'Notification status set to "failed"',
            ids: res.rows.map((row) => row.id),
          },
        };
      }
      return {
        ok: false,
        error: { message: 'Notification status not set to "failed"', ids: ids },
      };
    } catch (err: any) {
      this.log.error('setFailedNotificationStatus DB Error:', err);
      return {
        ok: false,
        error: { message: `Database error: ${err.message}`, ids: ids },
      };
    }
  }

  async setSuccessStatus(
    ids: number[]
  ): Promise<
    Result<
      { message: string; ids: number[] },
      { message: string; ids: number[] }
    >
  > {
    try {
      const res = await this.pool.query<IdResult>(
        `
    UPDATE registrations
    SET email_status = 'success'
    WHERE id = ANY($1::int[])
    RETURNING id
  `,
        [ids]
      );
      if (res.rowCount != null && res.rowCount > 0) {
        return {
          ok: true,
          data: {
            message: 'Notification status set to "success"',
            ids: res.rows.map((row) => row.id),
          },
        };
      }
      return {
        ok: false,
        error: {
          message: 'Notification status not set to "success"',
          ids: ids,
        },
      };
    } catch (err: any) {
      this.log.error('setSuccessNotificationStatus DB Error:', err);
      return {
        ok: false,
        error: { message: `Database error: ${err.message}`, ids: ids },
      };
    }
  }

  async getNotificationEmail() {
    const res = await this.pool.query<{
      notification_email: string;
      updated_by_admin_user_id: number;
      updated_at: Date;
    }>(
      `SELECT notification_email, updated_by_admin_user_id, updated_at
     FROM admin_config
     WHERE id = 1`
    );
    return res.rows[0] ?? null;
  }
}

async function ensureSchema(connectionString: string) {
  const schemaUrl = new URL('../db/schema.sql', import.meta.url);
  const sql = await Bun.file(schemaUrl).text();

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1, $2);', [42069, 1]);

    try {
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query('COMMIT;');
    } catch (e) {
      await client.query('ROLLBACK;');
      throw e;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1, $2);', [42069, 1]);
    }
  } finally {
    client.release();
    await pool.end(); // important: don't leak a pool
  }
}
