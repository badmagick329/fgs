import {
  acquireGlobalTestDbLock,
  closePool,
  createTestPool,
  ensureSchema,
  releaseGlobalTestDbLock,
  resetTables,
} from '@/test/db-test-utils';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';
import { NextResponse } from 'next/server';
import { PoolClient } from 'pg';
import { AUTH_COOKIE_KEYS } from '@/lib/consts';

mock.module('server-only', () => ({}));

/**
 * Real repository, token service and cookie writer: the bug this guards
 * against (parallel refreshes logging the admin out) lives in how they
 * interact, not in any one of them.
 */
describe('refresh session against Postgres', () => {
  const pool = createTestPool();
  let lockClient: PoolClient;
  let repo: any;
  let token: any;
  let issuer: any;
  let cookie: any;

  beforeAll(async () => {
    const { AdminRepository } =
      await import('@/features/admin/infrastructure/admin-repository');
    const { Token } = await import('@/features/admin/infrastructure/token');
    const { Cookie } = await import('@/features/admin/infrastructure/cookie');
    const { SessionIssuer } =
      await import('@/features/admin/domain/session-issuer');
    repo = new AdminRepository(pool);
    token = new Token('test-secret');
    issuer = new SessionIssuer(repo, token);
    cookie = new Cookie(false);
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  async function startSession() {
    const admin = await repo.createAdminUser('admin@example.com', 'hash', true);
    return issuer.issueAdminSession(admin);
  }

  async function liveTokenCount() {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS count FROM admin_refresh_tokens
       WHERE revoked_at IS NULL`
    );
    return res.rows[0].count as number;
  }

  /** What the browser keeps after applying each response's Set-Cookie in order. */
  function browserCookiesAfter(
    responses: { accessToken: string; refreshToken?: string }[]
  ) {
    const jar = new Map<string, string>();
    for (const refreshed of responses) {
      const res = NextResponse.json({ ok: true });
      cookie.setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
      for (const set of res.cookies.getAll()) jar.set(set.name, set.value);
    }
    return jar;
  }

  it('two concurrent refreshes both authenticate and keep the winner refresh cookie', async () => {
    const session = await startSession();

    const results = await Promise.all([
      issuer.refreshSession(session.refreshToken),
      issuer.refreshSession(session.refreshToken),
    ]);

    expect(results[0]).not.toBeNull();
    expect(results[1]).not.toBeNull();
    const winners = results.filter((r: any) => r.refreshToken !== undefined);
    expect(winners).toHaveLength(1);
    const winner = winners[0];

    for (const refreshed of results) {
      const payload = await token.verifyAccessToken(refreshed.accessToken);
      expect(await issuer.isSessionActive(payload)).toBeTrue();
    }
    // Not mistaken for reuse: the winner's token is still live.
    expect(await liveTokenCount()).toBe(1);

    for (const order of [results, [...results].reverse()]) {
      expect(browserCookiesAfter(order).get(AUTH_COOKIE_KEYS.refresh)).toBe(
        winner.refreshToken
      );
    }
    expect(await issuer.refreshSession(winner.refreshToken)).not.toBeNull();
  });

  it('replaying a token rotated over 30 s ago revokes every session', async () => {
    const session = await startSession();
    const rotated = await issuer.refreshSession(session.refreshToken);
    expect(rotated?.refreshToken).toBeDefined();
    await pool.query(
      `UPDATE admin_refresh_tokens
       SET revoked_at = NOW() - INTERVAL '31 seconds'
       WHERE replaced_by_token_id IS NOT NULL`
    );

    expect(await issuer.refreshSession(session.refreshToken)).toBeNull();
    expect(await liveTokenCount()).toBe(0);
  });

  it('replaying a token revoked by logout revokes every session', async () => {
    const session = await startSession();
    await issuer.revokeRefreshTokenFromRawToken(session.refreshToken);
    // A later login on another device, which reuse detection must also end.
    const second = await issuer.issueAdminSession(
      await repo.getAdminByEmail('admin@example.com')
    );

    expect(await issuer.refreshSession(session.refreshToken)).toBeNull();
    expect(await liveTokenCount()).toBe(0);
    expect(await issuer.refreshSession(second.refreshToken)).toBeNull();
  });
});
