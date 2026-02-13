import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from './test-utils';

const getAdminRouteAuth = mock(async () => ({
  payload: { sub: '1', email: 'admin@example.com' } as
    | { sub: string; email: string }
    | null,
  refreshedTokens: null as { accessToken: string; refreshToken: string } | null,
  needsClear: false,
}));
const unauthorizedJson = mock((opts?: { clearCookies?: boolean }) =>
  Response.json({ ok: false, clear: !!opts?.clearCookies }, { status: 401 })
);
const applyRefreshedAuthCookies = mock(
  (_res: Response, _tokens: { accessToken: string; refreshToken: string } | null) =>
    {}
);
const requireAdminRouteAuth = mock(
  async (opts?: { clearCookies?: 'auto' | boolean }) => {
    const auth = await getAdminRouteAuth();
    if (!auth.payload) {
      const clearCookies =
        opts?.clearCookies === 'auto' || opts?.clearCookies === undefined
          ? auth.needsClear
          : opts.clearCookies;
      return {
        ok: false as const,
        response: unauthorizedJson({ clearCookies }),
      };
    }

    return {
      ok: true as const,
      auth,
    };
  }
);
const getRegistrations = mock(
  async (): Promise<any> => ({ ok: true, data: [] as unknown[] })
);
const createRegistration = mock(
  async (_payload: unknown): Promise<any> => ({
    ok: true,
    data: { id: 1, first_name: 'A', last_name: 'B', email: 'a@b.com' },
  })
);
const sendDiscordMessage = mock(async (_payload: unknown) => undefined);

mock.module('@/lib/serveronly/admin-route-auth', () => ({
  getAdminRouteAuth,
  requireAdminRouteAuth,
  unauthorizedJson,
  applyRefreshedAuthCookies,
}));
mock.module('@/lib/db', () => ({
  getRegistrations,
  createRegistration,
}));
mock.module('@/lib/serveronly/discord-messenger', () => ({ sendDiscordMessage }));

const route = await import('../../src/app/api/register/route');

describe('/api/register', () => {
  beforeEach(() => {
    getAdminRouteAuth.mockClear();
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));

    unauthorizedJson.mockClear();
    unauthorizedJson.mockImplementation((opts?: { clearCookies?: boolean }) =>
      Response.json({ ok: false, clear: !!opts?.clearCookies }, { status: 401 })
    );

    applyRefreshedAuthCookies.mockClear();
    applyRefreshedAuthCookies.mockImplementation(() => {});

    requireAdminRouteAuth.mockClear();
    requireAdminRouteAuth.mockImplementation(
      async (opts?: { clearCookies?: 'auto' | boolean }) => {
        const auth = await getAdminRouteAuth();
        if (!auth.payload) {
          const clearCookies =
            opts?.clearCookies === 'auto' || opts?.clearCookies === undefined
              ? auth.needsClear
              : opts.clearCookies;
          return {
            ok: false as const,
            response: unauthorizedJson({ clearCookies }),
          };
        }

        return {
          ok: true as const,
          auth,
        };
      }
    );

    getRegistrations.mockClear();
    getRegistrations.mockImplementation(
      async (): Promise<any> => ({ ok: true, data: [] as unknown[] })
    );

    createRegistration.mockClear();
    createRegistration.mockImplementation(
      async (_payload: unknown): Promise<any> => ({
        ok: true,
        data: { id: 1, first_name: 'A', last_name: 'B', email: 'a@b.com' },
      })
    );

    sendDiscordMessage.mockClear();
    sendDiscordMessage.mockImplementation(async (_payload: unknown) => undefined);
  });

  it('GET returns unauthorized without clearing cookies', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.GET();
    const body = await readJson<{ clear: boolean }>(res);

    expect(res.status).toBe(401);
    expect(body.clear).toBe(false);
  });

  it('GET returns 500 and notifies discord on db validation failure', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));
    getRegistrations.mockImplementation(async () => ({
      ok: false,
      message: 'invalid data',
      errors: [{ message: 'bad row' }],
    }));

    const res = await route.GET();
    expect(res.status).toBe(500);
    expect(sendDiscordMessage).toHaveBeenCalledTimes(1);
    expect(sendDiscordMessage).toHaveBeenCalledWith({
      source: 'GET /api/register',
      message: 'getRegistrations failed with error: invalid data',
    });
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });

  it('POST returns 400 for invalid input', async () => {
    const res = await route.POST(
      jsonRequest('http://localhost/api/register', 'POST', {
        firstName: '',
        lastName: 'User',
        email: 'bad-email',
      })
    );
    expect(res.status).toBe(400);
  });

  it('POST returns 201 for valid input', async () => {
    createRegistration.mockImplementation(async () => ({
      ok: true,
      data: { id: 1, first_name: 'A', last_name: 'B', email: 'a@b.com' },
    }));
    const res = await route.POST(
      jsonRequest('http://localhost/api/register', 'POST', {
        firstName: 'Alice',
        lastName: 'User',
        email: 'alice@example.com',
      })
    );

    expect(res.status).toBe(201);
  });

  it('POST returns 500 and sends discord message on create failure', async () => {
    createRegistration.mockImplementation(async () => ({
      ok: false,
      message: 'db down',
    }));
    const res = await route.POST(
      jsonRequest('http://localhost/api/register', 'POST', {
        firstName: 'Alice',
        lastName: 'User',
        email: 'alice@example.com',
      })
    );

    expect(res.status).toBe(500);
    expect(sendDiscordMessage).toHaveBeenCalledTimes(1);
    expect(sendDiscordMessage).toHaveBeenCalledWith({
      source: 'POST /api/register',
      message: 'createRegistration failed with error: db down',
    });
  });
});
