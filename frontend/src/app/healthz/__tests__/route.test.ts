import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));
const { GET } = await import('@/app/healthz/route');

describe('GET /healthz', () => {
  beforeEach(() => getServerContainer.mockReset());

  it('checks Postgres on every request without authentication or caching', async () => {
    const check = mock(async () => {});
    getServerContainer.mockReturnValue({ healthCheck: { check } });

    for (let i = 0; i < 2; i++) {
      const response = await GET();
      expect(response.status).toBe(204);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(await response.text()).toBe('');
    }
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('returns an uncached 503 without exposing database errors', async () => {
    getServerContainer.mockReturnValue({
      healthCheck: {
        check: async () => {
          throw new Error('connection failed: postgresql://user:secret@db/fgs');
        },
      },
    });

    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toBe('');
  });

  it('returns 503 when the database configuration cannot be loaded', async () => {
    getServerContainer.mockImplementation(() => {
      throw new Error('invalid server configuration');
    });
    expect((await GET()).status).toBe(503);
  });
});
