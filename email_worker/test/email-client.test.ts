import { mockEmailConfigReader } from '@/infrastructure/config';
import { EmailClient } from '@/infrastructure/email/email-client';
import { beforeEach, describe, expect, test } from 'bun:test';
import { mockLoggerFactory } from './mock-logger';
import { mockSend } from './setup';

const testConfig = {
  resend_api_key: 're_123',
  sender_email_address: 'verified@example.com',
  destination_email_address: 'admin@example.com',
  database_url: 'postgresql://testuser:testpassword@localhost:5433/testdb',
};

const missingDestinationConfig = {
  resend_api_key: 're_123',
  sender_email_address: 'verified@example.com',
  destination_email_address: '',
};

beforeEach(() => {
  mockSend.mockClear();
});

describe('sendEmail', () => {
  const emailConfig = mockEmailConfigReader(testConfig);
  const loggerFactory = mockLoggerFactory('info');

  describe('Success Paths', () => {
    test('returns ok: true when Resend succeeds', async () => {
      const emailClient = new EmailClient(emailConfig, loggerFactory);
      const result = await emailClient.send({ payload: [] });
      expect(result).toEqual('success');
    });
  });

  describe('Error Handling', () => {
    const emailClient = new EmailClient(emailConfig, loggerFactory);
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
    const emailConfig = mockEmailConfigReader(missingDestinationConfig);
    const loggerFactory = mockLoggerFactory('info');

    const emailClient = new EmailClient(emailConfig, loggerFactory);

    test('handles missing destination email address', async () => {
      const result = await emailClient.send({ payload: [] });
      expect(result).toEqual('missing_email');
    });
  });
});
