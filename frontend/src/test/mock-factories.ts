import { mock } from 'bun:test';
import { Result } from '@/lib/result';
import {
  IAdminRepository,
  IAdminRepositoryTransaction,
  ICookie,
  INotifier,
  IPasswordHasher,
  IRegistrationRepository,
  IToken,
} from '@/lib/serveronly/domain/interfaces';
import { Registration } from '@/types';

export function createAdminRepositoryTransactionMock(
  overrides: Partial<IAdminRepositoryTransaction> = {}
): IAdminRepositoryTransaction {
  return {
    getAdminAuthById: mock(async () => null),
    countSuperAdmins: mock(async () => 1),
    setAdminSuperStatus: mock(async () => true),
    reassignAdminConfigUpdater: mock(async () => {}),
    deleteAdminUserById: mock(async () => true),
    ...overrides,
  };
}

export function createAdminRepositoryMock(
  overrides: Partial<IAdminRepository> = {}
): IAdminRepository {
  return {
    countAdmins: mock(async () => 0),
    createAdminUser: mock(async () => ({
      id: 1,
      email: 'admin@example.com',
      password_hash: 'hash',
    })),
    getAdminByEmail: mock(async () => null),
    getAdminById: mock(async () => null),
    getAdminAuthById: mock(async () => null),
    updateAdminPassword: mock(async () => {}),
    listAdminUsers: mock(async () => []),
    countSuperAdmins: mock(async () => 1),
    setAdminSuperStatus: mock(async () => true),
    deleteAdminUserById: mock(async () => true),
    reassignAdminConfigUpdater: mock(async () => {}),
    getAdminConfig: mock(async () => null),
    upsertAdminConfig: mock(async () => ({
      id: 1,
      notification_email: 'notify@example.com',
      updated_by_admin_user_id: 1,
      updated_at: new Date(),
      updated_by_email: 'admin@example.com',
    })),
    getRefreshTokenByHash: mock(async () => null),
    createRefreshToken: mock(async () => ({
      id: 1,
      admin_user_id: 1,
      token_hash: 'token-hash',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 60000),
      revoked_at: null,
      replaced_by_token_id: null,
    })),
    rotateRefreshToken: mock(async () => ({
      id: 2,
      admin_user_id: 1,
      token_hash: 'rotated-hash',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 60000),
      revoked_at: null,
      replaced_by_token_id: null,
    })),
    revokeRefreshToken: mock(async () => {}),
    revokeAllRefreshTokensForUser: mock(async () => {}),
    withTransaction: mock(async (work) =>
      work(createAdminRepositoryTransactionMock())
    ),
    ...overrides,
  };
}

export function createTokenMock(overrides: Partial<IToken> = {}): IToken {
  return {
    signAccessToken: mock(async () => 'signed-access-token'),
    verifyAccessToken: mock(async () => ({
      sub: '1',
      email: 'admin@example.com',
    })),
    generateRefreshToken: mock(() => 'raw-refresh-token'),
    hashRefreshToken: mock(() => 'hashed-refresh-token'),
    refreshTokenExpiresAt: mock(() => new Date(Date.now() + 60000)),
    ...overrides,
  };
}

export function createCookieMock(overrides: Partial<ICookie> = {}): ICookie {
  return {
    get: mock(async () => undefined),
    setAuthCookies: mock(() => {}),
    clearAuthCookies: mock(() => {}),
    ...overrides,
  };
}

export function createPasswordHasherMock(
  overrides: Partial<IPasswordHasher> = {}
): IPasswordHasher {
  return {
    hashPassword: mock(async () => 'hashed-password'),
    verifyPassword: mock(async () => true),
    ...overrides,
  };
}

export function createNotifierMock(
  overrides: Partial<INotifier> = {}
): INotifier {
  return {
    sendMessage: mock(async () => ({})),
    ...overrides,
  };
}

export function createRegistrationRepositoryMock(
  overrides: Partial<IRegistrationRepository> = {}
): IRegistrationRepository {
  const getRegistrationsResult: Result<Registration[]> = {
    ok: true,
    data: [],
  };
  const createRegistrationResult: Result<Registration> = {
    ok: true,
    data: {
      id: 1,
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      registration_message: null,
      registered_at: new Date(),
      updated_at: null,
      email_status: 'pending',
      retry_count: 0,
    },
  };

  return {
    getRegistrations: mock(async () => getRegistrationsResult),
    createRegistration: mock(async () => createRegistrationResult),
    ...overrides,
  };
}
