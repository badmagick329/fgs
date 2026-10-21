import { getDatabaseConfig } from '@/infrastructure/config';
import { DB } from '@/infrastructure/db/db';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'bun:test';
import { Pool } from 'pg';
import { mockLoggerFactory } from './mock-logger';

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000;

export const testConfig = {
  databaseUrl: 'postgresql://testuser:testpassword@localhost:5433/testdb',
};

const dbConfig = getDatabaseConfig(testConfig);

const loggerFactory = mockLoggerFactory('info');
const log = loggerFactory('DB');

const db = new DB(dbConfig.databaseUrl, log);

describe('Database Functions', () => {
  beforeAll(async () => {
    await DB.initializeSchema(dbConfig.databaseUrl, log);
  });

  beforeEach(async () => {
    if (!dbConfig.databaseUrl?.includes('test')) {
      throw new Error('DANGER: Running tests against non-test DB!');
    }
    await db.query(
      'TRUNCATE TABLE registration_requests, email_worker_status RESTART IDENTITY CASCADE'
    );
  });

  afterAll(async () => {
    await db.close();
  });

  // --- TESTS ---

  it('claimPending claims pending emails or failed emails with retries less than 3', async () => {
    await db.query(`
      INSERT INTO registration_requests (
        student_name,
        parent_name,
        class_name,
        mobile_number,
        campus,
        preferred_appointment_at,
        email_status,
        retry_count
      )
      VALUES 
        ('Alice', 'Parent A', 'Class 5', '03001234567', 'Boys Campus', NOW() + INTERVAL '1 day', 'pending', 0),
        ('Bob', 'Parent B', 'Class 6', '03001234568', 'Girls Campus', NOW() + INTERVAL '1 day', 'success', 0),
        ('Charlie', 'Parent C', 'Class 7', '03001234569', 'Kids Campus', NOW() + INTERVAL '1 day', 'failed', 0),
        ('Charlie2', 'Parent D', 'Class 8', '03001234570', 'Edward Road Campus', NOW() + INTERVAL '1 day', 'failed', 3);
    `);

    const result = await db.claimPending(25, CLAIM_TIMEOUT_MS);
    if (!result.ok) {
      throw new Error(`Expected Ok, but got Error: ${result.error}`);
    }
    const data = result.data;

    expect(data.length).toBe(2);
    expect(data[0]!.student_name).toBe('Alice');
    expect(data[1]!.student_name).toBe('Charlie');
  });

  it('claimPending ignores rows with retry_count >= 3', async () => {
    // 1. Arrange: Insert a pending email that has failed too many times
    await db.query(`
      INSERT INTO registration_requests (
        student_name,
        parent_name,
        class_name,
        mobile_number,
        campus,
        preferred_appointment_at,
        email_status,
        retry_count
      )
      VALUES ('Dave', 'Parent D', 'Class 5', '03001234571', 'Boys Campus', NOW() + INTERVAL '1 day', 'pending', 3);
    `);

    // 2. Act
    const result = await db.claimPending(25, CLAIM_TIMEOUT_MS);
    if (!result.ok) {
      throw new Error(`Expected Ok, but got Error: ${result.error}`);
    }
    const data = result.data;

    // 3. Assert
    expect(data.length).toBe(0);
  });

  async function seedPending(count: number) {
    await db.query(
      `
      INSERT INTO registration_requests (
        student_name, parent_name, class_name, mobile_number, campus,
        preferred_appointment_at, registered_at
      )
      SELECT 'S' || n, 'P', 'Class 5', '03001234567', 'Boys Campus',
             NOW() + INTERVAL '1 day', NOW() - (n * INTERVAL '1 minute')
      FROM generate_series(1, $1::int) AS n
    `,
      [count]
    );
  }

  const ids = (result: Awaited<ReturnType<DB['claimPending']>>) => {
    if (!result.ok) throw new Error(result.error);
    return result.data.map((row) => row.id);
  };

  it('claimPending returns only the oldest batch and keeps them claimed', async () => {
    await seedPending(30);

    const first = await db.claimPending(25, CLAIM_TIMEOUT_MS);
    if (!first.ok) throw new Error(first.error);
    expect(first.data.length).toBe(25);
    // generate_series n=30 is the oldest row and was inserted last (id 30).
    expect(first.data[0]!.student_name).toBe('S30');
    expect(first.data[24]!.student_name).toBe('S6');

    const second = await db.claimPending(25, CLAIM_TIMEOUT_MS);
    expect(ids(second).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);

    expect(ids(await db.claimPending(25, CLAIM_TIMEOUT_MS))).toEqual([]);
  });

  it('concurrent claimPending calls never hand out the same row', async () => {
    await seedPending(60);
    const otherDb = new DB(dbConfig.databaseUrl, log);

    try {
      const results = await Promise.all([
        db.claimPending(25, CLAIM_TIMEOUT_MS),
        otherDb.claimPending(25, CLAIM_TIMEOUT_MS),
        db.claimPending(25, CLAIM_TIMEOUT_MS),
        otherDb.claimPending(25, CLAIM_TIMEOUT_MS),
      ]);
      const claimed = results.flatMap(ids);

      expect(claimed.length).toBe(60);
      expect(new Set(claimed).size).toBe(60);
    } finally {
      await otherDb.close();
    }
  });

  it('claimPending skips rows another transaction holds instead of waiting', async () => {
    await seedPending(3);
    const lockPool = new Pool({ connectionString: dbConfig.databaseUrl });
    const lockClient = await lockPool.connect();

    try {
      await lockClient.query('BEGIN');
      await lockClient.query(
        'SELECT id FROM registration_requests WHERE id = 1 FOR UPDATE'
      );

      const claimed = ids(await db.claimPending(25, CLAIM_TIMEOUT_MS));
      expect(claimed.sort((a, b) => a - b)).toEqual([2, 3]);
    } finally {
      await lockClient.query('ROLLBACK');
      lockClient.release();
      await lockPool.end();
    }
  });

  it('claimPending reclaims rows whose claim is older than the timeout', async () => {
    await seedPending(2);
    await db.query(
      `UPDATE registration_requests
       SET email_claimed_at = CASE id
         WHEN 1 THEN NOW() - INTERVAL '1 hour'
         ELSE NOW() - INTERVAL '1 minute'
       END`
    );

    expect(ids(await db.claimPending(25, 30 * 60 * 1000))).toEqual([1]);
  });

  it('releaseClaims and status updates make rows claimable or done', async () => {
    await seedPending(3);
    await db.claimPending(25, CLAIM_TIMEOUT_MS);

    await db.releaseClaims([1]);
    await db.setFailedStatus([2]);
    await db.setSuccessStatus([3]);

    const check = await db.query(
      'SELECT id, email_claimed_at FROM registration_requests ORDER BY id'
    );
    expect(check.rows.every((row) => row.email_claimed_at === null)).toBe(true);
    expect(
      ids(await db.claimPending(25, CLAIM_TIMEOUT_MS)).sort((a, b) => a - b)
    ).toEqual([1, 2]);
  });

  it("setSuccessEmailStatus updates status to 'success'", async () => {
    // 1. Arrange: Insert a pending user
    const insertRes = await db.query(`
      INSERT INTO registration_requests (
        student_name,
        parent_name,
        class_name,
        mobile_number,
        campus,
        preferred_appointment_at,
        email_status
      )
      VALUES ('Eve', 'Parent E', 'Class 5', '03001234572', 'Girls Campus', NOW() + INTERVAL '1 day', 'pending')
      RETURNING id;
    `);
    const id = insertRes.rows[0].id;

    // 2. Act
    await db.setSuccessStatus([id]);

    // 3. Assert: Check DB directly
    const check = await db.query(
      'SELECT email_status FROM registration_requests WHERE id = $1',
      [id]
    );
    expect(check.rows[0].email_status).toBe('success');
  });

  it("setFailedEmailStatus increments retry_count and sets status to 'failed'", async () => {
    // 1. Arrange: Insert a pending user with 0 retries
    const insertRes = await db.query(`
      INSERT INTO registration_requests (
        student_name,
        parent_name,
        class_name,
        mobile_number,
        campus,
        preferred_appointment_at,
        email_status,
        retry_count
      )
      VALUES ('Frank', 'Parent F', 'Class 5', '03001234573', 'Kids Campus', NOW() + INTERVAL '1 day', 'pending', 0)
      RETURNING id;
    `);
    const id = insertRes.rows[0].id;

    // 2. Act
    await db.setFailedStatus([id]);

    // 3. Assert
    const check = await db.query(
      'SELECT email_status, retry_count FROM registration_requests WHERE id = $1',
      [id]
    );
    expect(check.rows[0].email_status).toBe('failed');
    expect(check.rows[0].retry_count).toBe(1);
  });
});
