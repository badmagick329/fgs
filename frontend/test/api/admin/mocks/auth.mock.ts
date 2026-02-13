import { mock } from 'bun:test';

export class TestAdminActionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const countAdmins = mock(async () => 1);
export const getAdminByEmail = mock(
  async (_email: string) =>
    ({ id: 1, email: 'admin@example.com', password_hash: 'hash' }) as
      | { id: number; email: string; password_hash: string }
      | null
);
export const verifyPassword = mock(async (_password: string, _hash: string) => true);
export const createAdminUser = mock(
  async (_email: string, _password: string, _isSuperAdmin?: boolean) => ({
    id: 1,
    email: 'admin@example.com',
  })
);
export const getRefreshTokenByHash = mock(
  async (_hash: string) =>
    null as null | { id: number; revoked_at: Date | null }
);
export const hashRefreshToken = mock((token: string) => `hash:${token}`);
export const revokeRefreshToken = mock(async (_id: number) => undefined);
export const getAdminById = mock(
  async (_id: number) =>
    ({ id: 1, email: 'admin@example.com', password_hash: 'hash' }) as
      | { id: number; email: string; password_hash: string }
      | null
);
export const revokeAllRefreshTokensForUser = mock(async (_id: number) => undefined);
export const updateAdminPassword = mock(async (_id: number, _password: string) => undefined);
export const getAdminAuthById = mock(
  async (_id: number) =>
    ({ id: 1, email: 'admin@example.com', is_super_admin: true }) as
      | { id: number; email: string; is_super_admin: boolean }
      | null
);
export const listAdminUsers = mock(async (): Promise<any[]> => []);
export const removeAdminUserWithGuards = mock(async (_args: unknown) => undefined);
export const updateAdminSuperStatusWithGuards = mock(async (_args: unknown) => ({
  id: 1,
  is_super_admin: true,
}));
export const getAdminConfig = mock(async (): Promise<any> => null);
export const upsertAdminConfig = mock(async (_email: string, _adminId: number) => undefined);

mock.module('@/lib/serveronly/auth', () => ({
  AdminActionError: TestAdminActionError,
  countAdmins,
  getAdminByEmail,
  verifyPassword,
  createAdminUser,
  getRefreshTokenByHash,
  hashRefreshToken,
  revokeRefreshToken,
  getAdminById,
  revokeAllRefreshTokensForUser,
  updateAdminPassword,
  getAdminAuthById,
  listAdminUsers,
  removeAdminUserWithGuards,
  updateAdminSuperStatusWithGuards,
  getAdminConfig,
  upsertAdminConfig,
}));
