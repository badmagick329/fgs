// run tests like this:
// cd to email_worker
// then run: bun test --preload ./test/setup.ts
import { getEmailConfig } from '@/infrastructure/config';
import { EmailClient } from '@/infrastructure/email/email-client';
import { beforeEach, describe, expect, test } from 'bun:test';
import { type ResendResponse, mockSend } from './setup';

beforeEach(() => {
  mockSend.mockClear();
  mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null });
});

describe('sendEmail', () => {
  // SECTION 1: SUCCESS SCENARIOS
  const testEmailAddress = 'admin@example.com';
  const emailConfig = getEmailConfig(testEmailAddress);
  const emailClient = new EmailClient(emailConfig);

  describe('Success Paths', () => {
    test('returns ok: true when Resend succeeds', async () => {
      const result = await emailClient.send({ payload: [] });
      expect(result.ok).toBe(true);
    });

    test('returns providerId when Resend succeeds', async () => {
      const result = await emailClient.send({ payload: [] });
      if (result.ok) {
        expect(result.data.providerId).toBe('test-id');
      }
    });

    test('handles missing provider ID gracefully', async () => {
      // Simulate a weird API response where data exists but ID is missing
      mockSend.mockResolvedValueOnce({
        data: { id: undefined as any }, // Force undefined
        error: null,
      });

      const result = await emailClient.send({ payload: [] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Logic check: Did it fall back to empty string?
        expect(result.data.providerId).toBe('');
      }
    });
  });

  // SECTION 2: FAILURE SCENARIOS
  describe('Error Handling', () => {
    test('handles a Provider Error (API Rejection)', async () => {
      mockSend.mockImplementationOnce(
        async (): Promise<ResendResponse> => ({
          data: null,
          error: { message: 'API key is invalid' },
        })
      );

      const result = await emailClient.send({ payload: [] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('API key is invalid');
      }
    });

    test('handles unexpected errors (Network Crash)', async () => {
      mockSend.mockImplementationOnce(async () => {
        throw new Error('Some unhandled error');
      });

      const result = await emailClient.send({ payload: [] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Some unhandled error');
      }
    });
  });

  // SECTION 3: DATA INTEGRITY / LOGIC
  describe('Payload Contruction', () => {
    test('sends the correct payload structure to the Resend SDK', async () => {
      const testData = [
        {
          first_name: 'Harold',
          last_name: 'Finch',
          email: 'youarebeing@watched.com',
        },
      ];

      await emailClient.send({ payload: testData as any });

      const sentPayload = mockSend.mock.calls[0]![0];

      expect(sentPayload.from).toContain('Registration Form');
      expect(sentPayload.from).toContain('verified@example.com');
      expect(sentPayload.to).toContain('admin@example.com');
      expect(sentPayload.subject).toContain('New Student Registration');

      expect(sentPayload.react).toBeDefined();
    });

    test('uses the correct subject line', async () => {
      await emailClient.send({ payload: [] });

      const sentPayload = mockSend.mock.calls[0]![0];

      // Logic check: Is the subject exactly what we expect?
      expect(sentPayload.subject).toBe('New Student Registration');
    });

    // test('Update db email status field to success when email is sent', async () => {
    //   await sendEmail({ email_data: [] });
    //   const sentPayload = mockSend.mock.calls[0]![0];
    // });
  });
});
