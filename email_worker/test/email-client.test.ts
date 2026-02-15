import { mockEmailConfigReader } from '@/infrastructure/config';
import { EmailClient } from '@/infrastructure/email/email-client';
import { beforeEach, describe, expect, test } from 'bun:test';
import { mockLoggerFactory } from './mock-logger';
import { mockSend } from './setup';

const testConfig = {
  resend_api_key: 're_123',
  sender_email_address: 'verified@example.com',
  database_url: 'postgresql://testuser:testpassword@localhost:5433/testdb',
};

const getNotificationEmailData = async () => ({
  notification_email: 'to@example.com',
  updated_by_admin_user_id: 1,
  updated_at: new Date(),
});

beforeEach(() => {
  mockSend.mockClear();
});

describe('sendEmail', () => {
  const emailConfig = mockEmailConfigReader(testConfig);
  const loggerFactory = mockLoggerFactory('info');

  describe('Success Paths', () => {
    test('returns ok: true when Resend succeeds', async () => {
      const emailClient = new EmailClient(
        {
          ...emailConfig,
          getNotificationEmailData,
        },
        loggerFactory
      );
      const result = await emailClient.send({ payload: [] });
      expect(result).toEqual('success');
    });
  });

  describe('Error Handling', () => {
    const emailClient = new EmailClient(
      {
        ...emailConfig,
        getNotificationEmailData,
      },
      loggerFactory
    );
    test('handles a Provider Error (API Rejection)', async () => {
      mockSend.mockImplementationOnce(
        async (): Promise<{ error: undefined | 'mock-error' }> => ({
          error: 'mock-error',
        })
      );

      const result = await emailClient.send({ payload: [] });
      expect(result).toEqual('fail');
    });

    test('handles unexpected errors (Network Crash)', async () => {
      mockSend.mockImplementationOnce(async () => {
        throw new Error('Some unhandled error');
      });

      const result = await emailClient.send({ payload: [] });
      expect(result).toEqual('fail');
    });
  });

  describe('Missing destination address handling', () => {
    const emailConfig = mockEmailConfigReader(testConfig);
    const loggerFactory = mockLoggerFactory('info');

    const emailClient = new EmailClient(
      {
        ...emailConfig,
        getNotificationEmailData: async () => {
          return null;
        },
      },
      loggerFactory
    );

    test('handles missing destination email address', async () => {
      const result = await emailClient.send({ payload: [] });
      expect(result).toEqual('missing_email');
    });
  });

  describe('Email client picks up updated notification address', async () => {
    const emailConfig = mockEmailConfigReader(testConfig);
    const loggerFactory = mockLoggerFactory('info');
    type NotificationEmailData = {
      notification_email: string;
      updated_by_admin_user_id: number;
      updated_at: Date;
    } | null;

    let notificationEmailData: NotificationEmailData = {
      notification_email: 'old@example.com',
      updated_by_admin_user_id: 1,
      updated_at: new Date(),
    };

    const emailClient = new EmailClient(
      {
        ...emailConfig,
        getNotificationEmailData: async () => notificationEmailData,
      },
      loggerFactory
    );

    test('uses updated notification email address', async () => {
      const first = await emailClient.send({ payload: [] });
      expect(first).toEqual('success');

      notificationEmailData = null;

      const second = await emailClient.send({ payload: [] });
      expect(second).toEqual('missing_email');
    });
  });
});
