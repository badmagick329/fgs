import { mock } from 'bun:test';

export const mockSend = mock(
  async (payload: any): Promise<{ error: undefined | 'mock-error' }> => ({
    error: undefined,
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
