import { mock } from 'bun:test';

process.env.RESEND_API_KEY = 're_123';
process.env.SENDER_EMAIL_ADDRESS = 'verified@example.com';
process.env.DESTINATION_EMAIL_ADDRESS = 'admin@example.com';

export type ResendResponse =
  | { data: { id: string }; error: null }
  | {
      data: null;
      error: { name?: string; message: string };
    };

export const mockSend = mock(
  async (payload: any): Promise<ResendResponse> => ({
    data: { id: 'test-id' },
    error: null,
  })
);

mock.module('resend', () => {
  return {
    Resend: class {
      constructor(key?: string) {}
      emails = { send: mockSend };
    },
  };
});
