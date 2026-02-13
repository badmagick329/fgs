import { mock } from 'bun:test';

export const getAdminRouteAuth = mock(async () => ({
  payload: { sub: '1', email: 'admin@example.com' } as
    | { sub: string; email: string }
    | null,
  refreshedTokens: null as { accessToken: string; refreshToken: string } | null,
  needsClear: false,
}));

export const unauthorizedJson = mock((opts?: { clearCookies?: boolean }) =>
  Response.json(
    { ok: false, marker: 'unauthorized', clear: !!opts?.clearCookies },
    { status: 401 }
  )
);

export const applyRefreshedAuthCookies = mock(
  (_res: Response, _tokens: { accessToken: string; refreshToken: string } | null) =>
    {}
);

export const requireAdminRouteAuth = mock(
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

mock.module('@/lib/serveronly/admin-route-auth', () => ({
  getAdminRouteAuth,
  requireAdminRouteAuth,
  unauthorizedJson,
  applyRefreshedAuthCookies,
}));
