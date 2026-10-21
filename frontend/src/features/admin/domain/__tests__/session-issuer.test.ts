import {
  ROTATION_GRACE_MS,
  SessionIssuer,
} from '@/features/admin/domain/session-issuer';
import {
  createAdminRepositoryMock,
  createTokenMock,
} from '@/test/mock-factories';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

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
    // The mock refresh row has id 1; the access token must name it.
    expect(token.signAccessToken).toHaveBeenCalledWith({
      sub: '9',
      email: 'admin@example.com',
      sid: 1,
    });
  });

  const liveTip = {
    id: 5,
    admin_user_id: 2,
    token_hash: 'tip-hash',
    created_at: new Date(),
    expires_at: new Date(Date.now() + 1000 * 60),
    revoked_at: null,
    replaced_by_token_id: null,
  };
  const adminTwo = { id: 2, email: 'admin@example.com', password_hash: 'h' };

  function rotatedToken(rotatedMsAgo: number) {
    return {
      id: 1,
      admin_user_id: 2,
      token_hash: 'hash',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 1000 * 60),
      revoked_at: new Date(Date.now() - rotatedMsAgo),
      replaced_by_token_id: 5,
    };
  }

  it('a lost rotation race gets access to the winning session, no refresh token', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => ({
        ...rotatedToken(0),
        revoked_at: null,
        replaced_by_token_id: null,
      })),
      rotateRefreshToken: mock(async () => null),
      getLiveSessionTip: mock(async () => liveTip),
      getAdminById: mock(async () => adminTwo),
    });
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    const result = await issuer.refreshSession('raw');

    expect(result).toEqual({ accessToken: 'signed-access-token' });
    expect(repo.getLiveSessionTip).toHaveBeenCalledWith(1);
    expect(token.signAccessToken).toHaveBeenCalledWith({
      sub: '2',
      email: 'admin@example.com',
      sid: 5,
    });
    expect(repo.revokeAllRefreshTokensForUser).not.toHaveBeenCalled();
  });

  it('a token rotated moments ago is not reuse', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => rotatedToken(5_000)),
      getLiveSessionTip: mock(async () => liveTip),
      getAdminById: mock(async () => adminTwo),
    });
    const issuer = new SessionIssuer(repo, createTokenMock());

    const result = await issuer.refreshSession('raw');

    expect(result).toEqual({ accessToken: 'signed-access-token' });
    expect(repo.rotateRefreshToken).not.toHaveBeenCalled();
    expect(repo.revokeAllRefreshTokensForUser).not.toHaveBeenCalled();
  });

  it('a token rotated outside the grace window is reuse and revokes all', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () =>
        rotatedToken(ROTATION_GRACE_MS + 1_000)
      ),
      getLiveSessionTip: mock(async () => liveTip),
    });
    const issuer = new SessionIssuer(repo, createTokenMock());

    const result = await issuer.refreshSession('raw');

    expect(result).toBeNull();
    expect(repo.revokeAllRefreshTokensForUser).toHaveBeenCalledWith(2);
  });

  it('a recently rotated token whose session has since ended gets nothing', async () => {
    const repo = createAdminRepositoryMock({
      getRefreshTokenByHash: mock(async () => rotatedToken(1_000)),
      getLiveSessionTip: mock(async () => null),
    });
    const token = createTokenMock();
    const issuer = new SessionIssuer(repo, token);

    expect(await issuer.refreshSession('raw')).toBeNull();
    expect(token.signAccessToken).not.toHaveBeenCalled();
  });

  it('a session is live only when its chain tip belongs to the same admin', async () => {
    const repo = createAdminRepositoryMock({
      getLiveSessionTip: mock(async () => liveTip),
    });
    const issuer = new SessionIssuer(repo, createTokenMock());

    const payload = { sub: '2', email: 'admin@example.com', sid: 17 };
    expect(await issuer.isSessionActive(payload)).toBeTrue();
    expect(repo.getLiveSessionTip).toHaveBeenCalledWith(17);
    expect(await issuer.isSessionActive({ ...payload, sub: '3' })).toBeFalse();
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
    // The mock rotated row: id 2, admin 1.
    expect(token.signAccessToken).toHaveBeenCalledWith({
      sub: '1',
      email: 'admin@example.com',
      sid: 2,
    });
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
