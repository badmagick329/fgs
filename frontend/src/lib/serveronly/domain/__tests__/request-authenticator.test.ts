import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { RequestAuthenticator } from '@/lib/serveronly/domain/request-authenticator';
import { AUTH_COOKIE_KEYS } from '@/lib/consts';
import { createCookieMock, createTokenMock } from '@/test/mock-factories';

const sessionIssuerMock = {
  refreshSession: mock(async () => null),
};

describe('RequestAuthenticator', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('returns payload from valid access token', async () => {
    const cookie = createCookieMock({
      get: mock(async (name: string) =>
        name === AUTH_COOKIE_KEYS.access ? 'access' : undefined
      ),
    });
    const token = createTokenMock({
      verifyAccessToken: mock(async () => ({ sub: '1', email: 'admin@example.com' })),
    });
    const auth = new RequestAuthenticator(cookie, token, sessionIssuerMock as any);

    const result = await auth.getRouteAuth();

    expect(result.payload?.sub).toBe('1');
    expect(result.refreshedTokens).toBeNull();
    expect(result.needsClear).toBeFalse();
  });

  it('uses refresh flow when access token invalid', async () => {
    const cookie = createCookieMock({
      get: mock(async (name: string) => {
        if (name === AUTH_COOKIE_KEYS.access) return 'bad';
        if (name === AUTH_COOKIE_KEYS.refresh) return 'refresh';
        return undefined;
      }),
    });
    const token = createTokenMock({
      verifyAccessToken: mock()
        .mockRejectedValueOnce(new Error('bad token'))
        .mockResolvedValueOnce({ sub: '2', email: 'admin2@example.com' }),
    });
    const sessionIssuer = {
      refreshSession: mock(async () => ({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      })),
    };
    const auth = new RequestAuthenticator(cookie, token, sessionIssuer as any);

    const result = await auth.getRouteAuth();

    expect(result.payload?.sub).toBe('2');
    expect(result.refreshedTokens).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(result.needsClear).toBeFalse();
  });

  it('returns clear-needed when no refresh cookie', async () => {
    const cookie = createCookieMock();
    const token = createTokenMock({ verifyAccessToken: mock(async () => { throw new Error('bad'); }) });
    const auth = new RequestAuthenticator(cookie, token, sessionIssuerMock as any);

    const result = await auth.getRouteAuth();

    expect(result).toEqual({ payload: null, refreshedTokens: null, needsClear: true });
  });

  it('returns clear-needed when refresh fails', async () => {
    const cookie = createCookieMock({
      get: mock(async (name: string) =>
        name === AUTH_COOKIE_KEYS.refresh ? 'refresh' : undefined
      ),
    });
    const token = createTokenMock();
    const sessionIssuer = { refreshSession: mock(async () => null) };
    const auth = new RequestAuthenticator(cookie, token, sessionIssuer as any);

    const result = await auth.getRouteAuth();

    expect(result).toEqual({ payload: null, refreshedTokens: null, needsClear: true });
  });
});
