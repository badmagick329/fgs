import { MockEmailConfigReader } from '@/infrastructure/config';
import { EmailClient } from '@/infrastructure/email/email-client';
import { beforeEach, describe, expect, test } from 'bun:test';
import { mockLoggerFactory } from './mock-logger';
import { mockSend } from './setup';
import { testConfig } from './test-config';

beforeEach(() => {
  mockSend.mockClear();
});

describe('sendEmail', () => {
  const emailConfig = new MockEmailConfigReader(testConfig).read();
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
});
