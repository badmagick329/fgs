import { Client } from 'pg';

export class PostgresHealthCheck {
  constructor(private readonly connectionString: string | undefined) {}

  async check(): Promise<void> {
    // A fresh connection also detects failed authentication and avoids leaving
    // a stalled probe in the application's query pool. Both phases are bounded.
    const client = new Client({
      connectionString: this.connectionString,
      connectionTimeoutMillis: 1500,
      query_timeout: 1500,
      statement_timeout: 1500,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
    } finally {
      await client.end();
    }
  }
}
