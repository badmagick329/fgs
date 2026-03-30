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
import { mockLoggerFactory } from './mock-logger';

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

  it('getPendingEmailsData returns pending emails or failed emails with retries less than 3', async () => {
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

    const result = await db.getPending();
    if (!result.ok) {
      throw new Error(`Expected Ok, but got Error: ${result.error}`);
    }
    const data = result.data;

    expect(data.length).toBe(2);
    expect(data[0]!.student_name).toBe('Alice');
    expect(data[1]!.student_name).toBe('Charlie');
  });

  it('getPendingEmailsData ignores rows with retry_count >= 3', async () => {
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
    const result = await db.getPending();
    if (!result.ok) {
      throw new Error(`Expected Ok, but got Error: ${result.error}`);
    }
    const data = result.data;

    // 3. Assert
    expect(data.length).toBe(0);
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
