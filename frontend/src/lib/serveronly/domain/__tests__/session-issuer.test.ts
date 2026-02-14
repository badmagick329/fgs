import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { SessionIssuer } from '@/lib/serveronly/domain/session-issuer';
import { createAdminRepositoryMock, createTokenMock } from '@/test/mock-factories';

describe('SessionIssuer', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('issues session and stores hashed refresh token', async () => {
    const repo = createAdminRepositoryMock();
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.issueAdminSession({
      id: 9,
      email: 'admin@example.com',
    });

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toBe('raw-refresh-token');
    expect(token.hashRefreshToken).toHaveBeenCalledWith('raw-refresh-token');
    expect(repo.createRefreshToken).toHaveBeenCalled();
  });

  it('returns null when refresh token hash is missing', async () => {
    const repo = createAdminRepositoryMock();
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.refreshSession('raw');

    expect(result).toBeNull();
  });

  it('revoked token revokes all for user and returns null', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => ({
        id: 1,
        admin_user_id: 2,
        token_hash: 'hash',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 1000),
        revoked_at: new Date(),
        replaced_by_token_id: null,
      })),
    });
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.refreshSession('raw');

    expect(result).toBeNull();
    expect(repo.revokeAllRefreshTokensForUser).toHaveBeenCalledWith(2);
  });

  it('expired token returns null', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => ({
        id: 1,
        admin_user_id: 2,
        token_hash: 'hash',
        created_at: new Date(),
        expires_at: new Date(Date.now() - 1000),
        revoked_at: null,
        replaced_by_token_id: null,
      })),
    });
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.refreshSession('raw');

    expect(result).toBeNull();
  });

  it('rotates refresh token and signs access token', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => ({
        id: 1,
        admin_user_id: 2,
        token_hash: 'hash',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 1000 * 60),
        revoked_at: null,
        replaced_by_token_id: null,
      })),
      getAdminById: mock(async () => ({
        id: 2,
        email: 'admin@example.com',
        password_hash: 'hash',
      })),
    });
    const token = createTokenMock({
      generateRefreshToken: mock(() => 'new-raw-refresh-token'),
      hashRefreshToken: mock(() => 'new-hash'),
      signAccessToken: mock(async () => 'new-access-token'),
    });
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.refreshSession('old-raw');

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-raw-refresh-token',
    });
    expect(repo.rotateRefreshToken).toHaveBeenCalled();
  });

  it('missing admin during refresh revokes all and returns null', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => ({
        id: 1,
        admin_user_id: 2,
        token_hash: 'hash',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 1000 * 60),
        revoked_at: null,
        replaced_by_token_id: null,
      })),
      getAdminById: mock(async () => null),
    });
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.refreshSession('raw');

    expect(result).toBeNull();
    expect(repo.revokeAllRefreshTokensForUser).toHaveBeenCalledWith(1);
  });

  it('revoke raw token revokes token row', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => ({
        id: 11,
        admin_user_id: 2,
        token_hash: 'hash',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 1000),
        revoked_at: null,
        replaced_by_token_id: null,
      })),
    });
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    await issuer.revokeRefreshTokenFromRawToken('raw');

    expect(repo.revokeRefreshToken).toHaveBeenCalledWith(11);
  });
});
