import { expect, it } from 'bun:test';
import { PostgresHealthCheck } from '../postgres-health-check';

it('checks a real Postgres connection and query', async () => {
  const check = new PostgresHealthCheck(
    'postgresql://testuser:testpassword@localhost:5433/testdb'
  );
  await expect(check.check()).resolves.toBeUndefined();
});
