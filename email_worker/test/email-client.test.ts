// run tests like this:
// cd to email_worker
// then run: bun test --preload ./test/setup.ts
import { beforeEach, expect, test } from 'bun:test';
import { type ResendResponse, mockSend } from './setup';

const { sendEmail } =
  require('@/lib/email-client') as typeof import('@/lib/email-client');

beforeEach(() => {
  mockSend.mockClear();
  process.env.SENDER_EMAIL_ADDRESS = 'verified@example.com';
  process.env.DESTINATION_EMAIL_ADDRESS = 'admin@example.com';
});

test('sendEmail returns ok: true when Resend succeeds', async () => {
  const result = await sendEmail({ email_data: [] });
  expect(result.ok).toBe(true);
});

test('sendEmail returns providerId when Resend succeeds', async () => {
  const result = await sendEmail({ email_data: [] });
  if (result.ok) {
    expect(result.data.providerId).toBe('test-id');
  }
});

test('sendEmail returns ok: false early if SENDER is missing', async () => {
  delete process.env.SENDER_EMAIL_ADDRESS;

  const result = await sendEmail({ email_data: [] });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBe('no sender email configured');
  }
});

test('sendEmail returns ok: false early if DEST is missing (with SENDER present)', async () => {
  delete process.env.DESTINATION_EMAIL_ADDRESS;

  const result = await sendEmail({ email_data: [] });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBe('no destination email configured');
  }
});

test('sendEmail handles a Provider Error after passing the guard', async () => {
  mockSend.mockImplementationOnce(
    async (): Promise<ResendResponse> => ({
      data: null,
      error: { message: 'API key is invalid' },
    })
  );

  const result = await sendEmail({ email_data: [] });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain('API key is invalid');
  }
});

test("sendEmail returns ok: false when an unhandled error is caught with an error message of 'Unknown error'", async () => {
  mockSend.mockImplementationOnce(async () => {
    throw new Error('Some unhandled error');
  });

  const result = await sendEmail({ email_data: [] });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors?.[0]?.message).toBe('Some unhandled error');
  }
});

test('sendEmail sends the correct payload structure to the Resend SDK', async () => {
  const testData = [
    {
      first_name: 'Harold',
      last_name: 'Finch',
      email: 'youarebeing@watched.com',
    },
  ];

  await sendEmail({ email_data: testData as any });

  const sentPayload = mockSend.mock.calls[0]![0]!;

  expect(sentPayload.from).toContain('Registration Form');
  expect(sentPayload.from).toContain('verified@example.com');
  expect(sentPayload.to).toContain('admin@example.com');
  expect(sentPayload.subject).toContain('New Student Registration');

  expect(sentPayload.react).toBeDefined();
});
