import { NotificationService } from '@/application/notification-service';
import { emailConfigReader } from '@/infrastructure/config';
import { DB } from '@/infrastructure/db/db';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { mockLoggerFactory } from '../mock-logger';

const testDatabaseUrl = 'postgresql://testuser:testpassword@localhost:5433/testdb';
const loggerFactory = mockLoggerFactory('info');
const log = loggerFactory('NotificationFlowIntegration');

type ResendMockState = {
  readonly baseUrl: string;
  setMode: (mode: 'success' | 'provider_error') => void;
  reset: () => void;
  getRequests: () => Array<{
    method: string;
    path: string;
    headers: Record<string, string>;
    body: unknown;
  }>;
};

const resendMockState = (globalThis as typeof globalThis & {
  __resendMockState?: ResendMockState;
}).__resendMockState;
const describeIfIntegrationSetup = resendMockState ? describe : describe.skip;

let db: DB;
let service: NotificationService;

async function resetTables() {
  await db.query(`
    TRUNCATE TABLE
      admin_config,
      admin_refresh_tokens,
      admin_users,
      registrations
    RESTART IDENTITY CASCADE
  `);
}

async function seedAdminConfig(notificationEmail: string) {
  const adminResult = await db.query(
    `
      INSERT INTO admin_users (email, password_hash, is_super_admin)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    ['admin@example.com', 'hash', true]
  );
  const adminId = adminResult.rows[0]?.id as number;

  await db.query(
    `
      INSERT INTO admin_config (id, notification_email, updated_by_admin_user_id)
      VALUES (1, $1, $2)
    `,
    [notificationEmail, adminId]
  );
}

async function seedRegistrations(rows: Array<{ email: string; retryCount?: number }>) {
  for (const row of rows) {
    await db.query(
      `
        INSERT INTO registrations (
          first_name,
          last_name,
          email,
          registration_message,
          email_status,
          retry_count
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      ['First', 'Last', row.email, 'hello', 'pending', row.retryCount ?? 0]
    );
  }
}

describeIfIntegrationSetup('Notification flow integration', () => {
  beforeAll(async () => {
    db = await DB.create(testDatabaseUrl, loggerFactory);
    process.env.RESEND_BASE_URL = resendMockState?.baseUrl;
    const { EmailClient } = await import('@/infrastructure/email/email-client');
    const emailConfig = emailConfigReader();
    const emailClient = new EmailClient(
      {
        ...emailConfig,
        getNotificationEmailData: db.getNotificationEmail.bind(db),
      },
      loggerFactory
    );
    service = new NotificationService(db, emailClient, loggerFactory);
  });

  beforeEach(async () => {
    await resetTables();
    resendMockState?.reset();
  });

  afterAll(async () => {
    await db.close();
  });

  test('success path: sends once and marks rows success', async () => {
    await seedAdminConfig('notify@example.com');
    await seedRegistrations([
      { email: 'a@example.com' },
      { email: 'b@example.com' },
    ]);

    await service.processUnsentNotifications();

    const sentRequests = resendMockState?.getRequests() ?? [];
    expect(sentRequests.length).toBe(1);

    const request = sentRequests[0];
    expect(request?.method).toBe('POST');
    expect(request?.path).toBe('/emails');

    const body = request?.body as {
      from: string;
      to: string;
      subject: string;
    };
    expect(body.from).toBe('Registration Form <verified@example.com>');
    expect(body.to).toBe('notify@example.com');
    expect(body.subject).toBe('New Student Registration');

    const result = await db.query(
      'SELECT email_status, retry_count FROM registrations ORDER BY id ASC'
    );
    expect(result.rows.length).toBe(2);
    for (const row of result.rows) {
      expect(row.email_status).toBe('success');
      expect(row.retry_count).toBe(0);
    }
  });

  test('provider failure path: marks rows failed and increments retry_count', async () => {
    resendMockState?.setMode('provider_error');
    await seedAdminConfig('notify@example.com');
    await seedRegistrations([
      { email: 'c@example.com', retryCount: 0 },
      { email: 'd@example.com', retryCount: 0 },
    ]);

    await service.processUnsentNotifications();

    const sentRequests = resendMockState?.getRequests() ?? [];
    expect(sentRequests.length).toBe(1);

    const result = await db.query(
      'SELECT email_status, retry_count FROM registrations ORDER BY id ASC'
    );
    expect(result.rows.length).toBe(2);
    for (const row of result.rows) {
      expect(row.email_status).toBe('failed');
      expect(row.retry_count).toBe(1);
    }

    const successCount = await db.query(
      `SELECT COUNT(*)::int AS count FROM registrations WHERE email_status = 'success'`
    );
    expect(successCount.rows[0]?.count).toBe(0);
  });

  test('missing notification address path: sends nothing and keeps pending rows unchanged', async () => {
    await seedRegistrations([
      { email: 'e@example.com', retryCount: 0 },
      { email: 'f@example.com', retryCount: 2 },
    ]);

    await service.processUnsentNotifications();

    const sentRequests = resendMockState?.getRequests() ?? [];
    expect(sentRequests.length).toBe(0);

    const result = await db.query(
      'SELECT email_status, retry_count FROM registrations ORDER BY id ASC'
    );
    expect(result.rows.length).toBe(2);
    expect(result.rows[0]?.email_status).toBe('pending');
    expect(result.rows[0]?.retry_count).toBe(0);
    expect(result.rows[1]?.email_status).toBe('pending');
    expect(result.rows[1]?.retry_count).toBe(2);
  });
});
