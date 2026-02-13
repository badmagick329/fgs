import { mock } from 'bun:test';

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
