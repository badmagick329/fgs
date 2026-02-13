import { mock } from 'bun:test';

export const setAuthCookies = mock(
  (_res: Response, _accessToken: string, _refreshToken: string) => {}
);
export const clearAuthCookies = mock((_res: Response) => {});

mock.module('@/lib/serveronly/admin-cookies', () => ({
  setAuthCookies,
  clearAuthCookies,
}));
